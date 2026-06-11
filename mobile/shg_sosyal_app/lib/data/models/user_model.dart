enum UserRole { student, communityAdmin, teacher, admin }

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
    this.isSuspended = false,
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
  final bool isSuspended;

  UserModel copyWith({
    String? id,
    String? fullName,
    String? username,
    String? email,
    String? className,
    String? avatarUrl,
    String? bio,
    int? points,
    UserRole? role,
    bool? isSuspended,
  }) {
    return UserModel(
      id: id ?? this.id,
      fullName: fullName ?? this.fullName,
      username: username ?? this.username,
      email: email ?? this.email,
      className: className ?? this.className,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      bio: bio ?? this.bio,
      points: points ?? this.points,
      role: role ?? this.role,
      isSuspended: isSuspended ?? this.isSuspended,
    );
  }
}
