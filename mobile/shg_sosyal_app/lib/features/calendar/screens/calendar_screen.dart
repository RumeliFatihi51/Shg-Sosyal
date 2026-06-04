import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../core/widgets/app_empty_state.dart';
import '../../../core/widgets/loading_view.dart';
import '../../events/providers/event_providers.dart';
import '../../events/widgets/event_list_item.dart';

class CalendarScreen extends ConsumerWidget {
  const CalendarScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final events = ref.watch(eventsProvider);
    final today = DateTime.now();
    final days = List.generate(7, (index) => today.add(Duration(days: index)));

    return Scaffold(
      appBar: AppBar(title: const Text('Takvim')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
        children: [
          Row(
            children: [
              Text('Bu hafta', style: Theme.of(context).textTheme.titleLarge),
              const Spacer(),
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(value: 'list', label: Text('Liste')),
                  ButtonSegment(value: 'week', label: Text('Hafta')),
                ],
                selected: const {'list'},
                onSelectionChanged: (_) {},
              ),
            ],
          ),
          const SizedBox(height: 14),
          SizedBox(
            height: 82,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: days.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final day = days[index];
                final selected = index == 0;
                return Container(
                  width: 66,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: selected ? AppColors.primary.withValues(alpha: 0.16) : AppColors.surface,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: selected ? AppColors.primary : AppColors.border),
                  ),
                  child: Column(
                    children: [
                      Text('${day.day}', style: Theme.of(context).textTheme.titleMedium),
                      Text(DateFormatters.dayMonth(day).split(' ').last, style: Theme.of(context).textTheme.bodySmall),
                      const Spacer(),
                      Icon(
                        Icons.circle,
                        size: selected ? 9 : 7,
                        color: selected ? AppColors.primary : AppColors.textMuted,
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 18),
          Container(
            padding: const EdgeInsets.all(15),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                const Icon(Icons.today_outlined, color: AppColors.primary),
                const SizedBox(width: 12),
                Expanded(
                  child: Text('Bugünün etkinlikleri', style: Theme.of(context).textTheme.titleMedium),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          events.when(
            loading: () => const LoadingView(),
            error: (_, __) => const AppEmptyState(title: 'Takvim yüklenemedi.', message: 'Tekrar dene.'),
            data: (items) => items.isEmpty
                ? const AppEmptyState(title: 'Bugün için etkinlik yok.', message: 'Etkinlik öner.')
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
