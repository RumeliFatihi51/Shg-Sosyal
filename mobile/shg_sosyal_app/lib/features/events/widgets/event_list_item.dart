import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../data/models/event_model.dart';

class EventListItem extends StatelessWidget {
  const EventListItem({required this.event, super.key});

  final EventModel event;

  @override
  Widget build(BuildContext context) {
    final capacityText = event.capacity == null
        ? 'Kontenjan açık'
        : '${event.participantCount}/${event.capacity} kişi';

    return InkWell(
      onTap: () => context.push('/events/${event.id}'),
      borderRadius: BorderRadius.circular(22),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Container(
              width: 58,
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  Text('${event.startsAt.day}', style: Theme.of(context).textTheme.titleLarge),
                  Text(DateFormatters.dayMonth(event.startsAt).split(' ').last),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(event.title, style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 5),
                  Text(
                    '${DateFormatters.time(event.startsAt)} · ${event.location}',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  Text(event.organizerName, style: Theme.of(context).textTheme.bodySmall),
                  const SizedBox(height: 8),
                  Text(capacityText, style: Theme.of(context).textTheme.bodySmall),
                  if (event.friendParticipants.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        '${event.friendParticipants.first.fullName.split(' ').first} ve ${event.friendParticipants.length - 1} arkadaşın katılıyor',
                        style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700),
                      ),
                    ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right),
          ],
        ),
      ),
    );
  }
}
