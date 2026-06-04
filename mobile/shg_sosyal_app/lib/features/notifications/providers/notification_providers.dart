import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../data/models/notification_model.dart';
import '../repositories/notification_repository.dart';
import '../services/notification_service.dart';

final notificationServiceProvider =
    Provider<NotificationService>((ref) => MockNotificationService());
final notificationRepositoryProvider = Provider<NotificationRepository>(
  (ref) => NotificationRepository(ref.watch(notificationServiceProvider)),
);

final notificationsProvider = FutureProvider<List<NotificationModel>>((ref) {
  return ref.watch(notificationRepositoryProvider).getNotifications();
});
