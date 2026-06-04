import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/utils/date_formatters.dart';
import '../../../core/widgets/app_empty_state.dart';
import '../../../core/widgets/loading_view.dart';
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
        data: (items) => ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: items.length,
          separatorBuilder: (_, __) => const Divider(),
          itemBuilder: (context, index) {
            final item = items[index];
            return ListTile(
              contentPadding: EdgeInsets.zero,
              leading: Icon(item.isRead ? Icons.notifications_none : Icons.notifications),
              title: Text(item.title),
              subtitle: Text(item.body),
              trailing: Text(DateFormatters.relative(item.createdAt)),
            );
          },
        ),
      ),
    );
  }
}
