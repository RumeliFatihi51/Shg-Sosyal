import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_avatar.dart';
import '../../../core/widgets/app_empty_state.dart';
import '../../../core/widgets/loading_view.dart';
import '../../auth/providers/auth_providers.dart';
import '../../communities/providers/community_providers.dart';
import '../../events/providers/event_providers.dart';
import '../providers/feed_providers.dart';
import '../widgets/feed_item_card.dart';

class FeedScreen extends ConsumerWidget {
  const FeedScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feed = ref.watch(feedItemsProvider);
    final selected = ref.watch(feedFilterProvider);
    final user = ref.watch(authControllerProvider).valueOrNull;
    final events = ref.watch(eventsProvider).valueOrNull ?? const [];
    final communities = ref.watch(communitiesProvider).valueOrNull ?? const [];
    final filters = {
      'for-you': 'Sana göre',
      'today': 'Bugün',
      'events': 'Etkinlikler',
      'communities': 'Topluluklar',
      'friends': 'Arkadaşlar',
    };

    return Scaffold(
      appBar: AppBar(
        title: const Text('Ana Akış'),
        actions: [
          IconButton(onPressed: () {}, icon: const Icon(Icons.search)),
          IconButton(
            onPressed: () => context.push('/notifications'),
            icon: const Icon(Icons.notifications_none),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(feedItemsProvider.future),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
          children: [
            _TodayStrip(
              eventCount: events.length,
              communityCount: communities.length,
              onCalendar: () => context.push('/calendar'),
            ),
            const SizedBox(height: 14),
            SizedBox(
              height: 38,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: filters.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  final entry = filters.entries.elementAt(index);
                  return ChoiceChip(
                    selected: selected == entry.key,
                    label: Text(entry.value),
                    onSelected: (_) => ref.read(feedFilterProvider.notifier).state = entry.key,
                  );
                },
              ),
            ),
            const SizedBox(height: 14),
            _Composer(
              userName: user?.fullName ?? 'ŞHG',
              onPost: () {},
              onEvent: () => context.push('/events/create'),
              onPoll: () => context.push('/leaderboard'),
            ),
            const SizedBox(height: 12),
            _QuickActions(
              onEvent: () => context.push('/events/create'),
              onCommunity: () => context.push('/communities/create'),
              onCalendar: () => context.push('/calendar'),
              onLeaderboard: () => context.push('/leaderboard'),
            ),
            const SizedBox(height: 14),
            feed.when(
              loading: () => const LoadingView(),
              error: (error, stack) => AppEmptyState(
                title: 'Akış yüklenemedi.',
                message: 'Tekrar dene.',
                actionLabel: 'Yenile',
                onAction: () => ref.invalidate(feedItemsProvider),
              ),
              data: (items) => items.isEmpty
                  ? AppEmptyState(
                      title: 'Bugün henüz sakin.',
                      message: 'İlk gönderiyi sen paylaş.',
                      actionLabel: 'Gönderi paylaş',
                      onAction: () {},
                    )
                  : Column(
                      children: [
                        for (final item in items) ...[
                          FeedItemCard(item: item),
                          const SizedBox(height: 10),
                        ],
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TodayStrip extends StatelessWidget {
  const _TodayStrip({
    required this.eventCount,
    required this.communityCount,
    required this.onCalendar,
  });

  final int eventCount;
  final int communityCount;
  final VoidCallback onCalendar;

  @override
  Widget build(BuildContext context) {
    final text = eventCount == 0
        ? 'Bugün henüz sakin.'
        : '$eventCount etkinlik, $communityCount aktif topluluk';

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
              color: AppColors.primary.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(18),
            ),
            child: const Icon(Icons.bolt_outlined, color: AppColors.primary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Bugün okulda', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 3),
                Text(text, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          TextButton(onPressed: onCalendar, child: const Text('Takvim')),
        ],
      ),
    );
  }
}

class _Composer extends StatelessWidget {
  const _Composer({
    required this.userName,
    required this.onPost,
    required this.onEvent,
    required this.onPoll,
  });

  final String userName;
  final VoidCallback onPost;
  final VoidCallback onEvent;
  final VoidCallback onPoll;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              AppAvatar(name: userName, size: 38),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Okulda ne paylaşmak istiyorsun?',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              ActionChip(
                avatar: const Icon(Icons.edit_outlined, size: 16),
                label: const Text('Gönderi'),
                onPressed: onPost,
              ),
              ActionChip(
                avatar: const Icon(Icons.event_outlined, size: 16),
                label: const Text('Etkinlik'),
                onPressed: onEvent,
              ),
              ActionChip(
                avatar: const Icon(Icons.poll_outlined, size: 16),
                label: const Text('Anket'),
                onPressed: onPoll,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _QuickActions extends StatelessWidget {
  const _QuickActions({
    required this.onEvent,
    required this.onCommunity,
    required this.onCalendar,
    required this.onLeaderboard,
  });

  final VoidCallback onEvent;
  final VoidCallback onCommunity;
  final VoidCallback onCalendar;
  final VoidCallback onLeaderboard;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        _QuickAction(icon: Icons.add_circle_outline, label: 'Etkinlik öner', onTap: onEvent),
        _QuickAction(icon: Icons.groups_2_outlined, label: 'Topluluk kur', onTap: onCommunity),
        _QuickAction(icon: Icons.calendar_month_outlined, label: 'Takvim', onTap: onCalendar),
        _QuickAction(icon: Icons.emoji_events_outlined, label: 'Sıralama', onTap: onLeaderboard),
      ],
    );
  }
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({required this.icon, required this.label, required this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
        decoration: BoxDecoration(
          color: AppColors.surfaceElevated,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 17, color: AppColors.primary),
            const SizedBox(width: 7),
            Text(label, style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    );
  }
}
