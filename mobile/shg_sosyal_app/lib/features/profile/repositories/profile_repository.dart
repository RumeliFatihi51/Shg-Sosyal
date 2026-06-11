import '../../../data/models/user_model.dart';
import '../services/profile_service.dart';

class ProfileRepository {
  const ProfileRepository(this._service);

  final ProfileService _service;

  Future<ProfileSummary> getProfile(String id) => _service.fetchProfile(id);

  Future<UserModel> updateProfile({
    required String fullName,
    required String bio,
    required String className,
    String? username,
  }) {
    return _service.updateProfile(
      fullName: fullName,
      bio: bio,
      className: className,
      username: username,
    );
  }
}
