import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_avatar.dart';
import '../../../core/widgets/app_badge.dart';
import '../../../core/widgets/app_empty_state.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../data/models/leaderboard_entry_model.dart';
import '../providers/leaderboard_providers.dart';

class LeaderboardScreen extends ConsumerWidget {
  const LeaderboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final leaderboard = ref.watch(leaderboardProvider);
    final period = ref.watch(leaderboardPeriodProvider);
    final tabs = {'daily': 'Günlük', 'weekly': 'Haftalık', 'all': 'Genel'};

    return Scaffold(
      appBar: AppBar(title: const Text('Sıralama')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
        children: [
          SizedBox(
            height: 38,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: tabs.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final entry = tabs.entries.elementAt(index);
                return ChoiceChip(
                  selected: period == entry.key,
                  label: Text(entry.value),
                  onSelected: (_) => ref
                      .read(leaderboardPeriodProvider.notifier)
                      .state = entry.key,
                );
              },
            ),
          ),
          const SizedBox(height: 14),
          leaderboard.when(
            loading: () => const LoadingView(),
            error: (_, __) => const AppEmptyState(
              title: 'Sıralama yüklenemedi.',
              message: 'Tekrar dene.',
            ),
            data: (items) {
              if (items.isEmpty) {
                return const AppEmptyState(
                  title: 'Henüz sıralama yok.',
                  message: 'Puan kazandıkça liste hareketlenir.',
                  icon: Icons.emoji_events_outlined,
                );
              }
              final top = items.take(3).toList();
              return Column(
                children: [
                  _Podium(items: top),
                  const SizedBox(height: 16),
                  for (final entry in items) ...[
                    _LeaderboardRow(entry: entry),
                    const SizedBox(height: 10),
                  ],
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

class _Podium extends StatelessWidget {
  const _Podium({required this.items});

  final List<LeaderboardEntryModel> items;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                'Haftanın aktifleri',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const Spacer(),
              const AppBadge(label: 'Top 3', color: AppColors.warning),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              if (items.length > 1)
                Expanded(child: _PodiumUser(entry: items[1], height: 96)),
              if (items.isNotEmpty)
                Expanded(
                  child: _PodiumUser(
                    entry: items[0],
                    height: 118,
                    featured: true,
                  ),
                ),
              if (items.length > 2)
                Expanded(child: _PodiumUser(entry: items[2], height: 84)),
            ],
          ),
        ],
      ),
    );
  }
}

class _PodiumUser extends StatelessWidget {
  const _PodiumUser({
    required this.entry,
    required this.height,
    this.featured = false,
  });

  final LeaderboardEntryModel entry;
  final double height;
  final bool featured;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        AppAvatar(name: entry.user.fullName, size: featured ? 58 : 48),
        const SizedBox(height: 8),
        Text(
          entry.user.fullName.split(' ').first,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: Theme.of(context).textTheme.titleSmall,
        ),
        Text(
          '${entry.points} puan',
          style: Theme.of(context).textTheme.bodySmall,
        ),
        const SizedBox(height: 8),
        Container(
          height: height,
          margin: const EdgeInsets.symmetric(horizontal: 4),
          decoration: BoxDecoration(
            color: featured
                ? AppColors.warning.withValues(alpha: 0.18)
                : AppColors.primary.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: featured ? AppColors.warning : AppColors.border,
            ),
          ),
          child: Center(
            child: Text(
              '#${entry.rank}',
              style: Theme.of(context).textTheme.titleLarge,
            ),
          ),
        ),
      ],
    );
  }
}

class _LeaderboardRow extends StatelessWidget {
  const _LeaderboardRow({required this.entry});

  final LeaderboardEntryModel entry;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 38,
            child: Text(
              '#${entry.rank}',
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ),
          AppAvatar(name: entry.user.fullName, size: 42),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  entry.user.fullName,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 3),
                Text(
                  '${entry.user.username} · ${entry.category}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          Text(
            '${entry.points}',
            style: Theme.of(context).textTheme.titleMedium,
          ),
        ],
      ),
    );
  }
}
