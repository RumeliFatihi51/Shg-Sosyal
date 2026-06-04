import '../../../data/models/leaderboard_entry_model.dart';
import '../services/leaderboard_service.dart';

class LeaderboardRepository {
  const LeaderboardRepository(this._service);

  final LeaderboardService _service;

  Future<List<LeaderboardEntryModel>> getLeaderboard({String period = 'weekly'}) {
    return _service.fetchLeaderboard(period: period);
  }
}
