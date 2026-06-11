import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

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
    final unreadCount = ref.watch(unreadNotificationCountProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Bildirimler'),
        actions: [
          TextButton(
            onPressed: unreadCount == 0
                ? null
                : () => ref.read(notificationsProvider.notifier).markAllRead(),
            child: const Text('Okundu yap'),
          ),
        ],
      ),
      body: notifications.when(
        loading: () => const LoadingView(),
        error: (_, __) => AppEmptyState(
          title: 'Bildirimler yüklenemedi.',
          message: 'Tekrar dene.',
          actionLabel: 'Yenile',
          onAction: () => ref.read(notificationsProvider.notifier).load(),
        ),
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
                  return _NotificationItem(
                    item: item,
                    onTap: () async {
                      await ref
                          .read(notificationsProvider.notifier)
                          .markRead(item.id);
                      if (!context.mounted) return;
                      final route =
                          item.targetRoute ?? _routeForType(item.type);
                      context.push(route);
                    },
                  );
                },
              ),
      ),
    );
  }

  String _routeForType(NotificationType type) {
    return switch (type) {
      NotificationType.friendRequest => '/friends',
      NotificationType.message => '/messages',
      NotificationType.eventReminder => '/events',
      NotificationType.community => '/communities',
      NotificationType.badge => '/badges',
      NotificationType.leaderboard => '/leaderboard',
    };
  }
}

class _NotificationItem extends StatelessWidget {
  const _NotificationItem({
    required this.item,
    required this.onTap,
  });

  final NotificationModel item;
  final VoidCallback onTap;

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
    return InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: AppColors.border)),
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
                      Expanded(
                        child: Text(
                          item.title,
                          style:
                              Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: item.isRead
                                        ? FontWeight.w600
                                        : FontWeight.w800,
                                  ),
                        ),
                      ),
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
                  Text(
                    DateFormatters.relative(item.createdAt),
                    style: Theme.of(context).textTheme.bodySmall,
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
