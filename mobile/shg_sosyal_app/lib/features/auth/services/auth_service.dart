import '../../../core/network/api_client.dart';
import '../../../core/network/api_auth.dart';
import '../../../core/network/api_mappers.dart';
import '../../../core/storage/secure_storage.dart';
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
  MockAuthService({SecureStorage? storage})
      : _storage = storage ?? const SecureStorage();

  static const _sessionKey = 'mock_session_user';

  final SecureStorage _storage;
  UserModel? _current = mockCurrentUser;

  @override
  Future<UserModel?> currentUser() async {
    final sessionUser = await _storage.read(_sessionKey);
    if (sessionUser == null) {
      await _storage.write(_sessionKey, mockCurrentUser.id);
    }
    return _current;
  }

  @override
  Future<UserModel> signIn({
    required String email,
    required String password,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 250));
    _current = mockCurrentUser;
    await _storage.write(_sessionKey, _current!.id);
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
    await _storage.write(_sessionKey, _current!.id);
    return _current!;
  }

  @override
  Future<void> signOut() async {
    _current = null;
    await _storage.remove(_sessionKey);
  }
}

class ApiAuthService implements AuthService {
  ApiAuthService(this._api, {SecureStorage? storage})
      : _storage = storage ?? const SecureStorage();

  final ApiClient _api;
  final SecureStorage _storage;

  @override
  Future<UserModel?> currentUser() async {
    final token = await _storage.read(apiAccessTokenKey);
    if (token == null) return null;
    _api.setBearerToken(token);
    final response = await _api.get('/auth/me');
    return userFromJson(apiData(response.data));
  }

  @override
  Future<UserModel> signIn({
    required String email,
    required String password,
  }) async {
    final response = await _api
        .post('/auth/login', data: {'email': email, 'password': password});
    final data = apiData(response.data);
    final token = apiString(
      data['access_token'] ?? apiMap(data['session'])['access_token'],
    );
    if (token.isNotEmpty) {
      await _storage.write(apiAccessTokenKey, token);
      _api.setBearerToken(token);
    }
    return userFromJson(data['user']);
  }

  @override
  Future<UserModel> signUp({
    required String fullName,
    required String email,
    required String password,
    required String className,
    required String username,
  }) async {
    final response = await _api.post(
      '/auth/register',
      data: {
        'full_name': fullName,
        'email': email,
        'password': password,
        'class_name': className,
        'username': username,
      },
    );
    final data = apiData(response.data);
    final token = apiString(
      data['access_token'] ?? apiMap(data['session'])['access_token'],
    );
    if (token.isNotEmpty) {
      await _storage.write(apiAccessTokenKey, token);
      _api.setBearerToken(token);
    }
    return userFromJson(data['user']);
  }

  @override
  Future<void> signOut() async {
    await _storage.remove(apiAccessTokenKey);
    _api.setBearerToken(null);
  }
}
