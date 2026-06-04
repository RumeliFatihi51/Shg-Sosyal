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
