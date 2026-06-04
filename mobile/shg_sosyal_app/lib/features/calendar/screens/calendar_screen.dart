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
        padding: const EdgeInsets.all(16),
        children: [
          SizedBox(
            height: 74,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: days.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final day = days[index];
                final selected = index == 0;
                return Container(
                  width: 64,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: selected ? AppColors.primary.withValues(alpha: 0.18) : AppColors.surface,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: selected ? AppColors.primary : AppColors.border),
                  ),
                  child: Column(
                    children: [
                      Text('${day.day}', style: Theme.of(context).textTheme.titleMedium),
                      Text(DateFormatters.dayMonth(day).split(' ').last),
                      const SizedBox(height: 4),
                      const Icon(Icons.circle, size: 7, color: AppColors.primary),
                    ],
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 18),
          Text('Yakında', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 12),
          events.when(
            loading: () => const LoadingView(),
            error: (_, __) => const AppEmptyState(title: 'Takvim yüklenemedi.', message: 'Tekrar dene.'),
            data: (items) => Column(
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
