import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_providers.dart';
import '../services/push_notification_service.dart';

class PushBootstrap extends ConsumerStatefulWidget {
  const PushBootstrap({required this.child, super.key});

  final Widget child;

  @override
  ConsumerState<PushBootstrap> createState() => _PushBootstrapState();
}

class _PushBootstrapState extends ConsumerState<PushBootstrap> {
  String? _bootstrappedUserId;

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authControllerProvider).valueOrNull;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final userId = user?.id;
      if (userId == null || userId == _bootstrappedUserId) return;
      _bootstrappedUserId = userId;
      ref.read(pushNotificationServiceProvider).bootstrap();
    });

    return widget.child;
  }
}
