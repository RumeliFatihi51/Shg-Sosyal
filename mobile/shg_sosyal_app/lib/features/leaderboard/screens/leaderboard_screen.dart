import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/app_avatar.dart';
import '../../../core/widgets/app_empty_state.dart';
import '../../../core/widgets/loading_view.dart';
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
        padding: const EdgeInsets.all(16),
        children: [
          SizedBox(
            height: 42,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: tabs.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final entry = tabs.entries.elementAt(index);
                return ChoiceChip(
                  selected: period == entry.key,
                  label: Text(entry.value),
                  onSelected: (_) => ref.read(leaderboardPeriodProvider.notifier).state = entry.key,
                );
              },
            ),
          ),
          const SizedBox(height: 14),
          leaderboard.when(
            loading: () => const LoadingView(),
            error: (_, __) => const AppEmptyState(title: 'Sıralama yüklenemedi.', message: 'Tekrar dene.'),
            data: (items) => Column(
              children: [
                for (final entry in items) ...[
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Text('#${entry.rank}', style: Theme.of(context).textTheme.titleMedium),
                    title: Row(
                      children: [
                        AppAvatar(name: entry.user.fullName, size: 34),
                        const SizedBox(width: 10),
                        Expanded(child: Text(entry.user.fullName)),
                      ],
                    ),
                    subtitle: Text(entry.user.username),
                    trailing: Text('${entry.points} puan'),
                  ),
                  const Divider(),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
