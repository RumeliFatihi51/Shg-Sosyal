import 'dart:convert';
import 'dart:typed_data';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_mappers.dart';
import '../../../data/mock/mock_events.dart';
import '../../../data/models/event_model.dart';

abstract class EventService {
  Future<List<EventModel>> fetchEvents({String tab = 'upcoming'});
  Future<EventModel?> fetchEventById(String id);
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
  });
  Future<EventModel> setParticipation(
      String eventId, EventParticipationStatus status);
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

  @override
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
    await Future<void>.delayed(const Duration(milliseconds: 220));
    final event = EventModel(
      id: 'local-event-${DateTime.now().microsecondsSinceEpoch}',
      title: title,
      description: description,
      startsAt: startsAt,
      endsAt: startsAt.add(const Duration(hours: 1)),
      location: location,
      communityId: communityId ?? '',
      organizerName: 'ŞHG Sosyal',
      participantCount: 0,
      friendParticipants: const [],
      status: EventStatus.pending,
      myStatus: EventParticipationStatus.none,
      category: parseEventCategory(category),
      capacity: capacity,
    );
    mockEvents.insert(0, event);
    return event;
  }

  @override
  Future<EventModel> setParticipation(
      String eventId, EventParticipationStatus status) async {
    await Future<void>.delayed(const Duration(milliseconds: 160));
    final index = mockEvents.indexWhere((event) => event.id == eventId);
    if (index == -1) throw StateError('Etkinlik bulunamadı.');
    final current = mockEvents[index];
    final wasGoing = current.myStatus == EventParticipationStatus.going;
    final isGoing = status == EventParticipationStatus.going;
    final updated = EventModel(
      id: current.id,
      title: current.title,
      description: current.description,
      startsAt: current.startsAt,
      endsAt: current.endsAt,
      location: current.location,
      communityId: current.communityId,
      organizerName: current.organizerName,
      participantCount: (current.participantCount +
              (isGoing && !wasGoing
                  ? 1
                  : !isGoing && wasGoing
                      ? -1
                      : 0))
          .clamp(0, 999999),
      capacity: current.capacity,
      friendParticipants: current.friendParticipants,
      status: current.status,
      myStatus: status,
      category: current.category,
    );
    mockEvents[index] = updated;
    return updated;
  }
}

class ApiEventService implements EventService {
  const ApiEventService(this._api);

  final ApiClient _api;

  @override
  Future<List<EventModel>> fetchEvents({String tab = 'upcoming'}) async {
    final response = await _api.get('/events', queryParameters: {'tab': tab});
    return apiList(response.data).map(eventFromJson).toList();
  }

  @override
  Future<EventModel?> fetchEventById(String id) async {
    final response = await _api.get('/events/$id');
    final data = apiData(response.data);
    return data.isEmpty ? null : eventFromJson(data);
  }

  @override
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
    final response = await _api.post(
      '/events',
      data: {
        'title': title,
        'description': description,
        'location': location,
        'starts_at': startsAt.toIso8601String(),
        'community_id': communityId,
        'capacity': capacity,
        'category': category,
        if (imageBytes != null) 'image_base64': base64Encode(imageBytes),
        if (imageBytes != null)
          'image_mime_type': imageMimeType ?? 'image/jpeg',
      },
    );
    return eventFromJson(apiData(response.data));
  }

  @override
  Future<EventModel> setParticipation(
      String eventId, EventParticipationStatus status) async {
    final response = await _api.post(
      '/events/$eventId/participation',
      data: {'status': _participationToApi(status)},
    );
    return eventFromJson(apiData(response.data));
  }

  String _participationToApi(EventParticipationStatus status) {
    return switch (status) {
      EventParticipationStatus.interested => 'interested',
      EventParticipationStatus.going => 'going',
      EventParticipationStatus.notGoing => 'not_going',
      EventParticipationStatus.none => 'not_going',
    };
  }
}
