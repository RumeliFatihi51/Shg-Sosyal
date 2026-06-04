import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/models/event_model.dart';
import '../repositories/event_repository.dart';
import '../services/event_service.dart';

final eventTabProvider = StateProvider<String>((ref) => 'upcoming');

final eventServiceProvider = Provider<EventService>((ref) => MockEventService());

final eventRepositoryProvider = Provider<EventRepository>(
  (ref) => EventRepository(ref.watch(eventServiceProvider)),
);

final eventsProvider = FutureProvider<List<EventModel>>((ref) {
  final tab = ref.watch(eventTabProvider);
  return ref.watch(eventRepositoryProvider).getEvents(tab: tab);
});

final eventDetailProvider = FutureProvider.family<EventModel?, String>((ref, id) {
  return ref.watch(eventRepositoryProvider).getEventById(id);
});
