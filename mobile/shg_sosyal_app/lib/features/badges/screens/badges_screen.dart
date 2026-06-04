import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_empty_state.dart';
import '../../../core/widgets/loading_view.dart';
import '../providers/badge_providers.dart';

class BadgesScreen extends ConsumerWidget {
  const BadgesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final badges = ref.watch(badgesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Rozetler')),
      body: badges.when(
        loading: () => const LoadingView(),
        error: (_, __) => const AppEmptyState(title: 'Rozetler yüklenemedi.', message: 'Tekrar dene.'),
        data: (items) => GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 0.92,
          ),
          itemCount: items.length,
          itemBuilder: (context, index) {
            final badge = items[index];
            return Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: badge.isEarned ? AppColors.surfaceElevated : AppColors.surface,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(
                  color: badge.isEarned ? AppColors.primary.withValues(alpha: 0.45) : AppColors.border,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    badge.isEarned ? Icons.workspace_premium : Icons.lock_outline,
                    color: badge.isEarned ? AppColors.warning : AppColors.textMuted,
                  ),
                  const SizedBox(height: 12),
                  Text(badge.name, style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 6),
                  Text(badge.description, style: Theme.of(context).textTheme.bodySmall),
                  const Spacer(),
                  Text(badge.category, style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}
