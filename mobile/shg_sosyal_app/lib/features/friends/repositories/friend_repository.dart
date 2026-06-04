import '../../../data/models/friendship_model.dart';
import '../../../data/models/user_model.dart';
import '../services/friend_service.dart';

class FriendRepository {
  const FriendRepository(this._service);

  final FriendService _service;

  Future<List<FriendshipModel>> getFriends() => _service.fetchFriends();
  Future<List<UserModel>> searchUsers(String query) => _service.searchUsers(query);
}
