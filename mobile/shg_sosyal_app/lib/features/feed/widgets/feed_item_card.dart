import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../core/widgets/app_avatar.dart';
import '../../../core/widgets/app_badge.dart';
import '../../../data/models/feed_item_model.dart';

class FeedItemCard extends StatelessWidget {
  const FeedItemCard({required this.item, super.key});

  final FeedItemModel item;

  String get _typeLabel {
    return switch (item.type) {
      FeedItemType.event => 'Etkinlik',
      FeedItemType.announcement => 'Duyuru',
      FeedItemType.poll => 'Anket',
      FeedItemType.friendActivity => 'Arkadaş',
      FeedItemType.badge => 'Rozet',
      FeedItemType.leaderboard => 'Sıralama',
      FeedItemType.post => 'Gönderi',
    };
  }

  Color get _tone {
    return switch (item.type) {
      FeedItemType.event => AppColors.primary,
      FeedItemType.announcement => AppColors.warning,
      FeedItemType.poll => AppColors.secondary,
      FeedItemType.friendActivity => AppColors.success,
      FeedItemType.badge => AppColors.warning,
      FeedItemType.leaderboard => AppColors.secondary,
      FeedItemType.post => AppColors.textMuted,
    };
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: item.event == null ? null : () => context.push('/events/${item.event!.id}'),
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
        decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: AppColors.border)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AppAvatar(name: item.author.fullName),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 6,
                    runSpacing: 3,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      Text(item.author.fullName, style: Theme.of(context).textTheme.titleSmall),
                      Text(
                        '${item.author.username} · ${DateFormatters.relative(item.createdAt)}',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      AppBadge(label: _typeLabel, color: _tone),
                    ],
                  ),
                  if (item.title != null) ...[
                    const SizedBox(height: 8),
                    Text(item.title!, style: Theme.of(context).textTheme.titleMedium),
                  ],
                  const SizedBox(height: 6),
                  Text(item.content, style: Theme.of(context).textTheme.bodyMedium),
                  if (item.event != null) ...[
                    const SizedBox(height: 10),
                    _EventPreview(item: item),
                  ],
                  if (item.localImageBytes != null || item.imageUrl != null) ...[
                    const SizedBox(height: 10),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: item.localImageBytes != null
                          ? Image.memory(
                              item.localImageBytes!,
                              width: double.infinity,
                              fit: BoxFit.cover,
                            )
                          : Image.network(
                              item.imageUrl!,
                              width: double.infinity,
                              fit: BoxFit.cover,
                            ),
                    ),
                  ],
                  if (item.pollOptions.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    _PollPreview(item: item),
                  ],
                  if (item.badge != null) ...[
                    const SizedBox(height: 10),
                    AppBadge(
                      label: item.badge!.name,
                      icon: Icons.workspace_premium_outlined,
                      color: AppColors.warning,
                    ),
                  ],
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _Action(icon: Icons.mode_comment_outlined, label: 'Yanıtla'),
                      const Spacer(),
                      _Action(icon: Icons.favorite_border, label: '${item.likeCount}'),
                      const Spacer(),
                      const _Action(icon: Icons.ios_share_outlined, label: 'Paylaş'),
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
}

class _EventPreview extends StatelessWidget {
  const _EventPreview({required this.item});

  final FeedItemModel item;

  @override
  Widget build(BuildContext context) {
    final event = item.event!;
    final capacityText = event.capacity == null
        ? '${event.participantCount} kişi katılıyor'
        : '${event.participantCount}/${event.capacity} kişi';

    return Container(
      padding: const EdgeInsets.all(11),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 42,
            child: Column(
              children: [
                Text('${event.startsAt.day}', style: Theme.of(context).textTheme.titleMedium),
                Text(
                  DateFormatters.dayMonth(event.startsAt).split(' ').last,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(event.title, style: Theme.of(context).textTheme.titleSmall),
                const SizedBox(height: 3),
                Text(
                  '${DateFormatters.time(event.startsAt)} · ${event.location}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                Text(capacityText, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          TextButton(
            onPressed: () => context.push('/events/${event.id}'),
            child: const Text('Detay'),
          ),
        ],
      ),
    );
  }
}

class _PollPreview extends StatelessWidget {
  const _PollPreview({required this.item});

  final FeedItemModel item;

  @override
  Widget build(BuildContext context) {
    final total = item.pollOptions.fold<int>(0, (sum, option) => sum + option.voteCount);
    return Column(
      children: item.pollOptions.map((option) {
        final ratio = total == 0 ? 0.0 : option.voteCount / total;
        return Padding(
          padding: const EdgeInsets.only(bottom: 7),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Stack(
              children: [
                Container(height: 38, color: AppColors.surface),
                FractionallySizedBox(
                  widthFactor: ratio,
                  child: Container(height: 38, color: AppColors.secondary.withValues(alpha: 0.18)),
                ),
                Positioned.fill(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 11),
                    child: Row(
                      children: [
                        Expanded(child: Text(option.label)),
                        Text('${option.voteCount} oy'),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _Action extends StatelessWidget {
  const _Action({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 18, color: AppColors.textMuted),
        const SizedBox(width: 6),
        Text(label, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}
