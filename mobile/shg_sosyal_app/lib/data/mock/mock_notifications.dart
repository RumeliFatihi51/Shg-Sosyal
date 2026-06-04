import '../models/notification_model.dart';

final mockNotifications = <NotificationModel>[
  NotificationModel(
    id: 'n1',
    type: NotificationType.eventReminder,
    title: 'Robotik Mini Demo bugün.',
    body: 'Etkinlik 15:00’te Bilişim Laboratuvarı’nda başlıyor.',
    createdAt: DateTime.now().subtract(const Duration(minutes: 20)),
    isRead: false,
  ),
  NotificationModel(
    id: 'n2',
    type: NotificationType.friendRequest,
    title: 'Yeni arkadaşlık isteği',
    body: 'Efe Demir seni arkadaş olarak eklemek istiyor.',
    createdAt: DateTime.now().subtract(const Duration(hours: 2)),
    isRead: false,
  ),
  NotificationModel(
    id: 'n3',
    type: NotificationType.badge,
    title: 'Rozet kazandın',
    body: 'İlk Katılım rozeti profiline eklendi.',
    createdAt: DateTime.now().subtract(const Duration(days: 1)),
    isRead: true,
  ),
];
