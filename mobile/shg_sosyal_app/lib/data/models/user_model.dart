enum UserRole { student, communityAdmin, moderator, admin, teacher }

class UserModel {
  const UserModel({
    required this.id,
    required this.fullName,
    required this.username,
    required this.email,
    required this.className,
    required this.points,
    this.avatarUrl,
    this.bio,
    this.role = UserRole.student,
  });

  final String id;
  final String fullName;
  final String username;
  final String email;
  final String className;
  final String? avatarUrl;
  final String? bio;
  final int points;
  final UserRole role;
}
