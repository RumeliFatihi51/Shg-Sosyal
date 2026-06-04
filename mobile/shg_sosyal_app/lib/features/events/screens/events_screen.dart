import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_empty_state.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../data/models/event_model.dart';
import '../providers/event_providers.dart';
import '../widgets/event_list_item.dart';

class EventsScreen extends ConsumerWidget {
  const EventsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final events = ref.watch(eventsProvider);
    final selected = ref.watch(eventTabProvider);
    final tabs = {
      'upcoming': 'Yaklaşan',
      'today': 'Bugün',
      'popular': 'Popüler',
      'joined': 'Katıldıklarım',
    };

    return Scaffold(
      appBar: AppBar(
        title: const Text('Etkinlikler'),
        actions: [
          IconButton(
            onPressed: () => context.push('/calendar'),
            icon: const Icon(Icons.calendar_month_outlined),
          ),
          IconButton(onPressed: () => context.push('/events/create'), icon: const Icon(Icons.add)),
        ],
      ),
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
                  selected: selected == entry.key,
                  label: Text(entry.value),
                  onSelected: (_) => ref.read(eventTabProvider.notifier).state = entry.key,
                );
              },
            ),
          ),
          const SizedBox(height: 14),
          _CategoryRail(),
          const SizedBox(height: 14),
          events.when(
            loading: () => const LoadingView(),
            error: (_, __) => const AppEmptyState(
              title: 'Etkinlikler yüklenemedi.',
              message: 'Birazdan tekrar dene.',
            ),
            data: (items) => items.isEmpty
                ? AppEmptyState(
                    title: 'Bugün için etkinlik yok.',
                    message: 'İlk etkinliği sen öner.',
                    actionLabel: 'Etkinlik öner',
                    onAction: () => context.push('/events/create'),
                  )
                : Column(
                    children: [
                      _FeaturedEvent(event: items.first),
                      const SizedBox(height: 14),
                      for (final event in items) ...[
                        EventListItem(event: event),
                        const SizedBox(height: 12),
                      ],
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}

class _CategoryRail extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    const categories = [
      ('Tümü', Icons.auto_awesome_outlined),
      ('Spor', Icons.sports_basketball_outlined),
      ('Atölye', Icons.construction_outlined),
      ('Sanat', Icons.theater_comedy_outlined),
      ('Bilim', Icons.science_outlined),
    ];

    return SizedBox(
      height: 40,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: categories.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final item = categories[index];
          return Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: index == 0 ? AppColors.primary.withValues(alpha: 0.14) : AppColors.surface,
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: index == 0 ? AppColors.primary : AppColors.border),
            ),
            child: Row(
              children: [
                Icon(item.$2, size: 16, color: index == 0 ? AppColors.primary : AppColors.textMuted),
                const SizedBox(width: 7),
                Text(item.$1, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _FeaturedEvent extends StatelessWidget {
  const _FeaturedEvent({required this.event});

  final EventModel event;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: BorderRadius.circular(26),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.22)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Öne çıkan', style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 8),
          Text(event.title, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 6),
          Text(
            '${event.organizerName} · ${event.participantCount} kişi katılıyor',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }
}
