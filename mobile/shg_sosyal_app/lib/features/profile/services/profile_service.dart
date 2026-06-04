import '../../../data/mock/mock_badges.dart';
import '../../../data/mock/mock_communities.dart';
import '../../../data/mock/mock_events.dart';
import '../../../data/mock/mock_users.dart';
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
}

class MockProfileService implements ProfileService {
  @override
  Future<ProfileSummary> fetchProfile(String id) async {
    await Future<void>.delayed(const Duration(milliseconds: 150));
    return ProfileSummary(
      user: mockUsers.firstWhere((user) => user.id == id, orElse: () => mockCurrentUser),
      badges: mockBadges.where((badge) => badge.isEarned).toList(),
      events: mockEvents
          .where((event) => event.myStatus == EventParticipationStatus.going)
          .toList(),
      communities: mockCommunities.where((community) => community.isJoined).toList(),
    );
  }
}
