import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../auth/providers/auth_providers.dart';
import '../repositories/profile_repository.dart';
import '../services/profile_service.dart';

final profileServiceProvider = Provider<ProfileService>((ref) {
  const useApi = bool.fromEnvironment('SHG_USE_API', defaultValue: true);
  if (useApi) return ApiProfileService(ApiClient());
  return MockProfileService();
});
final profileRepositoryProvider = Provider<ProfileRepository>(
  (ref) => ProfileRepository(ref.watch(profileServiceProvider)),
);

final profileProvider = FutureProvider<ProfileSummary>((ref) {
  final user = ref.watch(authControllerProvider).valueOrNull;
  return ref.watch(profileRepositoryProvider).getProfile(user?.id ?? 'me');
});

final profileEditControllerProvider =
    StateNotifierProvider<ProfileEditController, AsyncValue<void>>(
  (ref) => ProfileEditController(ref),
);

class ProfileEditController extends StateNotifier<AsyncValue<void>> {
  ProfileEditController(this._ref) : super(const AsyncValue.data(null));

  final Ref _ref;

  Future<void> update({
    required String fullName,
    required String bio,
    required String className,
    String? username,
  }) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final updated = await _ref.read(profileRepositoryProvider).updateProfile(
            fullName: fullName,
            bio: bio,
            className: className,
            username: username,
          );
      _ref.read(authControllerProvider.notifier).setUser(updated);
      _ref.invalidate(profileProvider);
    });
  }
}
