import 'dart:typed_data';

import '../../../data/models/event_model.dart';
import '../services/event_service.dart';

class EventRepository {
  const EventRepository(this._service);

  final EventService _service;

  Future<List<EventModel>> getEvents({String tab = 'upcoming'}) {
    return _service.fetchEvents(tab: tab);
  }

  Future<EventModel?> getEventById(String id) => _service.fetchEventById(id);

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
  }) {
    return _service.createEvent(
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
  }

  Future<EventModel> setParticipation(
      String eventId, EventParticipationStatus status) {
    return _service.setParticipation(eventId, status);
  }
}
