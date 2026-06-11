import '../../../core/network/api_client.dart';
import '../../../core/network/api_mappers.dart';
import '../../../data/mock/mock_friendships.dart';
import '../../../data/mock/mock_users.dart';
import '../../../data/models/friendship_model.dart';
import '../../../data/models/user_model.dart';

abstract class FriendService {
  Future<List<FriendshipModel>> fetchFriends({String status = 'accepted'});
  Future<List<UserModel>> searchUsers(String query);
  Future<FriendshipModel> sendRequest(UserModel user);
  Future<FriendshipModel> acceptRequest(String friendshipId);
  Future<FriendshipModel> rejectRequest(String friendshipId);
  Future<void> cancelRequest(String friendshipId);
  Future<void> removeFriend(String friendshipId);
}

class MockFriendService implements FriendService {
  @override
  Future<List<FriendshipModel>> fetchFriends({
    String status = 'accepted',
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 160));
    final parsed = _parseStatus(status);
    return mockFriendships.where((item) => item.status == parsed).toList();
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

  @override
  Future<FriendshipModel> sendRequest(UserModel user) async {
    await Future<void>.delayed(const Duration(milliseconds: 160));
    final friendship = FriendshipModel(
      id: 'friend-${DateTime.now().microsecondsSinceEpoch}',
      user: user,
      status: FriendshipStatus.pending,
      createdAt: DateTime.now(),
    );
    mockFriendships.add(friendship);
    return friendship;
  }

  @override
  Future<FriendshipModel> acceptRequest(String friendshipId) async {
    await Future<void>.delayed(const Duration(milliseconds: 160));
    return _update(friendshipId, FriendshipStatus.accepted);
  }

  @override
  Future<FriendshipModel> rejectRequest(String friendshipId) async {
    await Future<void>.delayed(const Duration(milliseconds: 160));
    return _update(friendshipId, FriendshipStatus.rejected);
  }

  @override
  Future<void> cancelRequest(String friendshipId) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    mockFriendships.removeWhere((item) => item.id == friendshipId);
  }

  @override
  Future<void> removeFriend(String friendshipId) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    mockFriendships.removeWhere((item) => item.id == friendshipId);
  }

  FriendshipModel _update(String id, FriendshipStatus status) {
    final index = mockFriendships.indexWhere((item) => item.id == id);
    if (index == -1) throw StateError('Arkadaşlık kaydı bulunamadı.');
    final current = mockFriendships[index];
    final updated = FriendshipModel(
      id: current.id,
      user: current.user,
      status: status,
      createdAt: current.createdAt,
    );
    mockFriendships[index] = updated;
    return updated;
  }

  FriendshipStatus _parseStatus(String status) {
    return switch (status) {
      'incoming' || 'outgoing' || 'pending' => FriendshipStatus.pending,
      'rejected' => FriendshipStatus.rejected,
      'blocked' => FriendshipStatus.blocked,
      _ => FriendshipStatus.accepted,
    };
  }
}

class ApiFriendService implements FriendService {
  const ApiFriendService(this._api);

  final ApiClient _api;

  @override
  Future<List<FriendshipModel>> fetchFriends({
    String status = 'accepted',
  }) async {
    final response =
        await _api.get('/friends', queryParameters: {'status': status});
    return apiList(response.data).map(_friendshipFromJson).toList();
  }

  @override
  Future<List<UserModel>> searchUsers(String query) async {
    final response =
        await _api.get('/friends/search', queryParameters: {'q': query});
    return apiList(response.data).map(userFromJson).toList();
  }

  @override
  Future<FriendshipModel> sendRequest(UserModel user) async {
    final response =
        await _api.post('/friends/requests', data: {'receiver_id': user.id});
    return _friendshipFromJson(apiData(response.data));
  }

  @override
  Future<FriendshipModel> acceptRequest(String friendshipId) async {
    final response = await _api.post('/friends/requests/$friendshipId/accept');
    return _friendshipFromJson(apiData(response.data));
  }

  @override
  Future<FriendshipModel> rejectRequest(String friendshipId) async {
    final response = await _api.post('/friends/requests/$friendshipId/reject');
    return _friendshipFromJson(apiData(response.data));
  }

  @override
  Future<void> cancelRequest(String friendshipId) {
    return _api.post('/friends/requests/$friendshipId/cancel');
  }

  @override
  Future<void> removeFriend(String friendshipId) {
    return _api.delete('/friends/$friendshipId');
  }

  FriendshipModel _friendshipFromJson(Object? value) {
    final json = apiMap(value);
    return FriendshipModel(
      id: apiString(json['id']),
      user: userFromJson(json['user']),
      status: _parseStatus(json['status']),
      createdAt: apiDate(json['created_at']),
    );
  }

  FriendshipStatus _parseStatus(Object? value) {
    return switch (apiString(value)) {
      'pending' => FriendshipStatus.pending,
      'rejected' => FriendshipStatus.rejected,
      'blocked' => FriendshipStatus.blocked,
      _ => FriendshipStatus.accepted,
    };
  }
}
