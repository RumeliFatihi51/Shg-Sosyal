import 'dart:convert';
import 'dart:typed_data';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_mappers.dart';
import '../../../data/mock/mock_feed.dart';
import '../../../data/models/community_model.dart';
import '../../../data/models/feed_item_model.dart';
import '../../../data/models/user_model.dart';

abstract class FeedService {
  Future<List<FeedItemModel>> fetchFeed({String filter = 'for-you'});
  Future<FeedItemModel> createPost({
    required UserModel author,
    required CommunityModel community,
    required String content,
    Uint8List? imageBytes,
    String? imageMimeType,
  });
  Future<FeedItemModel> createPoll({
    required UserModel author,
    required CommunityModel community,
    required String question,
    required List<String> options,
  });
}

class MockFeedService implements FeedService {
  @override
  Future<List<FeedItemModel>> fetchFeed({String filter = 'for-you'}) async {
    await Future<void>.delayed(const Duration(milliseconds: 180));
    if (filter == 'events') {
      return mockFeedItems.where((item) => item.event != null).toList();
    }
    if (filter == 'communities') {
      return mockFeedItems.where((item) => item.community != null).toList();
    }
    return mockFeedItems;
  }

  @override
  Future<FeedItemModel> createPost({
    required UserModel author,
    required CommunityModel community,
    required String content,
    Uint8List? imageBytes,
    String? imageMimeType,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 180));
    final post = FeedItemModel(
      id: 'local-${DateTime.now().microsecondsSinceEpoch}',
      type: FeedItemType.post,
      author: author,
      content: content,
      createdAt: DateTime.now(),
      community: community,
      localImageBytes: imageBytes,
    );
    mockFeedItems.insert(0, post);
    return post;
  }

  @override
  Future<FeedItemModel> createPoll({
    required UserModel author,
    required CommunityModel community,
    required String question,
    required List<String> options,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 180));
    final poll = FeedItemModel(
      id: 'local-poll-${DateTime.now().microsecondsSinceEpoch}',
      type: FeedItemType.poll,
      author: author,
      title: question,
      content: community.name,
      createdAt: DateTime.now(),
      community: community,
      pollOptions: [
        for (var index = 0; index < options.length; index++)
          PollOptionModel(
            id: 'local-option-$index',
            label: options[index],
            voteCount: 0,
          ),
      ],
    );
    mockFeedItems.insert(0, poll);
    return poll;
  }
}

class ApiFeedService implements FeedService {
  const ApiFeedService(this._api);

  final ApiClient _api;

  @override
  Future<List<FeedItemModel>> fetchFeed({String filter = 'for-you'}) async {
    final response =
        await _api.get('/feed', queryParameters: {'filter': filter});
    return apiList(response.data).map(feedItemFromJson).toList();
  }

  @override
  Future<FeedItemModel> createPost({
    required UserModel author,
    required CommunityModel community,
    required String content,
    Uint8List? imageBytes,
    String? imageMimeType,
  }) async {
    final response = await _api.post(
      '/feed/posts',
      data: {
        'community_id': community.id,
        'content': content,
        if (imageBytes != null) 'image_base64': base64Encode(imageBytes),
        if (imageBytes != null)
          'image_mime_type': imageMimeType ?? 'image/jpeg',
      },
    );
    return feedItemFromJson(apiData(response.data));
  }

  @override
  Future<FeedItemModel> createPoll({
    required UserModel author,
    required CommunityModel community,
    required String question,
    required List<String> options,
  }) async {
    final response = await _api.post(
      '/feed/polls',
      data: {
        'community_id': community.id,
        'question': question,
        'options': options,
      },
    );
    return feedItemFromJson(apiData(response.data));
  }
}
