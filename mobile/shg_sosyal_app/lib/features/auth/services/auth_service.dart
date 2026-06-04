import '../../../data/mock/mock_users.dart';
import '../../../data/models/user_model.dart';

abstract class AuthService {
  Future<UserModel?> currentUser();
  Future<UserModel> signIn({required String email, required String password});
  Future<UserModel> signUp({
    required String fullName,
    required String email,
    required String password,
    required String className,
    required String username,
  });
  Future<void> signOut();
}

class MockAuthService implements AuthService {
  UserModel? _current = mockCurrentUser;

  @override
  Future<UserModel?> currentUser() async => _current;

  @override
  Future<UserModel> signIn({required String email, required String password}) async {
    await Future<void>.delayed(const Duration(milliseconds: 250));
    _current = mockCurrentUser;
    return _current!;
  }

  @override
  Future<UserModel> signUp({
    required String fullName,
    required String email,
    required String password,
    required String className,
    required String username,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 300));
    _current = UserModel(
      id: 'u-new',
      fullName: fullName,
      username: username.startsWith('@') ? username : '@$username',
      email: email,
      className: className,
      points: 0,
    );
    return _current!;
  }

  @override
  Future<void> signOut() async {
    _current = null;
  }
}
