import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../core/widgets/app_avatar.dart';
import '../../../core/widgets/app_badge.dart';
import '../../../data/models/event_model.dart';

class EventListItem extends StatelessWidget {
  const EventListItem({required this.event, super.key});

  final EventModel event;

  String get _categoryLabel {
    return switch (event.category) {
      EventCategory.sport => 'Spor',
      EventCategory.club => 'Kulüp',
      EventCategory.workshop => 'Atölye',
      EventCategory.social => 'Sosyal',
      EventCategory.competition => 'Yarışma',
      EventCategory.science => 'Bilim',
      EventCategory.art => 'Sanat',
    };
  }

  @override
  Widget build(BuildContext context) {
    final capacity = event.capacity;
    final progress = capacity == null ? null : (event.participantCount / capacity).clamp(0.0, 1.0);
    final capacityText = capacity == null
        ? '${event.participantCount} kişi katılıyor'
        : '${event.participantCount}/$capacity kişi';

    return InkWell(
      onTap: () => context.push('/events/${event.id}'),
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
        decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: AppColors.border)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 52,
              child: Column(
                children: [
                  Text('${event.startsAt.day}', style: Theme.of(context).textTheme.titleLarge),
                  Text(
                    DateFormatters.dayMonth(event.startsAt).split(' ').last,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: [
                      AppBadge(label: _categoryLabel, color: AppColors.secondary),
                      if (event.myStatus == EventParticipationStatus.going)
                        const AppBadge(label: 'Katılıyorsun', color: AppColors.success),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(event.title, style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 5),
                  Text(
                    '${DateFormatters.time(event.startsAt)} · ${event.location}',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  Text(event.organizerName, style: Theme.of(context).textTheme.bodySmall),
                  const SizedBox(height: 9),
                  if (progress != null) ...[
                    ClipRRect(
                      borderRadius: BorderRadius.circular(999),
                      child: LinearProgressIndicator(
                        value: progress,
                        minHeight: 6,
                        backgroundColor: AppColors.surface,
                        valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
                      ),
                    ),
                    const SizedBox(height: 7),
                  ],
                  Row(
                    children: [
                      Expanded(child: Text(capacityText, style: Theme.of(context).textTheme.bodySmall)),
                      if (event.friendParticipants.isNotEmpty) ...[
                        _FriendStack(friends: event.friendParticipants),
                        const SizedBox(width: 8),
                        Flexible(
                          child: Text(
                            _friendText(),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: AppColors.primary,
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _friendText() {
    final firstName = event.friendParticipants.first.fullName.split(' ').first;
    final rest = event.friendParticipants.length - 1;
    if (rest <= 0) return '$firstName katılıyor';
    return '$firstName ve $rest arkadaşın';
  }
}

class _FriendStack extends StatelessWidget {
  const _FriendStack({required this.friends});

  final List<dynamic> friends;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 42 + (friends.take(3).length - 1) * 14,
      height: 26,
      child: Stack(
        children: [
          for (final entry in friends.take(3).toList().asMap().entries)
            Positioned(
              left: entry.key * 14,
              child: Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.background, width: 2),
                ),
                child: AppAvatar(name: entry.value.fullName, size: 26),
              ),
            ),
        ],
      ),
    );
  }
}
