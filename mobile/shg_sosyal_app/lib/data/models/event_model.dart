import 'user_model.dart';

enum EventStatus { pending, approved, rejected, cancelled, postponed }

enum EventParticipationStatus { none, interested, going, notGoing }

enum EventCategory { sport, club, workshop, social, competition, science, art }

class EventModel {
  const EventModel({
    required this.id,
    required this.title,
    required this.description,
    required this.startsAt,
    required this.endsAt,
    required this.location,
    required this.communityId,
    required this.organizerName,
    required this.participantCount,
    required this.friendParticipants,
    required this.status,
    required this.myStatus,
    required this.category,
    this.capacity,
  });

  final String id;
  final String title;
  final String description;
  final DateTime startsAt;
  final DateTime endsAt;
  final String location;
  final String communityId;
  final String organizerName;
  final int participantCount;
  final int? capacity;
  final List<UserModel> friendParticipants;
  final EventStatus status;
  final EventParticipationStatus myStatus;
  final EventCategory category;
}
