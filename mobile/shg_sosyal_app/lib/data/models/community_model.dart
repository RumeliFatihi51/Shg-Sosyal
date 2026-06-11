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
    this.adminIds = const [],
    this.memberIds = const [],
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
  final List<String> adminIds;
  final List<String> memberIds;

  CommunityModel copyWith({
    String? id,
    String? name,
    String? description,
    String? avatarUrl,
    int? memberCount,
    int? postCount,
    bool? isJoined,
    DateTime? lastActivityAt,
    String? category,
    List<String>? adminIds,
    List<String>? memberIds,
  }) {
    return CommunityModel(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      memberCount: memberCount ?? this.memberCount,
      postCount: postCount ?? this.postCount,
      isJoined: isJoined ?? this.isJoined,
      lastActivityAt: lastActivityAt ?? this.lastActivityAt,
      category: category ?? this.category,
      adminIds: adminIds ?? this.adminIds,
      memberIds: memberIds ?? this.memberIds,
    );
  }
}
