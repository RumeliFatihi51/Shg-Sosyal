import '../../../data/mock/mock_leaderboard.dart';
import '../../../data/models/leaderboard_entry_model.dart';

abstract class LeaderboardService {
  Future<List<LeaderboardEntryModel>> fetchLeaderboard({String period = 'weekly'});
}

class MockLeaderboardService implements LeaderboardService {
  @override
  Future<List<LeaderboardEntryModel>> fetchLeaderboard({String period = 'weekly'}) async {
    await Future<void>.delayed(const Duration(milliseconds: 150));
    return mockLeaderboard;
  }
}
