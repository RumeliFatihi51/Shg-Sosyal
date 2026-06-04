import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/models/feed_item_model.dart';
import '../repositories/feed_repository.dart';
import '../services/feed_service.dart';

final feedFilterProvider = StateProvider<String>((ref) => 'for-you');

final feedServiceProvider = Provider<FeedService>((ref) => MockFeedService());

final feedRepositoryProvider = Provider<FeedRepository>(
  (ref) => FeedRepository(ref.watch(feedServiceProvider)),
);

final feedItemsProvider = FutureProvider<List<FeedItemModel>>((ref) {
  final filter = ref.watch(feedFilterProvider);
  return ref.watch(feedRepositoryProvider).getFeed(filter: filter);
});
