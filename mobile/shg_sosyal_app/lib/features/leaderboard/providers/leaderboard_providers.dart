import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/models/leaderboard_entry_model.dart';
import '../repositories/leaderboard_repository.dart';
import '../services/leaderboard_service.dart';

final leaderboardPeriodProvider = StateProvider<String>((ref) => 'weekly');
final leaderboardServiceProvider =
    Provider<LeaderboardService>((ref) => MockLeaderboardService());
final leaderboardRepositoryProvider = Provider<LeaderboardRepository>(
  (ref) => LeaderboardRepository(ref.watch(leaderboardServiceProvider)),
);

final leaderboardProvider = FutureProvider<List<LeaderboardEntryModel>>((ref) {
  final period = ref.watch(leaderboardPeriodProvider);
  return ref.watch(leaderboardRepositoryProvider).getLeaderboard(period: period);
});
