import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/app_empty_state.dart';
import '../../../core/widgets/loading_view.dart';
import '../providers/feed_providers.dart';
import '../widgets/feed_item_card.dart';

class FeedScreen extends ConsumerWidget {
  const FeedScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feed = ref.watch(feedItemsProvider);
    final selected = ref.watch(feedFilterProvider);
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
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          children: [
            SizedBox(
              height: 42,
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
            const SizedBox(height: 12),
            _Composer(onPost: () {}),
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
                  ? const AppEmptyState(
                      title: 'Bugün henüz sakin.',
                      message: 'İlk gönderiyi sen paylaş.',
                      actionLabel: 'Gönderi paylaş',
                    )
                  : Column(
                      children: [
                        for (final item in items) ...[
                          FeedItemCard(item: item),
                          const SizedBox(height: 12),
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

class _Composer extends StatelessWidget {
  const _Composer({required this.onPost});

  final VoidCallback onPost;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: Theme.of(context).dividerTheme.color!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Okulda ne paylaşmak istiyorsun?', style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            children: const [
              ActionChip(label: Text('Gönderi')),
              ActionChip(label: Text('Etkinlik')),
              ActionChip(label: Text('Anket')),
            ],
          ),
        ],
      ),
    );
  }
}
