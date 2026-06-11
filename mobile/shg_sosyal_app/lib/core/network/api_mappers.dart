import '../../data/models/badge_model.dart';
import '../../data/models/community_model.dart';
import '../../data/models/event_model.dart';
import '../../data/models/feed_item_model.dart';
import '../../data/models/message_model.dart';
import '../../data/models/notification_model.dart';
import '../../data/models/user_model.dart';
import '../../data/models/conversation_model.dart';

Map<String, dynamic> apiMap(Object? value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) return value.map((key, value) => MapEntry('$key', value));
  return const <String, dynamic>{};
}

List<Map<String, dynamic>> apiList(Object? value) {
  final payload = apiMap(value);
  final data = payload.containsKey('data') ? payload['data'] : value;
  if (data is List) return data.map(apiMap).toList();
  return const <Map<String, dynamic>>[];
}

Map<String, dynamic> apiData(Object? value) {
  final payload = apiMap(value);
  return apiMap(payload.containsKey('data') ? payload['data'] : value);
}

String apiString(Object? value, [String fallback = '']) {
  if (value == null) return fallback;
  return '$value';
}

int apiInt(Object? value, [int fallback = 0]) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(apiString(value)) ?? fallback;
}

bool apiBool(Object? value, [bool fallback = false]) {
  if (value is bool) return value;
  if (value is num) return value != 0;
  final text = apiString(value).toLowerCase();
  if (text == 'true') return true;
  if (text == 'false') return false;
  return fallback;
}

DateTime apiDate(Object? value) {
  return DateTime.tryParse(apiString(value)) ?? DateTime.now();
}

DateTime? apiNullableDate(Object? value) {
  final text = apiString(value);
  if (text.isEmpty) return null;
  return DateTime.tryParse(text);
}

UserRole parseUserRole(Object? value) {
  return switch (apiString(value)) {
    'admin' => UserRole.admin,
    'moderator' => UserRole.admin,
    'community_admin' => UserRole.communityAdmin,
    'communityAdmin' => UserRole.communityAdmin,
    'teacher' => UserRole.teacher,
    _ => UserRole.student,
  };
}

UserModel userFromJson(Object? value) {
  final json = apiMap(value);
  final firstName = apiString(json['first_name']);
  final lastName = apiString(json['last_name']);
  final fullName = apiString(
    json['full_name'],
    [firstName, lastName]
        .where((part) => part.trim().isNotEmpty)
        .join(' ')
        .trim(),
  );
  final username =
      apiString(json['tag'], apiString(json['username'], '@ogrenci'));
  return UserModel(
    id: apiString(json['id']),
    fullName: fullName.isEmpty ? username.replaceFirst('@', '') : fullName,
    username: username.startsWith('@') ? username : '@$username',
    email: apiString(json['email']),
    className: apiString(json['class_name']),
    avatarUrl: json['avatar_url'] as String?,
    bio: json['bio'] as String?,
    points: apiInt(json['points'] ?? json['participation_points']),
    role: parseUserRole(json['role']),
    isSuspended: apiBool(json['is_suspended']),
  );
}

CommunityModel communityFromJson(Object? value) {
  final json = apiMap(value);
  return CommunityModel(
    id: apiString(json['id']),
    name: apiString(json['name'], 'Topluluk'),
    description: apiString(json['description']),
    avatarUrl: json['avatar_url'] as String?,
    memberCount: apiInt(json['member_count']),
    postCount: apiInt(json['post_count']),
    isJoined: apiBool(json['is_joined']),
    lastActivityAt: apiDate(
        json['last_activity_at'] ?? json['updated_at'] ?? json['created_at']),
    category: apiString(json['category'], 'Topluluk'),
    adminIds: [
      for (final id in (json['admin_ids'] as List? ?? const [])) apiString(id),
    ],
    memberIds: [
      for (final id in (json['member_ids'] as List? ?? const [])) apiString(id),
    ],
  );
}

EventStatus parseEventStatus(Object? value) {
  return switch (apiString(value)) {
    'pending' => EventStatus.pending,
    'rejected' => EventStatus.rejected,
    'cancelled' || 'canceled' => EventStatus.cancelled,
    'postponed' => EventStatus.postponed,
    _ => EventStatus.approved,
  };
}

EventParticipationStatus parseParticipationStatus(Object? value) {
  return switch (apiString(value)) {
    'interested' => EventParticipationStatus.interested,
    'going' => EventParticipationStatus.going,
    'not_going' => EventParticipationStatus.notGoing,
    _ => EventParticipationStatus.none,
  };
}

EventCategory parseEventCategory(Object? value) {
  return switch (apiString(value)) {
    'sport' || 'Spor' => EventCategory.sport,
    'workshop' || 'Atölye' => EventCategory.workshop,
    'social' || 'Sosyal' => EventCategory.social,
    'competition' || 'Yarışma' => EventCategory.competition,
    'science' || 'Bilim' => EventCategory.science,
    'art' || 'Sanat' => EventCategory.art,
    _ => EventCategory.club,
  };
}

EventModel eventFromJson(Object? value) {
  final json = apiMap(value);
  final startsAt = apiDate(json['starts_at'] ?? json['event_date']);
  final endsAt = apiNullableDate(json['ends_at']) ??
      startsAt.add(const Duration(hours: 1));
  return EventModel(
    id: apiString(json['id']),
    title: apiString(json['title'], 'Etkinlik'),
    description: apiString(json['description']),
    startsAt: startsAt,
    endsAt: endsAt,
    location: apiString(json['location']),
    communityId: apiString(json['community_id']),
    organizerName: apiString(
        json['organizer_name'] ?? json['community_name'], 'ŞHG Sosyal'),
    participantCount: apiInt(json['participant_count']),
    capacity: json['capacity'] == null ? null : apiInt(json['capacity']),
    friendParticipants: [
      for (final friend in (json['friend_participants'] as List? ?? const []))
        userFromJson(friend),
    ],
    status: parseEventStatus(json['status']),
    myStatus: parseParticipationStatus(json['my_status']),
    category: parseEventCategory(json['category']),
  );
}

FeedItemType parseFeedType(Object? value) {
  return switch (apiString(value)) {
    'event' => FeedItemType.event,
    'announcement' => FeedItemType.announcement,
    'poll' => FeedItemType.poll,
    'friend_activity' => FeedItemType.friendActivity,
    'badge' => FeedItemType.badge,
    'leaderboard' => FeedItemType.leaderboard,
    _ => FeedItemType.post,
  };
}

FeedItemModel feedItemFromJson(Object? value) {
  final json = apiMap(value);
  return FeedItemModel(
    id: apiString(json['id']),
    type: parseFeedType(json['type']),
    author: userFromJson(json['author']),
    title: json['title'] as String?,
    content: apiString(json['content'] ?? json['body']),
    createdAt: apiDate(json['created_at']),
    event: json['event'] == null ? null : eventFromJson(json['event']),
    community:
        json['community'] == null ? null : communityFromJson(json['community']),
    badge: json['badge'] == null
        ? null
        : BadgeModel(
            id: apiString(apiMap(json['badge'])['id']),
            code: apiString(apiMap(json['badge'])['code']),
            name: apiString(apiMap(json['badge'])['name']),
            description: apiString(apiMap(json['badge'])['description']),
            icon: apiString(apiMap(json['badge'])['icon']),
            category: apiString(apiMap(json['badge'])['category']),
            isEarned: apiBool(apiMap(json['badge'])['is_earned']),
            earnedAt: apiNullableDate(apiMap(json['badge'])['earned_at']),
          ),
    pollOptions: [
      for (final option in (json['poll_options'] as List? ?? const []))
        PollOptionModel(
          id: apiString(apiMap(option)['id']),
          label: apiString(apiMap(option)['label']),
          voteCount: apiInt(apiMap(option)['vote_count']),
        ),
    ],
    likeCount: apiInt(json['like_count']),
    commentCount: apiInt(json['comment_count']),
    isLiked: apiBool(json['is_liked']),
    imageUrl: json['image_url'] as String?,
    editedAt: apiNullableDate(json['edited_at']),
    isDeleted: apiBool(json['is_deleted']),
    comments: [
      for (final comment in (json['comments'] as List? ?? const []))
        FeedCommentModel(
          id: apiString(apiMap(comment)['id']),
          author: userFromJson(apiMap(comment)['author']),
          content: apiString(apiMap(comment)['content']),
          createdAt: apiDate(apiMap(comment)['created_at']),
        ),
    ],
  );
}

MessageModel messageFromJson(Object? value, {String? currentUserId}) {
  final json = apiMap(value);
  final senderId = apiString(json['sender_id']);
  final deletedAt = apiNullableDate(json['deleted_at']);
  return MessageModel(
    id: apiString(json['id']),
    conversationId: apiString(json['conversation_id']),
    senderId: senderId,
    content:
        deletedAt == null ? apiString(json['content']) : 'Bu mesaj silindi.',
    createdAt: apiDate(json['created_at']),
    isMine: currentUserId != null && senderId == currentUserId,
    editedAt: apiNullableDate(json['edited_at']),
    deletedAt: deletedAt,
  );
}

ConversationModel conversationFromJson(Object? value, {String? currentUserId}) {
  final json = apiMap(value);
  final last =
      messageFromJson(json['last_message'], currentUserId: currentUserId);
  return ConversationModel(
    id: apiString(json['id'] ?? json['conversation_id']),
    otherUser: userFromJson(json['other_user']),
    lastMessage: last,
    lastMessageAt: apiDate(json['last_message_at'] ?? json['updated_at']),
    unreadCount: apiInt(json['unread_count']),
  );
}

NotificationType parseNotificationType(Object? value) {
  return switch (apiString(value)) {
    'friend_request' => NotificationType.friendRequest,
    'dm_message' || 'message' => NotificationType.message,
    'event_reminder' || 'daily_events' => NotificationType.eventReminder,
    'community_post' || 'community' => NotificationType.community,
    'badge' => NotificationType.badge,
    'leaderboard' => NotificationType.leaderboard,
    _ => NotificationType.community,
  };
}

NotificationModel notificationFromJson(Object? value) {
  final json = apiMap(value);
  return NotificationModel(
    id: apiString(json['id']),
    type: parseNotificationType(json['type']),
    title: apiString(json['title']),
    body: apiString(json['body']),
    createdAt: apiDate(json['created_at']),
    isRead: json['is_read'] == null
        ? json['read_at'] != null
        : apiBool(json['is_read']),
    targetRoute: json['target_route'] as String? ?? json['href'] as String?,
  );
}
