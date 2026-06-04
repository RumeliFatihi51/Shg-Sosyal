import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/models/badge_model.dart';
import '../repositories/badge_repository.dart';
import '../services/badge_service.dart';

final badgeServiceProvider = Provider<BadgeService>((ref) => MockBadgeService());
final badgeRepositoryProvider = Provider<BadgeRepository>(
  (ref) => BadgeRepository(ref.watch(badgeServiceProvider)),
);

final badgesProvider = FutureProvider<List<BadgeModel>>((ref) {
  return ref.watch(badgeRepositoryProvider).getBadges();
});
