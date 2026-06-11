import 'dart:typed_data';

import '../../../data/models/community_model.dart';
import '../../../data/models/user_model.dart';
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

  Future<List<UserModel>> searchUsers(String query) {
    return _service.searchUsers(query);
  }

  Future<CommunityModel> createCommunity({
    required String name,
    required String description,
    required String category,
    Uint8List? imageBytes,
    String? imageMimeType,
  }) {
    return _service.createCommunity(
      name: name,
      description: description,
      category: category,
      imageBytes: imageBytes,
      imageMimeType: imageMimeType,
    );
  }

  Future<CommunityModel> joinCommunity(String communityId) {
    return _service.joinCommunity(communityId);
  }

  Future<CommunityModel> leaveCommunity(String communityId) {
    return _service.leaveCommunity(communityId);
  }

  Future<CommunityModel> addMember(String communityId, UserModel user) {
    return _service.addMember(communityId, user);
  }

  Future<CommunityModel> removeMember(String communityId, String userId) {
    return _service.removeMember(communityId, userId);
  }
}
