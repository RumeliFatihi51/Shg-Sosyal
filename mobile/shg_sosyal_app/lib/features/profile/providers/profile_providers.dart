import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/mock/mock_users.dart';
import '../repositories/profile_repository.dart';
import '../services/profile_service.dart';

final profileServiceProvider = Provider<ProfileService>((ref) => MockProfileService());
final profileRepositoryProvider = Provider<ProfileRepository>(
  (ref) => ProfileRepository(ref.watch(profileServiceProvider)),
);

final profileProvider = FutureProvider<ProfileSummary>((ref) {
  return ref.watch(profileRepositoryProvider).getProfile(mockCurrentUser.id);
});
