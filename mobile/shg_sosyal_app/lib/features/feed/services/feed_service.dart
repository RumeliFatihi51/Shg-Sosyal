import '../../../core/network/api_client.dart';
import '../../../data/mock/mock_feed.dart';
import '../../../data/models/feed_item_model.dart';

abstract class FeedService {
  Future<List<FeedItemModel>> fetchFeed({String filter = 'for-you'});
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
}

class ApiFeedService implements FeedService {
  const ApiFeedService(this._api);

  final ApiClient _api;

  @override
  Future<List<FeedItemModel>> fetchFeed({String filter = 'for-you'}) async {
    await _api.get('/feed', queryParameters: {'filter': filter});
    // TODO: Map backend DTOs to FeedItemModel when the Ubuntu API contract is final.
    throw UnimplementedError('ApiFeedService DTO mapping is not connected yet.');
  }
}
