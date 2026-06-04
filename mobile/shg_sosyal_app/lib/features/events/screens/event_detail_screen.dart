import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../core/widgets/app_avatar.dart';
import '../../../core/widgets/app_badge.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_empty_state.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../data/models/event_model.dart';
import '../providers/event_providers.dart';

class EventDetailScreen extends ConsumerWidget {
  const EventDetailScreen({required this.id, super.key});

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final event = ref.watch(eventDetailProvider(id));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Etkinlik'),
        actions: [
          IconButton(onPressed: () {}, icon: const Icon(Icons.ios_share_outlined)),
          IconButton(onPressed: () {}, icon: const Icon(Icons.bookmark_border)),
        ],
      ),
      body: event.when(
        loading: () => const LoadingView(),
        error: (_, __) => const AppEmptyState(title: 'Etkinlik açılmadı.', message: 'Tekrar dene.'),
        data: (item) {
          if (item == null) {
            return const AppEmptyState(
              title: 'Etkinlik bulunamadı.',
              message: 'Bu etkinlik kaldırılmış olabilir.',
            );
          }
          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
            children: [
              _Hero(event: item),
              const SizedBox(height: 14),
              _ActionPanel(event: item),
              const SizedBox(height: 14),
              _InfoGrid(event: item),
              const SizedBox(height: 18),
              Text('Açıklama', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              Text(item.description, style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 18),
              if (item.friendParticipants.isNotEmpty) ...[
                Text('Arkadaşların katılıyor', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 10),
                _FriendPanel(event: item),
                const SizedBox(height: 18),
              ],
              Text('Katılımcılar', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 10),
              _ParticipantPreview(event: item),
            ],
          );
        },
      ),
    );
  }
}

class _Hero extends StatelessWidget {
  const _Hero({required this.event});

  final EventModel event;

  @override
  Widget build(BuildContext context) {
    final capacity = event.capacity;
    final progress = capacity == null ? null : (event.participantCount / capacity).clamp(0.0, 1.0);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 64,
                padding: const EdgeInsets.symmetric(vertical: 11),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.24)),
                ),
                child: Column(
                  children: [
                    Text('${event.startsAt.day}', style: Theme.of(context).textTheme.headlineMedium),
                    Text(DateFormatters.dayMonth(event.startsAt).split(' ').last),
                  ],
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        AppBadge(label: _categoryLabel(event.category), color: AppColors.secondary),
                        if (event.myStatus == EventParticipationStatus.going)
                          const AppBadge(label: 'Katılıyorsun', color: AppColors.success),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(event.title, style: Theme.of(context).textTheme.headlineMedium),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            '${event.organizerName} · ${event.participantCount} kişi katılıyor',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          if (progress != null) ...[
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(999),
              child: LinearProgressIndicator(
                value: progress,
                minHeight: 8,
                backgroundColor: AppColors.surfaceElevated,
                valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _ActionPanel extends StatelessWidget {
  const _ActionPanel({required this.event});

  final EventModel event;

  @override
  Widget build(BuildContext context) {
    final isGoing = event.myStatus == EventParticipationStatus.going;
    return Row(
      children: [
        Expanded(
          child: AppButton(
            label: isGoing ? 'Katılıyorsun' : 'Katıl',
            icon: Icons.check_circle_outline,
            onPressed: () {},
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: AppButton(
            label: 'İlgileniyorum',
            icon: Icons.star_border,
            outlined: true,
            onPressed: () {},
          ),
        ),
      ],
    );
  }
}

class _InfoGrid extends StatelessWidget {
  const _InfoGrid({required this.event});

  final EventModel event;

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      childAspectRatio: 1.8,
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      children: [
        _Info(icon: Icons.schedule, label: 'Zaman', text: DateFormatters.full(event.startsAt)),
        _Info(icon: Icons.location_on_outlined, label: 'Konum', text: event.location),
        _Info(icon: Icons.groups_2_outlined, label: 'Topluluk', text: event.organizerName),
        _Info(icon: Icons.people_outline, label: 'Kontenjan', text: _capacityText(event)),
      ],
    );
  }
}

class _Info extends StatelessWidget {
  const _Info({required this.icon, required this.label, required this.text});

  final IconData icon;
  final String label;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: AppColors.primary),
          const Spacer(),
          Text(label, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 2),
          Text(text, maxLines: 1, overflow: TextOverflow.ellipsis),
        ],
      ),
    );
  }
}

class _FriendPanel extends StatelessWidget {
  const _FriendPanel({required this.event});

  final EventModel event;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          for (final friend in event.friendParticipants.take(4)) ...[
            AppAvatar(name: friend.fullName, size: 34),
            const SizedBox(width: 6),
          ],
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              '${event.friendParticipants.length} arkadaşın bu etkinliğe katılıyor.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
        ],
      ),
    );
  }
}

class _ParticipantPreview extends StatelessWidget {
  const _ParticipantPreview({required this.event});

  final EventModel event;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          const Icon(Icons.people_outline, color: AppColors.textMuted),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              '${event.participantCount} kişi katılıyor',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
          TextButton(onPressed: () {}, child: const Text('Gör')),
        ],
      ),
    );
  }
}

String _categoryLabel(EventCategory category) {
  return switch (category) {
    EventCategory.sport => 'Spor',
    EventCategory.club => 'Kulüp',
    EventCategory.workshop => 'Atölye',
    EventCategory.social => 'Sosyal',
    EventCategory.competition => 'Yarışma',
    EventCategory.science => 'Bilim',
    EventCategory.art => 'Sanat',
  };
}

String _capacityText(EventModel event) {
  final capacity = event.capacity;
  if (capacity == null) return 'Kontenjan açık';
  return '${event.participantCount}/$capacity kişi';
}
