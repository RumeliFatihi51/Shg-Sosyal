import '../models/leaderboard_entry_model.dart';
import 'mock_users.dart';

final mockLeaderboard = <LeaderboardEntryModel>[
  LeaderboardEntryModel(user: mockUsers[0], rank: 1, points: 840, category: 'Haftalık', change: 2),
  LeaderboardEntryModel(user: mockUsers[1], rank: 2, points: 720, category: 'Haftalık', change: 1),
  LeaderboardEntryModel(user: mockUsers[2], rank: 3, points: 690, category: 'Haftalık', change: -1),
  LeaderboardEntryModel(user: mockUsers[3], rank: 4, points: 610, category: 'Haftalık'),
  LeaderboardEntryModel(user: mockUsers[4], rank: 5, points: 570, category: 'Haftalık'),
];
