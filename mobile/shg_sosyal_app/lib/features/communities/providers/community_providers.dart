import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/models/community_model.dart';
import '../repositories/community_repository.dart';
import '../services/community_service.dart';

final communityTabProvider = StateProvider<String>((ref) => 'recommended');
final communityServiceProvider =
    Provider<CommunityService>((ref) => MockCommunityService());
final communityRepositoryProvider = Provider<CommunityRepository>(
  (ref) => CommunityRepository(ref.watch(communityServiceProvider)),
);

final communitiesProvider = FutureProvider<List<CommunityModel>>((ref) {
  final tab = ref.watch(communityTabProvider);
  return ref.watch(communityRepositoryProvider).getCommunities(tab: tab);
});

final communityDetailProvider =
    FutureProvider.family<CommunityModel?, String>((ref, id) {
  return ref.watch(communityRepositoryProvider).getCommunityById(id);
});
