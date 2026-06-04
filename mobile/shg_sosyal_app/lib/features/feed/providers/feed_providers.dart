import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/models/community_model.dart';
import '../../../data/models/feed_item_model.dart';
import '../../../data/models/user_model.dart';
import '../repositories/feed_repository.dart';
import '../services/feed_service.dart';

final feedFilterProvider = StateProvider<String>((ref) => 'for-you');

final feedServiceProvider = Provider<FeedService>((ref) => MockFeedService());

final feedRepositoryProvider = Provider<FeedRepository>(
  (ref) => FeedRepository(ref.watch(feedServiceProvider)),
);

final localFeedPostsProvider =
    StateNotifierProvider<LocalFeedPostsController, List<FeedItemModel>>(
  (ref) => LocalFeedPostsController(),
);

final feedItemsProvider = FutureProvider<List<FeedItemModel>>((ref) {
  final filter = ref.watch(feedFilterProvider);
  final localPosts = ref.watch(localFeedPostsProvider);
  return ref.watch(feedRepositoryProvider).getFeed(filter: filter).then(
        (items) => [...localPosts, ...items],
      );
});

class LocalFeedPostsController extends StateNotifier<List<FeedItemModel>> {
  LocalFeedPostsController() : super(const []);

  void addPost({
    required UserModel author,
    required CommunityModel community,
    required String content,
  }) {
    final trimmed = content.trim();
    if (trimmed.isEmpty) return;

    state = [
      FeedItemModel(
        id: 'local-${DateTime.now().microsecondsSinceEpoch}',
        type: FeedItemType.post,
        author: author,
        content: trimmed,
        createdAt: DateTime.now(),
        community: community,
      ),
      ...state,
    ];
  }
}
