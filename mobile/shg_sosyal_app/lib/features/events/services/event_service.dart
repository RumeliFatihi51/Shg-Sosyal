import '../../../data/mock/mock_events.dart';
import '../../../data/models/event_model.dart';

abstract class EventService {
  Future<List<EventModel>> fetchEvents({String tab = 'upcoming'});
  Future<EventModel?> fetchEventById(String id);
}

class MockEventService implements EventService {
  @override
  Future<List<EventModel>> fetchEvents({String tab = 'upcoming'}) async {
    await Future<void>.delayed(const Duration(milliseconds: 160));
    if (tab == 'joined') {
      return mockEvents
          .where((event) => event.myStatus == EventParticipationStatus.going)
          .toList();
    }
    if (tab == 'today') {
      final now = DateTime.now();
      return mockEvents
          .where(
            (event) =>
                event.startsAt.year == now.year &&
                event.startsAt.month == now.month &&
                event.startsAt.day == now.day,
          )
          .toList();
    }
    return mockEvents;
  }

  @override
  Future<EventModel?> fetchEventById(String id) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    for (final event in mockEvents) {
      if (event.id == id) return event;
    }
    return null;
  }
}
