import '../../../core/network/api_client.dart';
import '../../../data/mock/mock_communities.dart';
import '../../../data/models/community_model.dart';

abstract class CommunityService {
  Future<List<CommunityModel>> fetchCommunities({String tab = 'recommended'});
  Future<CommunityModel?> fetchCommunityById(String id);
}

class MockCommunityService implements CommunityService {
  @override
  Future<List<CommunityModel>> fetchCommunities({String tab = 'recommended'}) async {
    await Future<void>.delayed(const Duration(milliseconds: 170));
    if (tab == 'joined') return mockCommunities.where((item) => item.isJoined).toList();
    if (tab == 'active') {
      final items = [...mockCommunities]
        ..sort((a, b) => b.lastActivityAt.compareTo(a.lastActivityAt));
      return items;
    }
    return mockCommunities;
  }

  @override
  Future<CommunityModel?> fetchCommunityById(String id) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    for (final community in mockCommunities) {
      if (community.id == id) return community;
    }
    return null;
  }
}

class ApiCommunityService implements CommunityService {
  const ApiCommunityService(this._api);

  final ApiClient _api;

  @override
  Future<List<CommunityModel>> fetchCommunities({String tab = 'recommended'}) async {
    await _api.get('/communities', queryParameters: {'tab': tab});
    throw UnimplementedError('ApiCommunityService list mapping is not connected yet.');
  }

  @override
  Future<CommunityModel?> fetchCommunityById(String id) async {
    await _api.get('/communities/$id');
    throw UnimplementedError('ApiCommunityService detail mapping is not connected yet.');
  }
}
