import '../../../data/models/notification_model.dart';
import '../services/notification_service.dart';

class NotificationRepository {
  const NotificationRepository(this._service);

  final NotificationService _service;

  Future<List<NotificationModel>> getNotifications() {
    return _service.fetchNotifications();
  }

  Future<void> markRead(String id) {
    return _service.markRead(id);
  }

  Future<void> markAllRead() {
    return _service.markAllRead();
  }
}
