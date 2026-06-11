import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/app_empty_state.dart';
import '../../../core/widgets/loading_view.dart';
import '../providers/community_providers.dart';
import '../widgets/community_list_item.dart';

class CommunitiesScreen extends ConsumerWidget {
  const CommunitiesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final communities = ref.watch(communitiesProvider);
    final selected = ref.watch(communityTabProvider);
    final tabs = {
      'recommended': 'Önerilen',
      'active': 'Aktif',
      'new': 'Yeni',
      'joined': 'Katıldıklarım',
    };

    return Scaffold(
      appBar: AppBar(
        title: const Text('Topluluklar'),
        actions: [
          IconButton(
            onPressed: () => context.push('/communities/create'),
            icon: const Icon(Icons.add),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
        children: [
          TextField(
            decoration: const InputDecoration(
              hintText: 'Topluluk ara',
              prefixIcon: Icon(Icons.search),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 38,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: tabs.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final entry = tabs.entries.elementAt(index);
                return ChoiceChip(
                  selected: selected == entry.key,
                  label: Text(entry.value),
                  onSelected: (_) =>
                      ref.read(communityTabProvider.notifier).state = entry.key,
                );
              },
            ),
          ),
          const SizedBox(height: 14),
          communities.when(
            loading: () => const LoadingView(),
            error: (_, __) => const AppEmptyState(
              title: 'Topluluklar yüklenemedi.',
              message: 'Birazdan tekrar dene.',
            ),
            data: (items) => items.isEmpty
                ? AppEmptyState(
                    title: 'Topluluklar hareketlenmeye hazır.',
                    message: 'İlk topluluk başvurusunu sen gönder.',
                    actionLabel: 'Topluluk kur',
                    onAction: () => context.push('/communities/create'),
                  )
                : Column(
                    children: [
                      for (final community in items) ...[
                        CommunityListItem(community: community),
                      ],
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}
