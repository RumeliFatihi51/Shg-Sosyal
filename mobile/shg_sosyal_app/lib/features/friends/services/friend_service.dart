import '../../../data/mock/mock_friendships.dart';
import '../../../data/mock/mock_users.dart';
import '../../../data/models/friendship_model.dart';
import '../../../data/models/user_model.dart';

abstract class FriendService {
  Future<List<FriendshipModel>> fetchFriends();
  Future<List<UserModel>> searchUsers(String query);
}

class MockFriendService implements FriendService {
  @override
  Future<List<FriendshipModel>> fetchFriends() async {
    await Future<void>.delayed(const Duration(milliseconds: 160));
    return mockFriendships;
  }

  @override
  Future<List<UserModel>> searchUsers(String query) async {
    await Future<void>.delayed(const Duration(milliseconds: 180));
    final normalized = query.toLowerCase().replaceAll('@', '').trim();
    if (normalized.isEmpty) return mockUsers.skip(1).toList();
    return mockUsers
        .where(
          (user) =>
              user.fullName.toLowerCase().contains(normalized) ||
              user.username.toLowerCase().contains(normalized),
        )
        .where((user) => user.id != mockCurrentUser.id)
        .toList();
  }
}
