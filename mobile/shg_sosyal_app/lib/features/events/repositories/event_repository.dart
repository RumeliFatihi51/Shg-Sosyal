import '../../../data/models/event_model.dart';
import '../services/event_service.dart';

class EventRepository {
  const EventRepository(this._service);

  final EventService _service;

  Future<List<EventModel>> getEvents({String tab = 'upcoming'}) {
    return _service.fetchEvents(tab: tab);
  }

  Future<EventModel?> getEventById(String id) => _service.fetchEventById(id);
}
