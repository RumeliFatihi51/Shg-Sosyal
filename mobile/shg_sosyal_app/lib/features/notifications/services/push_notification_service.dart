import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';

const _androidChannel = AndroidNotificationChannel(
  'shg_social_default',
  'ŞHG Sosyal',
  description: 'Mesaj, arkadaşlık ve etkinlik bildirimleri',
  importance: Importance.high,
);

final pushNotificationServiceProvider = Provider<PushNotificationService>(
  (ref) => PushNotificationService(ApiClient()),
);

class PushNotificationService {
  PushNotificationService(this._api);

  final ApiClient _api;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  bool _initialized = false;
  String? _registeredToken;

  Future<void> bootstrap() async {
    if (kIsWeb) return;
    if (Firebase.apps.isEmpty) return;

    await _initializeLocalNotifications();
    await _requestPermission();
    await _registerCurrentToken();

    FirebaseMessaging.instance.onTokenRefresh.listen(registerToken);
    FirebaseMessaging.onMessage.listen(_showForegroundNotification);
  }

  Future<void> _initializeLocalNotifications() async {
    if (_initialized) return;

    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const settings = InitializationSettings(android: android);
    await _localNotifications.initialize(settings: settings);

    final androidPlugin =
        _localNotifications.resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>();
    await androidPlugin?.createNotificationChannel(_androidChannel);
    await androidPlugin?.requestNotificationsPermission();

    _initialized = true;
  }

  Future<void> _requestPermission() {
    return FirebaseMessaging.instance.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );
  }

  Future<void> _registerCurrentToken() async {
    final token = await FirebaseMessaging.instance.getToken();
    if (token == null || token.isEmpty) return;
    await registerToken(token);
  }

  Future<void> registerToken(String token) async {
    if (token == _registeredToken) return;

    await _api.post(
      '/push/token',
      data: {
        'token': token,
        'platform': 'android',
      },
    );
    _registeredToken = token;
  }

  Future<void> unregisterCurrentToken() async {
    if (kIsWeb) return;
    if (Firebase.apps.isEmpty) return;

    final token = await FirebaseMessaging.instance.getToken();
    if (token == null || token.isEmpty) return;
    await _api.delete('/push/token', data: {'token': token});
    _registeredToken = null;
  }

  Future<void> _showForegroundNotification(RemoteMessage message) async {
    final notification = message.notification;
    if (notification == null) return;

    await _localNotifications.show(
      id: notification.hashCode,
      title: notification.title ?? 'ŞHG Sosyal',
      body: notification.body ?? '',
      notificationDetails: const NotificationDetails(
        android: AndroidNotificationDetails(
          'shg_social_default',
          'ŞHG Sosyal',
          channelDescription: 'Mesaj, arkadaşlık ve etkinlik bildirimleri',
          importance: Importance.high,
          priority: Priority.high,
        ),
      ),
      payload: message.data['url']?.toString(),
    );
  }
}
