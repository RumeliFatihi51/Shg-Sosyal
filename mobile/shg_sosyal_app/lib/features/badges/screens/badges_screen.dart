import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_badge.dart';
import '../../../core/widgets/app_empty_state.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../data/models/badge_model.dart';
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
        error: (_, __) => const AppEmptyState(
            title: 'Rozetler yüklenemedi.', message: 'Tekrar dene.'),
        data: (items) {
          final earned = items.where((badge) => badge.isEarned).length;
          final categories =
              items.map((badge) => badge.category).toSet().toList();
          return CustomScrollView(
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                sliver: SliverToBoxAdapter(
                  child: _BadgeSummary(earned: earned, total: items.length),
                ),
              ),
              for (final category in categories) ...[
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 10, 16, 8),
                  sliver: SliverToBoxAdapter(
                    child: Text(category,
                        style: Theme.of(context).textTheme.titleMedium),
                  ),
                ),
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  sliver: SliverGrid.builder(
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 0.88,
                    ),
                    itemCount: items
                        .where((badge) => badge.category == category)
                        .length,
                    itemBuilder: (context, index) {
                      final badge = items
                          .where((badge) => badge.category == category)
                          .toList()[index];
                      return _BadgeCard(badge: badge);
                    },
                  ),
                ),
              ],
              const SliverPadding(padding: EdgeInsets.only(bottom: 96)),
            ],
          );
        },
      ),
    );
  }
}

class _BadgeSummary extends StatelessWidget {
  const _BadgeSummary({required this.earned, required this.total});

  final int earned;
  final int total;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppColors.warning.withValues(alpha: 0.16),
              borderRadius: BorderRadius.circular(18),
            ),
            child: const Icon(Icons.workspace_premium_outlined,
                color: AppColors.warning),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('$earned/$total rozet kazanıldı',
                    style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 3),
                Text('Katılım, üretim ve sosyal hareketlerin burada birikir.',
                    style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BadgeCard extends StatelessWidget {
  const _BadgeCard({required this.badge});

  final BadgeModel badge;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: badge.isEarned ? AppColors.surfaceElevated : AppColors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: badge.isEarned
              ? AppColors.warning.withValues(alpha: 0.45)
              : AppColors.border,
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
          Expanded(
              child: Text(badge.description,
                  style: Theme.of(context).textTheme.bodySmall)),
          AppBadge(
            label: badge.isEarned ? 'Kazanıldı' : 'Kilitli',
            color: badge.isEarned ? AppColors.success : AppColors.textMuted,
          ),
        ],
      ),
    );
  }
}
