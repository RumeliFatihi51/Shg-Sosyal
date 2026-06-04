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

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(22),
      onTap: item.event == null ? null : () => context.push('/events/${item.event!.id}'),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: AppColors.border),
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
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          item.author.fullName,
                          style: Theme.of(context).textTheme.titleSmall,
                        ),
                      ),
                      Text(
                        DateFormatters.relative(item.createdAt),
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Text(item.author.username, style: Theme.of(context).textTheme.bodySmall),
                      const SizedBox(width: 8),
                      AppBadge(label: _typeLabel),
                    ],
                  ),
                  if (item.title != null) ...[
                    const SizedBox(height: 12),
                    Text(item.title!, style: Theme.of(context).textTheme.titleMedium),
                  ],
                  const SizedBox(height: 8),
                  Text(item.content, style: Theme.of(context).textTheme.bodyMedium),
                  if (item.event != null) ...[
                    const SizedBox(height: 12),
                    _EventMiniPreview(item: item),
                  ],
                  if (item.pollOptions.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    _PollPreview(item: item),
                  ],
                  if (item.badge != null) ...[
                    const SizedBox(height: 12),
                    AppBadge(
                      label: item.badge!.name,
                      icon: Icons.workspace_premium_outlined,
                      color: AppColors.warning,
                    ),
                  ],
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      _Action(icon: Icons.mode_comment_outlined, label: '${item.commentCount}'),
                      const SizedBox(width: 18),
                      _Action(icon: Icons.favorite_border, label: '${item.likeCount}'),
                      const SizedBox(width: 18),
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

class _EventMiniPreview extends StatelessWidget {
  const _EventMiniPreview({required this.item});

  final FeedItemModel item;

  @override
  Widget build(BuildContext context) {
    final event = item.event!;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 54,
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.12),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Column(
              children: [
                Text('${event.startsAt.day}', style: Theme.of(context).textTheme.titleMedium),
                Text(DateFormatters.dayMonth(event.startsAt).split(' ').last),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(event.title, style: Theme.of(context).textTheme.titleSmall),
                const SizedBox(height: 4),
                Text(
                  '${DateFormatters.time(event.startsAt)} · ${event.location}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                Text(
                  '${event.participantCount} kişi katılıyor',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
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
          padding: const EdgeInsets.only(bottom: 8),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: Stack(
              children: [
                Container(height: 42, color: AppColors.surfaceElevated),
                FractionallySizedBox(
                  widthFactor: ratio,
                  child: Container(height: 42, color: AppColors.primary.withOpacity(0.18)),
                ),
                Positioned.fill(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
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
