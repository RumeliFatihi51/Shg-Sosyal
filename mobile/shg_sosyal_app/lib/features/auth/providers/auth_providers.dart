import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../data/models/user_model.dart';
import '../repositories/auth_repository.dart';
import '../services/auth_service.dart';

final authServiceProvider = Provider<AuthService>((ref) {
  const useApi = bool.fromEnvironment('SHG_USE_API', defaultValue: true);
  if (useApi) return ApiAuthService(ApiClient());
  return MockAuthService();
});

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.watch(authServiceProvider)),
);

final authControllerProvider =
    StateNotifierProvider<AuthController, AsyncValue<UserModel?>>(
  (ref) => AuthController(ref.watch(authRepositoryProvider))..load(),
);

class AuthController extends StateNotifier<AsyncValue<UserModel?>> {
  AuthController(this._repository) : super(const AsyncValue.loading());

  final AuthRepository _repository;

  Future<void> load() async {
    state = AsyncValue.data(await _repository.currentUser());
  }

  Future<void> signIn(String email, String password) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () => _repository.signIn(email: email, password: password),
    );
  }

  Future<void> signUp({
    required String fullName,
    required String email,
    required String password,
    required String className,
    required String username,
  }) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () => _repository.signUp(
        fullName: fullName,
        email: email,
        password: password,
        className: className,
        username: username,
      ),
    );
  }

  Future<void> signOut() async {
    await _repository.signOut();
    state = const AsyncValue.data(null);
  }

  void setUser(UserModel user) {
    state = AsyncValue.data(user);
  }
}
