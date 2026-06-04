class BadgeModel {
  const BadgeModel({
    required this.id,
    required this.code,
    required this.name,
    required this.description,
    required this.icon,
    required this.category,
    required this.isEarned,
    this.earnedAt,
  });

  final String id;
  final String code;
  final String name;
  final String description;
  final String icon;
  final String category;
  final bool isEarned;
  final DateTime? earnedAt;
}
