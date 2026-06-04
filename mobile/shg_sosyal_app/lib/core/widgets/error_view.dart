import 'package:flutter/material.dart';

import 'app_empty_state.dart';

class ErrorView extends StatelessWidget {
  const ErrorView({
    required this.message,
    this.onRetry,
    super.key,
  });

  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return AppEmptyState(
      icon: Icons.refresh,
      title: 'Bir şey ters gitti.',
      message: message,
      actionLabel: onRetry == null ? null : 'Tekrar dene',
      onAction: onRetry,
    );
  }
}
