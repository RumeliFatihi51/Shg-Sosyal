import '../../../core/network/api_client.dart';
import '../../../core/network/api_mappers.dart';
import '../../../data/mock/mock_notifications.dart';
import '../../../data/models/notification_model.dart';

abstract class NotificationService {
  Future<List<NotificationModel>> fetchNotifications();
  Future<void> markRead(String id);
  Future<void> markAllRead();
}

class MockNotificationService implements NotificationService {
  @override
  Future<List<NotificationModel>> fetchNotifications() async {
    await Future<void>.delayed(const Duration(milliseconds: 140));
    return [...mockNotifications];
  }

  @override
  Future<void> markRead(String id) async {
    await Future<void>.delayed(const Duration(milliseconds: 80));
    final index = mockNotifications.indexWhere((item) => item.id == id);
    if (index == -1) return;
    mockNotifications[index] = mockNotifications[index].copyWith(isRead: true);
  }

  @override
  Future<void> markAllRead() async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    for (var index = 0; index < mockNotifications.length; index++) {
      mockNotifications[index] =
          mockNotifications[index].copyWith(isRead: true);
    }
  }
}

class ApiNotificationService implements NotificationService {
  const ApiNotificationService(this._api);

  final ApiClient _api;

  @override
  Future<List<NotificationModel>> fetchNotifications() async {
    final response = await _api.get('/notifications');
    return apiList(response.data).map(notificationFromJson).toList();
  }

  @override
  Future<void> markRead(String id) {
    return _api.post('/notifications/$id/read');
  }

  @override
  Future<void> markAllRead() {
    return _api.post('/notifications/read-all');
  }
}
