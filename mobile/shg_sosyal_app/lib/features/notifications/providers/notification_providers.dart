import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../data/models/notification_model.dart';
import '../repositories/notification_repository.dart';
import '../services/notification_service.dart';

final notificationServiceProvider = Provider<NotificationService>((ref) {
  const useApi = bool.fromEnvironment('SHG_USE_API', defaultValue: true);
  if (useApi) return ApiNotificationService(ApiClient());
  return MockNotificationService();
});
final notificationRepositoryProvider = Provider<NotificationRepository>(
  (ref) => NotificationRepository(ref.watch(notificationServiceProvider)),
);

final notificationsProvider = StateNotifierProvider<NotificationController,
    AsyncValue<List<NotificationModel>>>(
  (ref) =>
      NotificationController(ref.watch(notificationRepositoryProvider))..load(),
);

final unreadNotificationCountProvider = Provider<int>((ref) {
  final notifications = ref.watch(notificationsProvider).valueOrNull ??
      const <NotificationModel>[];
  return notifications.where((item) => !item.isRead).length;
});

class NotificationController
    extends StateNotifier<AsyncValue<List<NotificationModel>>> {
  NotificationController(this._repository) : super(const AsyncValue.loading());

  final NotificationRepository _repository;

  Future<void> load() async {
    state = AsyncValue.data(await _repository.getNotifications());
  }

  Future<void> markRead(String id) async {
    final current = state.value ?? const <NotificationModel>[];
    state = AsyncValue.data([
      for (final item in current)
        item.id == id ? item.copyWith(isRead: true) : item,
    ]);
    await _repository.markRead(id);
  }

  Future<void> markAllRead() async {
    final current = state.value ?? const <NotificationModel>[];
    state = AsyncValue.data([
      for (final item in current) item.copyWith(isRead: true),
    ]);
    await _repository.markAllRead();
  }
}
