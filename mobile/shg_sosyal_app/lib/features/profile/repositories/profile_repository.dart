import '../services/profile_service.dart';

class ProfileRepository {
  const ProfileRepository(this._service);

  final ProfileService _service;

  Future<ProfileSummary> getProfile(String id) => _service.fetchProfile(id);
}
