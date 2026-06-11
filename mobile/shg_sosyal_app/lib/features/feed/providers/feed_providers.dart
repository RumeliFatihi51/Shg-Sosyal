import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/storage/local_storage.dart';
import '../../../data/mock/mock_communities.dart';
import '../../../data/models/community_model.dart';
import '../../../data/models/feed_item_model.dart';
import '../../../data/models/user_model.dart';
import '../repositories/feed_repository.dart';
import '../services/feed_service.dart';

final feedFilterProvider = StateProvider<String>((ref) => 'for-you');

final feedServiceProvider = Provider<FeedService>((ref) {
  const useApi = bool.fromEnvironment('SHG_USE_API', defaultValue: true);
  if (useApi) return ApiFeedService(ApiClient());
  return MockFeedService();
});

final feedRepositoryProvider = Provider<FeedRepository>(
  (ref) => FeedRepository(ref.watch(feedServiceProvider)),
);

final feedControllerProvider =
    StateNotifierProvider<FeedController, AsyncValue<List<FeedItemModel>>>(
  (ref) => FeedController(ref.watch(feedRepositoryProvider))..load(),
);

final feedItemsProvider = Provider<AsyncValue<List<FeedItemModel>>>((ref) {
  return ref.watch(feedControllerProvider);
});

final postDetailProvider = Provider.family<FeedItemModel?, String>((ref, id) {
  return ref
      .watch(feedControllerProvider)
      .valueOrNull
      ?.where((item) => item.id == id)
      .firstOrNull;
});

class FeedController extends StateNotifier<AsyncValue<List<FeedItemModel>>> {
  FeedController(this._repository) : super(const AsyncValue.loading());

  static const _cacheKey = 'local_feed_posts_v1';

  final FeedRepository _repository;
  final LocalStorage _storage = LocalStorage();

  Future<void> load({String filter = 'for-you'}) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final cachedPosts = await _readCachedPosts();
      try {
        final items = await _repository.getFeed(filter: filter);
        final cleanItems = items.where((item) => !item.isDeleted).toList();
        await _writeCachedPosts(cleanItems.take(40).toList());
        return cleanItems;
      } catch (_) {
        if (cachedPosts.isNotEmpty) return cachedPosts;
        rethrow;
      }
    });
  }

  Future<void> addPost({
    required UserModel author,
    required CommunityModel community,
    required String content,
    Uint8List? imageBytes,
    String? imageMimeType,
  }) async {
    final trimmed = content.trim();
    if (trimmed.isEmpty) return;
    final post = (await _repository.createPost(
      author: author,
      community: community,
      content: trimmed,
      imageBytes: imageBytes,
      imageMimeType: imageMimeType,
    ))
        .copyWith(localImageBytes: imageBytes);
    final current = state.valueOrNull ?? const <FeedItemModel>[];
    state = AsyncValue.data([post, ...current]);
    await _writeCachedPosts([post, ...current]);
  }

  Future<void> addPoll({
    required UserModel author,
    required CommunityModel community,
    required String question,
    required List<String> options,
  }) async {
    final trimmed = question.trim();
    final cleanOptions = options
        .map((option) => option.trim())
        .where((option) => option.length >= 2)
        .toList();
    if (trimmed.length < 3 || cleanOptions.length < 2) return;
    final poll = await _repository.createPoll(
      author: author,
      community: community,
      question: trimmed,
      options: cleanOptions,
    );
    final current = state.valueOrNull ?? const <FeedItemModel>[];
    state = AsyncValue.data([poll, ...current]);
    await _writeCachedPosts([poll, ...current]);
  }

  Future<void> toggleLike(String id) async {
    _updateItem(id, (item) {
      final liked = !item.isLiked;
      return item.copyWith(
        isLiked: liked,
        likeCount: (item.likeCount + (liked ? 1 : -1)).clamp(0, 999999),
      );
    });
    await _persistLocalItems();
  }

  Future<void> addComment({
    required String postId,
    required UserModel author,
    required String content,
  }) async {
    final trimmed = content.trim();
    if (trimmed.isEmpty) return;
    _updateItem(postId, (item) {
      return item.copyWith(
        comments: [
          ...item.comments,
          FeedCommentModel(
            id: 'comment-${DateTime.now().microsecondsSinceEpoch}',
            author: author,
            content: trimmed,
            createdAt: DateTime.now(),
          ),
        ],
      );
    });
    await _persistLocalItems();
  }

  Future<void> editPost(String id, String content) async {
    final trimmed = content.trim();
    if (trimmed.length < 3) return;
    _updateItem(id,
        (item) => item.copyWith(content: trimmed, editedAt: DateTime.now()));
    await _persistLocalItems();
  }

  Future<void> deletePost(String id) async {
    _updateItem(id, (item) => item.copyWith(isDeleted: true));
    state = AsyncValue.data(
      (state.valueOrNull ?? const <FeedItemModel>[])
          .where((item) => !item.isDeleted)
          .toList(),
    );
    await _persistLocalItems();
  }

  void _updateItem(
      String id, FeedItemModel Function(FeedItemModel item) update) {
    final current = state.valueOrNull ?? const <FeedItemModel>[];
    state = AsyncValue.data([
      for (final item in current) item.id == id ? update(item) : item,
    ]);
  }

  Future<void> _persistLocalItems() async {
    await _writeCachedPosts(
      (state.valueOrNull ?? const <FeedItemModel>[])
          .where((item) =>
              item.type == FeedItemType.post || item.type == FeedItemType.poll)
          .toList(),
    );
  }

  Future<List<FeedItemModel>> _readCachedPosts() async {
    final raw = await _storage.readString(_cacheKey);
    if (raw == null || raw.isEmpty) return const [];
    final decoded = jsonDecode(raw);
    if (decoded is! List) return const [];
    return decoded.whereType<Map<String, dynamic>>().map((json) {
      final communityId = json['community_id'] as String?;
      final community = mockCommunities.firstWhere(
        (item) => item.id == communityId,
        orElse: () => mockCommunities.first,
      );
      final typeName = json['type'] as String? ?? FeedItemType.post.name;
      final type = FeedItemType.values.firstWhere(
        (item) => item.name == typeName,
        orElse: () => FeedItemType.post,
      );
      return FeedItemModel(
        id: json['id'] as String,
        type: type,
        author: UserModel(
          id: json['author_id'] as String,
          fullName: json['author_name'] as String,
          username: json['author_username'] as String,
          email: '',
          className: '',
          points: 0,
        ),
        title: json['title'] as String?,
        content: json['content'] as String,
        createdAt: DateTime.tryParse(json['created_at'] as String? ?? '') ??
            DateTime.now(),
        community: community,
        likeCount: json['like_count'] as int? ?? 0,
        isLiked: json['is_liked'] as bool? ?? false,
        editedAt: DateTime.tryParse(json['edited_at'] as String? ?? ''),
        pollOptions: [
          for (final option in (json['poll_options'] as List? ?? const [])
              .whereType<Map<String, dynamic>>())
            PollOptionModel(
              id: option['id'] as String,
              label: option['label'] as String,
              voteCount: option['vote_count'] as int? ?? 0,
            ),
        ],
        comments: [
          for (final comment in (json['comments'] as List? ?? const [])
              .whereType<Map<String, dynamic>>())
            FeedCommentModel(
              id: comment['id'] as String,
              author: UserModel(
                id: comment['author_id'] as String,
                fullName: comment['author_name'] as String,
                username: comment['author_username'] as String,
                email: '',
                className: '',
                points: 0,
              ),
              content: comment['content'] as String,
              createdAt:
                  DateTime.tryParse(comment['created_at'] as String? ?? '') ??
                      DateTime.now(),
            ),
        ],
      );
    }).toList();
  }

  Future<void> _writeCachedPosts(List<FeedItemModel> items) async {
    final encoded = jsonEncode([
      for (final item in items.where((item) =>
          item.type == FeedItemType.post || item.type == FeedItemType.poll))
        {
          'id': item.id,
          'author_id': item.author.id,
          'author_name': item.author.fullName,
          'author_username': item.author.username,
          'community_id': item.community?.id,
          'content': item.content,
          'created_at': item.createdAt.toIso8601String(),
          'edited_at': item.editedAt?.toIso8601String(),
          'like_count': item.likeCount,
          'is_liked': item.isLiked,
          'type': item.type.name,
          'title': item.title,
          'poll_options': [
            for (final option in item.pollOptions)
              {
                'id': option.id,
                'label': option.label,
                'vote_count': option.voteCount,
              },
          ],
          'comments': [
            for (final comment in item.comments)
              {
                'id': comment.id,
                'author_id': comment.author.id,
                'author_name': comment.author.fullName,
                'author_username': comment.author.username,
                'content': comment.content,
                'created_at': comment.createdAt.toIso8601String(),
              },
          ],
        },
    ]);
    await _storage.writeString(_cacheKey, encoded);
  }
}
