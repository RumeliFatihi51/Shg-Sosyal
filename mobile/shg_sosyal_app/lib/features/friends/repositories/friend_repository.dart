import '../../../data/models/friendship_model.dart';
import '../../../data/models/user_model.dart';
import '../services/friend_service.dart';

class FriendRepository {
  const FriendRepository(this._service);

  final FriendService _service;

  Future<List<FriendshipModel>> getFriends({String status = 'accepted'}) {
    return _service.fetchFriends(status: status);
  }

  Future<List<UserModel>> searchUsers(String query) =>
      _service.searchUsers(query);

  Future<FriendshipModel> sendRequest(UserModel user) =>
      _service.sendRequest(user);

  Future<FriendshipModel> acceptRequest(String friendshipId) {
    return _service.acceptRequest(friendshipId);
  }

  Future<FriendshipModel> rejectRequest(String friendshipId) {
    return _service.rejectRequest(friendshipId);
  }

  Future<void> cancelRequest(String friendshipId) =>
      _service.cancelRequest(friendshipId);

  Future<void> removeFriend(String friendshipId) =>
      _service.removeFriend(friendshipId);
}
