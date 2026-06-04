import '../../../data/models/community_model.dart';
import '../services/community_service.dart';

class CommunityRepository {
  const CommunityRepository(this._service);

  final CommunityService _service;

  Future<List<CommunityModel>> getCommunities({String tab = 'recommended'}) {
    return _service.fetchCommunities(tab: tab);
  }

  Future<CommunityModel?> getCommunityById(String id) {
    return _service.fetchCommunityById(id);
  }
}
