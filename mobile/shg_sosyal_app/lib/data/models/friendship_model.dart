import 'user_model.dart';

enum FriendshipStatus { pending, accepted, rejected, blocked }

class FriendshipModel {
  const FriendshipModel({
    required this.id,
    required this.user,
    required this.status,
    required this.createdAt,
  });

  final String id;
  final UserModel user;
  final FriendshipStatus status;
  final DateTime createdAt;
}
