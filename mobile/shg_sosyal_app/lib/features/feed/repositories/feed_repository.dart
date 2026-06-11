import 'dart:typed_data';

import '../../../data/models/feed_item_model.dart';
import '../../../data/models/community_model.dart';
import '../../../data/models/user_model.dart';
import '../services/feed_service.dart';

class FeedRepository {
  const FeedRepository(this._service);

  final FeedService _service;

  Future<List<FeedItemModel>> getFeed({String filter = 'for-you'}) {
    return _service.fetchFeed(filter: filter);
  }

  Future<FeedItemModel> createPost({
    required UserModel author,
    required CommunityModel community,
    required String content,
    Uint8List? imageBytes,
    String? imageMimeType,
  }) {
    return _service.createPost(
      author: author,
      community: community,
      content: content,
      imageBytes: imageBytes,
      imageMimeType: imageMimeType,
    );
  }

  Future<FeedItemModel> createPoll({
    required UserModel author,
    required CommunityModel community,
    required String question,
    required List<String> options,
  }) {
    return _service.createPoll(
      author: author,
      community: community,
      question: question,
      options: options,
    );
  }
}
