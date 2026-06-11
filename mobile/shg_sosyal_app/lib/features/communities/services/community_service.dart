import 'dart:convert';
import 'dart:typed_data';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_mappers.dart';
import '../../../data/mock/mock_communities.dart';
import '../../../data/mock/mock_users.dart';
import '../../../data/models/community_model.dart';
import '../../../data/models/user_model.dart';

abstract class CommunityService {
  Future<List<CommunityModel>> fetchCommunities({String tab = 'recommended'});
  Future<CommunityModel?> fetchCommunityById(String id);
  Future<List<UserModel>> searchUsers(String query);
  Future<CommunityModel> createCommunity({
    required String name,
    required String description,
    required String category,
    Uint8List? imageBytes,
    String? imageMimeType,
  });
  Future<CommunityModel> joinCommunity(String communityId);
  Future<CommunityModel> leaveCommunity(String communityId);
  Future<CommunityModel> addMember(String communityId, UserModel user);
  Future<CommunityModel> removeMember(String communityId, String userId);
}

class MockCommunityService implements CommunityService {
  @override
  Future<List<CommunityModel>> fetchCommunities(
      {String tab = 'recommended'}) async {
    await Future<void>.delayed(const Duration(milliseconds: 170));
    if (tab == 'joined') {
      return mockCommunities.where((item) => item.isJoined).toList();
    }
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

  @override
  Future<List<UserModel>> searchUsers(String query) async {
    await Future<void>.delayed(const Duration(milliseconds: 140));
    final normalized = query.toLowerCase().replaceAll('@', '').trim();
    if (normalized.length < 2) return const [];
    return mockUsers
        .where(
          (user) =>
              user.fullName.toLowerCase().contains(normalized) ||
              user.username.toLowerCase().contains(normalized),
        )
        .toList();
  }

  @override
  Future<CommunityModel> createCommunity({
    required String name,
    required String description,
    required String category,
    Uint8List? imageBytes,
    String? imageMimeType,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 220));
    final community = CommunityModel(
      id: 'local-community-${DateTime.now().microsecondsSinceEpoch}',
      name: name,
      description: description,
      memberCount: 1,
      postCount: 0,
      isJoined: true,
      lastActivityAt: DateTime.now(),
      category: category,
      adminIds: const ['u1'],
      memberIds: const ['u1'],
      avatarUrl: imageBytes == null ? null : 'local-image',
    );
    mockCommunities.insert(0, community);
    return community;
  }

  @override
  Future<CommunityModel> joinCommunity(String communityId) async {
    await Future<void>.delayed(const Duration(milliseconds: 160));
    final index =
        mockCommunities.indexWhere((community) => community.id == communityId);
    if (index == -1) throw StateError('Topluluk bulunamadı.');
    final community = mockCommunities[index];
    if (community.isJoined) return community;
    final updated = community.copyWith(
      isJoined: true,
      memberCount: community.memberCount + 1,
      memberIds: {...community.memberIds, 'u1'}.toList(),
      lastActivityAt: DateTime.now(),
    );
    mockCommunities[index] = updated;
    return updated;
  }

  @override
  Future<CommunityModel> leaveCommunity(String communityId) async {
    await Future<void>.delayed(const Duration(milliseconds: 160));
    final index =
        mockCommunities.indexWhere((community) => community.id == communityId);
    if (index == -1) throw StateError('Topluluk bulunamadı.');
    final community = mockCommunities[index];
    if (community.adminIds.contains('u1')) {
      throw StateError('Topluluk admini topluluktan ayrılamaz.');
    }
    final updated = community.copyWith(
      isJoined: false,
      memberCount: (community.memberCount - 1).clamp(0, 999999),
      memberIds: community.memberIds.where((id) => id != 'u1').toList(),
      lastActivityAt: DateTime.now(),
    );
    mockCommunities[index] = updated;
    return updated;
  }

  @override
  Future<CommunityModel> addMember(String communityId, UserModel user) async {
    await Future<void>.delayed(const Duration(milliseconds: 180));
    final index =
        mockCommunities.indexWhere((community) => community.id == communityId);
    if (index == -1) throw StateError('Topluluk bulunamadı.');
    final community = mockCommunities[index];
    if (community.memberIds.contains(user.id)) return community;
    final updated = community.copyWith(
      memberIds: [...community.memberIds, user.id],
      memberCount: community.memberCount + 1,
      isJoined: community.isJoined || user.id == 'u1',
      lastActivityAt: DateTime.now(),
    );
    mockCommunities[index] = updated;
    return updated;
  }

  @override
  Future<CommunityModel> removeMember(String communityId, String userId) async {
    await Future<void>.delayed(const Duration(milliseconds: 180));
    final index =
        mockCommunities.indexWhere((community) => community.id == communityId);
    if (index == -1) throw StateError('Topluluk bulunamadı.');
    final community = mockCommunities[index];
    if (community.adminIds.contains(userId)) {
      throw StateError('Topluluk admini bu panelden çıkarılamaz.');
    }
    if (!community.memberIds.contains(userId)) return community;
    final updated = community.copyWith(
      memberIds: community.memberIds.where((id) => id != userId).toList(),
      memberCount: (community.memberCount - 1).clamp(0, 999999),
      isJoined: userId == 'u1' ? false : community.isJoined,
      lastActivityAt: DateTime.now(),
    );
    mockCommunities[index] = updated;
    return updated;
  }
}

class ApiCommunityService implements CommunityService {
  const ApiCommunityService(this._api);

  final ApiClient _api;

  @override
  Future<List<CommunityModel>> fetchCommunities(
      {String tab = 'recommended'}) async {
    final response =
        await _api.get('/communities', queryParameters: {'tab': tab});
    return apiList(response.data).map(communityFromJson).toList();
  }

  @override
  Future<CommunityModel?> fetchCommunityById(String id) async {
    final response = await _api.get('/communities/$id');
    final data = apiData(response.data);
    return data.isEmpty ? null : communityFromJson(data);
  }

  @override
  Future<List<UserModel>> searchUsers(String query) async {
    final response = await _api.get(
      '/communities/users/search',
      queryParameters: {'q': query},
    );
    return apiList(response.data).map(userFromJson).toList();
  }

  @override
  Future<CommunityModel> createCommunity({
    required String name,
    required String description,
    required String category,
    Uint8List? imageBytes,
    String? imageMimeType,
  }) async {
    final response = await _api.post(
      '/communities',
      data: {
        'name': name,
        'description': description,
        'category': category,
        if (imageBytes != null) 'image_base64': base64Encode(imageBytes),
        if (imageBytes != null)
          'image_mime_type': imageMimeType ?? 'image/jpeg',
      },
    );
    return communityFromJson(apiData(response.data));
  }

  @override
  Future<CommunityModel> joinCommunity(String communityId) async {
    final response = await _api.post('/communities/$communityId/join');
    return communityFromJson(apiData(response.data));
  }

  @override
  Future<CommunityModel> leaveCommunity(String communityId) async {
    final response = await _api.post('/communities/$communityId/leave');
    return communityFromJson(apiData(response.data));
  }

  @override
  Future<CommunityModel> addMember(String communityId, UserModel user) async {
    final response = await _api.post(
      '/communities/$communityId/members',
      data: {'user_id': user.id},
    );
    return communityFromJson(apiData(response.data));
  }

  @override
  Future<CommunityModel> removeMember(String communityId, String userId) async {
    final response =
        await _api.delete('/communities/$communityId/members/$userId');
    return communityFromJson(apiData(response.data));
  }
}
