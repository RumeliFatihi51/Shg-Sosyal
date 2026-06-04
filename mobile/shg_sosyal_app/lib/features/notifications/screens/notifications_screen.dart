import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../core/widgets/app_empty_state.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../data/models/notification_model.dart';
import '../providers/notification_providers.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifications = ref.watch(notificationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Bildirimler'),
        actions: [TextButton(onPressed: () {}, child: const Text('Okundu yap'))],
      ),
      body: notifications.when(
        loading: () => const LoadingView(),
        error: (_, __) => const AppEmptyState(title: 'Bildirimler yüklenemedi.', message: 'Tekrar dene.'),
        data: (items) => items.isEmpty
            ? const AppEmptyState(
                title: 'Henüz bildirim yok.',
                message: 'Yeni hareketler burada görünecek.',
                icon: Icons.notifications_none,
              )
            : ListView.builder(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
                itemCount: items.length,
                itemBuilder: (context, index) {
                  final item = items[index];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: _NotificationItem(item: item),
                  );
                },
              ),
      ),
    );
  }
}

class _NotificationItem extends StatelessWidget {
  const _NotificationItem({required this.item});

  final NotificationModel item;

  IconData get _icon {
    return switch (item.type) {
      NotificationType.friendRequest => Icons.person_add_alt,
      NotificationType.message => Icons.chat_bubble_outline,
      NotificationType.eventReminder => Icons.event_available_outlined,
      NotificationType.community => Icons.groups_2_outlined,
      NotificationType.badge => Icons.workspace_premium_outlined,
      NotificationType.leaderboard => Icons.emoji_events_outlined,
    };
  }

  Color get _color {
    return switch (item.type) {
      NotificationType.friendRequest => AppColors.success,
      NotificationType.message => AppColors.primary,
      NotificationType.eventReminder => AppColors.warning,
      NotificationType.community => AppColors.secondary,
      NotificationType.badge => AppColors.warning,
      NotificationType.leaderboard => AppColors.primary,
    };
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: item.isRead ? AppColors.surface : AppColors.surfaceElevated,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: item.isRead ? AppColors.border : _color.withValues(alpha: 0.38),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: _color.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(_icon, color: _color),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(child: Text(item.title, style: Theme.of(context).textTheme.titleMedium)),
                    if (!item.isRead)
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 5),
                Text(item.body, style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(height: 8),
                Text(DateFormatters.relative(item.createdAt), style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
