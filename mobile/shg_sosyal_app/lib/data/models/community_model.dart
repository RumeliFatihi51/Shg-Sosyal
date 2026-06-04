class CommunityModel {
  const CommunityModel({
    required this.id,
    required this.name,
    required this.description,
    required this.memberCount,
    required this.postCount,
    required this.isJoined,
    required this.lastActivityAt,
    required this.category,
    this.avatarUrl,
  });

  final String id;
  final String name;
  final String description;
  final String? avatarUrl;
  final int memberCount;
  final int postCount;
  final bool isJoined;
  final DateTime lastActivityAt;
  final String category;
}
