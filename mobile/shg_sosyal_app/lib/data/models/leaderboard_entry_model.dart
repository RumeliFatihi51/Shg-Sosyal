import 'user_model.dart';

class LeaderboardEntryModel {
  const LeaderboardEntryModel({
    required this.user,
    required this.rank,
    required this.points,
    required this.category,
    this.change,
  });

  final UserModel user;
  final int rank;
  final int points;
  final String category;
  final int? change;
}
