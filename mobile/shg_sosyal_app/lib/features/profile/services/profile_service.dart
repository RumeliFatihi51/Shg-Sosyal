import '../../../data/mock/mock_badges.dart';
import '../../../data/mock/mock_communities.dart';
import '../../../data/mock/mock_events.dart';
import '../../../data/mock/mock_users.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_mappers.dart';
import '../../../data/models/badge_model.dart';
import '../../../data/models/community_model.dart';
import '../../../data/models/event_model.dart';
import '../../../data/models/user_model.dart';

class ProfileSummary {
  const ProfileSummary({
    required this.user,
    required this.badges,
    required this.events,
    required this.communities,
  });

  final UserModel user;
  final List<BadgeModel> badges;
  final List<EventModel> events;
  final List<CommunityModel> communities;
}

abstract class ProfileService {
  Future<ProfileSummary> fetchProfile(String id);
  Future<UserModel> updateProfile({
    required String fullName,
    required String bio,
    required String className,
    String? username,
  });
}

class MockProfileService implements ProfileService {
  @override
  Future<ProfileSummary> fetchProfile(String id) async {
    await Future<void>.delayed(const Duration(milliseconds: 150));
    return ProfileSummary(
      user: mockUsers.firstWhere(
        (user) => user.id == id,
        orElse: () => mockCurrentUser,
      ),
      badges: mockBadges.where((badge) => badge.isEarned).toList(),
      events: mockEvents
          .where((event) => event.myStatus == EventParticipationStatus.going)
          .toList(),
      communities:
          mockCommunities.where((community) => community.isJoined).toList(),
    );
  }

  @override
  Future<UserModel> updateProfile({
    required String fullName,
    required String bio,
    required String className,
    String? username,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 220));
    return mockCurrentUser.copyWith(
      fullName: fullName,
      bio: bio,
      className: className,
      username: username == null || username.trim().isEmpty
          ? mockCurrentUser.username
          : (username.startsWith('@') ? username : '@$username'),
    );
  }
}

class ApiProfileService implements ProfileService {
  const ApiProfileService(this._api);

  final ApiClient _api;

  @override
  Future<ProfileSummary> fetchProfile(String id) async {
    final response = await _api.get('/profile/${id == 'me' ? 'me' : id}');
    final data = apiData(response.data);
    return ProfileSummary(
      user: userFromJson(data['user']),
      badges: [
        for (final badge in apiList(data['badges']))
          BadgeModel(
            id: apiString(badge['id']),
            code: apiString(badge['code']),
            name: apiString(badge['name']),
            description: apiString(badge['description']),
            icon: apiString(badge['icon']),
            category: apiString(badge['category']),
            isEarned: apiBool(badge['is_earned'], true),
            earnedAt: apiNullableDate(badge['earned_at']),
          ),
      ],
      events: apiList(data['events']).map(eventFromJson).toList(),
      communities: apiList(data['communities']).map(communityFromJson).toList(),
    );
  }

  @override
  Future<UserModel> updateProfile({
    required String fullName,
    required String bio,
    required String className,
    String? username,
  }) async {
    final response = await _api.put(
      '/profile/me',
      data: {
        'full_name': fullName,
        'bio': bio,
        'class_name': className,
        if (username != null && username.trim().isNotEmpty)
          'username': username.trim(),
      },
    );
    return userFromJson(apiData(response.data));
  }
}
