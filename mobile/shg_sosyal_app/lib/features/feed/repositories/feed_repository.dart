import '../../../data/models/feed_item_model.dart';
import '../services/feed_service.dart';

class FeedRepository {
  const FeedRepository(this._service);

  final FeedService _service;

  Future<List<FeedItemModel>> getFeed({String filter = 'for-you'}) {
    return _service.fetchFeed(filter: filter);
  }
}
