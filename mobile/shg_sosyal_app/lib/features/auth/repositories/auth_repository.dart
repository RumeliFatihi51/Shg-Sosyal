import '../../../data/models/user_model.dart';
import '../services/auth_service.dart';

class AuthRepository {
  const AuthRepository(this._service);

  final AuthService _service;

  Future<UserModel?> currentUser() => _service.currentUser();

  Future<UserModel> signIn({
    required String email,
    required String password,
  }) {
    return _service.signIn(email: email, password: password);
  }

  Future<UserModel> signUp({
    required String fullName,
    required String email,
    required String password,
    required String className,
    required String username,
  }) {
    return _service.signUp(
      fullName: fullName,
      email: email,
      password: password,
      className: className,
      username: username,
    );
  }

  Future<void> signOut() => _service.signOut();
}
