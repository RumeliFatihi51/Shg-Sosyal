import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../data/models/community_model.dart';
import '../../../data/models/user_model.dart';
import '../repositories/community_repository.dart';
import '../services/community_service.dart';

final communityTabProvider = StateProvider<String>((ref) => 'recommended');
final communityMemberSearchQueryProvider =
    StateProvider.family<String, String>((ref, communityId) => '');
final communityServiceProvider = Provider<CommunityService>((ref) {
  const useApi = bool.fromEnvironment('SHG_USE_API', defaultValue: true);
  if (useApi) return ApiCommunityService(ApiClient());
  return MockCommunityService();
});
final communityRepositoryProvider = Provider<CommunityRepository>(
  (ref) => CommunityRepository(ref.watch(communityServiceProvider)),
);

final communitiesProvider = FutureProvider<List<CommunityModel>>((ref) {
  final tab = ref.watch(communityTabProvider);
  return ref.watch(communityRepositoryProvider).getCommunities(tab: tab);
});

final communityDetailProvider =
    FutureProvider.family<CommunityModel?, String>((ref, id) {
  return ref.watch(communityRepositoryProvider).getCommunityById(id);
});

final communityMemberSearchProvider =
    FutureProvider.family<List<UserModel>, String>((ref, communityId) {
  final query = ref.watch(communityMemberSearchQueryProvider(communityId));
  return ref.watch(communityRepositoryProvider).searchUsers(query);
});

final communityManagementProvider =
    StateNotifierProvider<CommunityManagementController, AsyncValue<void>>(
  (ref) => CommunityManagementController(
      ref.watch(communityRepositoryProvider), ref),
);

class CommunityManagementController extends StateNotifier<AsyncValue<void>> {
  CommunityManagementController(this._repository, this._ref)
      : super(const AsyncValue.data(null));

  final CommunityRepository _repository;
  final Ref _ref;

  Future<void> addMember(String communityId, UserModel user) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      await _repository.addMember(communityId, user);
      _ref.invalidate(communitiesProvider);
      _ref.invalidate(communityDetailProvider(communityId));
    });
  }

  Future<void> join(String communityId) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      await _repository.joinCommunity(communityId);
      _ref.invalidate(communitiesProvider);
      _ref.invalidate(communityDetailProvider(communityId));
    });
  }

  Future<void> leave(String communityId) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      await _repository.leaveCommunity(communityId);
      _ref.invalidate(communitiesProvider);
      _ref.invalidate(communityDetailProvider(communityId));
    });
  }

  Future<void> removeMember(String communityId, String userId) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      await _repository.removeMember(communityId, userId);
      _ref.invalidate(communitiesProvider);
      _ref.invalidate(communityDetailProvider(communityId));
    });
  }
}
