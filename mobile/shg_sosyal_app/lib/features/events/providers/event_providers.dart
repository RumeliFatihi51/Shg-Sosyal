import 'dart:typed_data';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../data/models/event_model.dart';
import '../repositories/event_repository.dart';
import '../services/event_service.dart';

final eventTabProvider = StateProvider<String>((ref) => 'upcoming');

final eventServiceProvider = Provider<EventService>((ref) {
  const useApi = bool.fromEnvironment('SHG_USE_API', defaultValue: true);
  if (useApi) return ApiEventService(ApiClient());
  return MockEventService();
});

final eventRepositoryProvider = Provider<EventRepository>(
  (ref) => EventRepository(ref.watch(eventServiceProvider)),
);

final eventsProvider = FutureProvider<List<EventModel>>((ref) {
  final tab = ref.watch(eventTabProvider);
  return ref.watch(eventRepositoryProvider).getEvents(tab: tab);
});

final eventDetailProvider =
    FutureProvider.family<EventModel?, String>((ref, id) {
  return ref.watch(eventRepositoryProvider).getEventById(id);
});

final eventActionControllerProvider =
    StateNotifierProvider<EventActionController, AsyncValue<void>>(
  (ref) => EventActionController(ref),
);

class EventActionController extends StateNotifier<AsyncValue<void>> {
  EventActionController(this._ref) : super(const AsyncValue.data(null));

  final Ref _ref;

  EventRepository get _repository => _ref.read(eventRepositoryProvider);

  Future<EventModel> createEvent({
    required String title,
    required String description,
    required String location,
    required DateTime startsAt,
    String? communityId,
    int? capacity,
    String? category,
    Uint8List? imageBytes,
    String? imageMimeType,
  }) async {
    state = const AsyncValue.loading();
    try {
      final event = await _repository.createEvent(
        title: title,
        description: description,
        location: location,
        startsAt: startsAt,
        communityId: communityId,
        capacity: capacity,
        category: category,
        imageBytes: imageBytes,
        imageMimeType: imageMimeType,
      );
      _ref.invalidate(eventsProvider);
      _ref.invalidate(eventDetailProvider(event.id));
      state = const AsyncValue.data(null);
      return event;
    } catch (error, stack) {
      state = AsyncValue.error(error, stack);
      rethrow;
    }
  }

  Future<EventModel> setParticipation(
      String eventId, EventParticipationStatus status) async {
    state = const AsyncValue.loading();
    try {
      final event = await _repository.setParticipation(eventId, status);
      _ref.invalidate(eventsProvider);
      _ref.invalidate(eventDetailProvider(eventId));
      state = const AsyncValue.data(null);
      return event;
    } catch (error, stack) {
      state = AsyncValue.error(error, stack);
      rethrow;
    }
  }
}
