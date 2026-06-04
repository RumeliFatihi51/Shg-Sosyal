import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/models/friendship_model.dart';
import '../../../data/models/user_model.dart';
import '../repositories/friend_repository.dart';
import '../services/friend_service.dart';

final friendSearchQueryProvider = StateProvider<String>((ref) => '');
final friendServiceProvider = Provider<FriendService>((ref) => MockFriendService());
final friendRepositoryProvider = Provider<FriendRepository>(
  (ref) => FriendRepository(ref.watch(friendServiceProvider)),
);

final friendshipsProvider = FutureProvider<List<FriendshipModel>>((ref) {
  return ref.watch(friendRepositoryProvider).getFriends();
});

final userSearchProvider = FutureProvider<List<UserModel>>((ref) {
  final query = ref.watch(friendSearchQueryProvider);
  return ref.watch(friendRepositoryProvider).searchUsers(query);
});
