import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/models/user_model.dart';
import '../repositories/auth_repository.dart';
import '../services/auth_service.dart';

final authServiceProvider = Provider<AuthService>((ref) => MockAuthService());

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
    state = AsyncValue.data(
      await _repository.signIn(email: email, password: password),
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
    state = AsyncValue.data(
      await _repository.signUp(
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
}
