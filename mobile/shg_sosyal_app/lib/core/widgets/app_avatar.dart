import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

class AppAvatar extends StatelessWidget {
  const AppAvatar({
    required this.name,
    this.imageUrl,
    this.size = 44,
    super.key,
  });

  final String name;
  final String? imageUrl;
  final double size;

  @override
  Widget build(BuildContext context) {
    final initials = name
        .trim()
        .split(RegExp(r'\s+'))
        .where((part) => part.isNotEmpty)
        .take(2)
        .map((part) => part.characters.first.toUpperCase())
        .join();

    return CircleAvatar(
      radius: size / 2,
      backgroundColor: AppColors.surfaceMuted,
      foregroundColor: AppColors.textPrimary,
      backgroundImage: imageUrl == null ? null : NetworkImage(imageUrl!),
      child: imageUrl == null
          ? Text(
              initials.isEmpty ? '?' : initials,
              style: TextStyle(
                fontSize: size * 0.32,
                fontWeight: FontWeight.w800,
              ),
            )
          : null,
    );
  }
}
