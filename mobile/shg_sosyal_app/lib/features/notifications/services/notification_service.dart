import '../../../data/mock/mock_notifications.dart';
import '../../../data/models/notification_model.dart';

abstract class NotificationService {
  Future<List<NotificationModel>> fetchNotifications();
}

class MockNotificationService implements NotificationService {
  @override
  Future<List<NotificationModel>> fetchNotifications() async {
    await Future<void>.delayed(const Duration(milliseconds: 140));
    return mockNotifications;
  }
}
