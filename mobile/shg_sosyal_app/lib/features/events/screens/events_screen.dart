import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/app_empty_state.dart';
import '../../../core/widgets/loading_view.dart';
import '../providers/event_providers.dart';
import '../widgets/event_list_item.dart';

class EventsScreen extends ConsumerWidget {
  const EventsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final events = ref.watch(eventsProvider);
    final selected = ref.watch(eventTabProvider);
    final tabs = {'upcoming': 'Yaklaşan', 'today': 'Bugün', 'popular': 'Popüler', 'joined': 'Katıldıklarım'};

    return Scaffold(
      appBar: AppBar(
        title: const Text('Etkinlikler'),
        actions: [
          IconButton(onPressed: () => context.push('/calendar'), icon: const Icon(Icons.calendar_month_outlined)),
          IconButton(onPressed: () => context.push('/events/create'), icon: const Icon(Icons.add)),
        ],
      ),
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
                  selected: selected == entry.key,
                  label: Text(entry.value),
                  onSelected: (_) => ref.read(eventTabProvider.notifier).state = entry.key,
                );
              },
            ),
          ),
          const SizedBox(height: 14),
          events.when(
            loading: () => const LoadingView(),
            error: (_, __) => const AppEmptyState(title: 'Etkinlikler yüklenemedi.', message: 'Birazdan tekrar dene.'),
            data: (items) => items.isEmpty
                ? AppEmptyState(
                    title: 'Bugün için etkinlik yok.',
                    message: 'İlk etkinliği sen öner.',
                    actionLabel: 'Etkinlik öner',
                    onAction: () => context.push('/events/create'),
                  )
                : Column(
                    children: [
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
