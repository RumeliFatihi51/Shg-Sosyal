import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../data/models/friendship_model.dart';
import '../../../data/models/user_model.dart';
import '../repositories/friend_repository.dart';
import '../services/friend_service.dart';

final friendSearchQueryProvider = StateProvider<String>((ref) => '');

final friendTabProvider = StateProvider<String>((ref) => 'accepted');

final friendServiceProvider = Provider<FriendService>((ref) {
  const useApi = bool.fromEnvironment('SHG_USE_API', defaultValue: true);
  if (useApi) return ApiFriendService(ApiClient());
  return MockFriendService();
});

final friendRepositoryProvider = Provider<FriendRepository>(
  (ref) => FriendRepository(ref.watch(friendServiceProvider)),
);

final friendshipsProvider =
    FutureProvider.family<List<FriendshipModel>, String>((ref, status) {
  return ref.watch(friendRepositoryProvider).getFriends(status: status);
});

final userSearchProvider = FutureProvider<List<UserModel>>((ref) {
  final query = ref.watch(friendSearchQueryProvider);
  return ref.watch(friendRepositoryProvider).searchUsers(query);
});

final friendActionControllerProvider =
    StateNotifierProvider<FriendActionController, AsyncValue<void>>(
  (ref) => FriendActionController(ref),
);

class FriendActionController extends StateNotifier<AsyncValue<void>> {
  FriendActionController(this._ref) : super(const AsyncValue.data(null));

  final Ref _ref;

  FriendRepository get _repository => _ref.read(friendRepositoryProvider);

  Future<void> sendRequest(UserModel user) async {
    await _guard(() => _repository.sendRequest(user));
  }

  Future<void> accept(String friendshipId) async {
    await _guard(() => _repository.acceptRequest(friendshipId));
  }

  Future<void> reject(String friendshipId) async {
    await _guard(() => _repository.rejectRequest(friendshipId));
  }

  Future<void> cancel(String friendshipId) async {
    await _guard(() => _repository.cancelRequest(friendshipId));
  }

  Future<void> remove(String friendshipId) async {
    await _guard(() => _repository.removeFriend(friendshipId));
  }

  Future<void> _guard(Future<Object?> Function() action) async {
    state = const AsyncValue.loading();
    try {
      await action();
      _invalidate();
      state = const AsyncValue.data(null);
    } catch (error, stack) {
      state = AsyncValue.error(error, stack);
      rethrow;
    }
  }

  void _invalidate() {
    _ref.invalidate(friendshipsProvider('accepted'));
    _ref.invalidate(friendshipsProvider('incoming'));
    _ref.invalidate(friendshipsProvider('outgoing'));
    _ref.invalidate(userSearchProvider);
  }
}
