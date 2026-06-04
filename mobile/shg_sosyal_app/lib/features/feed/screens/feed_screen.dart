import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_avatar.dart';
import '../../../core/widgets/app_empty_state.dart';
import '../../../core/widgets/loading_view.dart';
import '../../auth/providers/auth_providers.dart';
import '../providers/feed_providers.dart';
import '../widgets/feed_item_card.dart';

class FeedScreen extends ConsumerWidget {
  const FeedScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feed = ref.watch(feedItemsProvider);
    final selected = ref.watch(feedFilterProvider);
    final user = ref.watch(authControllerProvider).valueOrNull;
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
          IconButton(onPressed: () => context.push('/explore'), icon: const Icon(Icons.search)),
          IconButton(
            onPressed: () => context.push('/notifications'),
            icon: const Icon(Icons.notifications_none),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(feedItemsProvider.future),
        child: ListView(
          padding: const EdgeInsets.only(bottom: 86),
          children: [
            SizedBox(
              height: 45,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
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
            const Divider(height: 1),
            _Composer(
              userName: user?.fullName ?? 'ŞHG',
              onPost: () {},
              onEvent: () => context.push('/events/create'),
              onPoll: () => context.push('/leaderboard'),
            ),
            feed.when(
              loading: () => const Padding(
                padding: EdgeInsets.all(16),
                child: LoadingView(),
              ),
              error: (error, stack) => Padding(
                padding: const EdgeInsets.all(16),
                child: AppEmptyState(
                  title: 'Akış yüklenemedi.',
                  message: 'Tekrar dene.',
                  actionLabel: 'Yenile',
                  onAction: () => ref.invalidate(feedItemsProvider),
                ),
              ),
              data: (items) => items.isEmpty
                  ? Padding(
                      padding: const EdgeInsets.all(16),
                      child: AppEmptyState(
                        title: 'Bugün henüz sakin.',
                        message: 'İlk gönderiyi sen paylaş.',
                        actionLabel: 'Gönderi paylaş',
                        onAction: () {},
                      ),
                    )
                  : Column(
                      children: [
                        for (final item in items) FeedItemCard(item: item),
                      ],
                    ),
            ),
          ],
        ),
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
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AppAvatar(name: userName, size: 40),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Okulda ne paylaşmak istiyorsun?',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _ComposerAction(icon: Icons.edit_outlined, label: 'Gönderi', onTap: onPost),
                    _ComposerAction(icon: Icons.event_outlined, label: 'Etkinlik', onTap: onEvent),
                    _ComposerAction(icon: Icons.poll_outlined, label: 'Anket', onTap: onPoll),
                    const Spacer(),
                    FilledButton(
                      onPressed: onPost,
                      style: FilledButton.styleFrom(
                        minimumSize: const Size(78, 36),
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                      ),
                      child: const Text('Paylaş'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ComposerAction extends StatelessWidget {
  const _ComposerAction({required this.icon, required this.label, required this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      tooltip: label,
      visualDensity: VisualDensity.compact,
      onPressed: onTap,
      icon: Icon(icon, size: 20, color: AppColors.primary),
    );
  }
}
