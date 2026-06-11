import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../core/widgets/app_empty_state.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../data/models/message_model.dart';
import '../providers/message_providers.dart';

class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({required this.id, super.key});

  final String id;

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _controller = TextEditingController();
  bool _canSend = false;
  bool _isSending = false;
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    _controller.addListener(() {
      final next = _controller.text.trim().isNotEmpty;
      if (next != _canSend) setState(() => _canSend = next);
      ref.read(typingIndicatorProvider(widget.id).notifier).state = next;
    });
    _refreshTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (!mounted) return;
      ref.read(chatControllerProvider(widget.id).notifier).load(silent: true);
    });
  }

  @override
  void dispose() {
    ref.read(typingIndicatorProvider(widget.id).notifier).state = false;
    _refreshTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final messages = ref.watch(chatControllerProvider(widget.id));
    final isTyping = ref.watch(typingIndicatorProvider(widget.id));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Sohbet'),
        actions: [
          IconButton(
            tooltip: 'Yenile',
            onPressed: () =>
                ref.read(chatControllerProvider(widget.id).notifier).load(),
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: messages.when(
              loading: () => const LoadingView(),
              error: (error, __) => AppEmptyState(
                title: 'Sohbet açılmadı.',
                message: apiErrorMessage(error, 'Tekrar dene.'),
                actionLabel: 'Yenile',
                onAction: () =>
                    ref.read(chatControllerProvider(widget.id).notifier).load(),
              ),
              data: (items) => items.isEmpty
                  ? const AppEmptyState(
                      title: 'Henüz mesaj yok.',
                      message: 'İlk mesajı gönder.',
                      icon: Icons.chat_bubble_outline,
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                      itemCount: items.length + 2,
                      itemBuilder: (context, index) {
                        if (index == 0) {
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: Center(
                              child: TextButton.icon(
                                onPressed: () => ref
                                    .read(
                                      chatControllerProvider(widget.id)
                                          .notifier,
                                    )
                                    .loadOlder(),
                                icon: const Icon(Icons.keyboard_arrow_up),
                                label: const Text('Daha eski mesajlar'),
                              ),
                            ),
                          );
                        }
                        if (index == items.length + 1) {
                          return _TypingHint(isTyping: isTyping);
                        }
                        final item = items[index - 1];
                        return _MessageBubble(
                          item: item,
                          onLongPress: item.isMine && !item.isDeleted
                              ? () => _openMessageActions(context, item)
                              : null,
                        );
                      },
                    ),
            ),
          ),
          SafeArea(
            top: false,
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: const BoxDecoration(
                color: AppColors.surface,
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      maxLength: AppConstants.maxMessageLength,
                      minLines: 1,
                      maxLines: 4,
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _send(),
                      decoration: const InputDecoration(
                        hintText: 'Mesaj yaz',
                        counterText: '',
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    onPressed: _canSend && !_isSending ? _send : null,
                    icon: _isSending
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.send),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _send() async {
    final content = _controller.text.trim();
    if (content.isEmpty || _isSending) return;
    setState(() => _isSending = true);
    try {
      await ref.read(chatControllerProvider(widget.id).notifier).send(content);
      _controller.clear();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(apiErrorMessage(error, 'Mesaj gönderilemedi.'))),
      );
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  void _openMessageActions(BuildContext context, MessageModel message) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.surface,
      showDragHandle: true,
      builder: (sheetContext) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.edit_outlined),
                title: const Text('Düzenle'),
                onTap: () {
                  Navigator.of(sheetContext).pop();
                  _openEditDialog(context, message);
                },
              ),
              ListTile(
                leading:
                    const Icon(Icons.delete_outline, color: AppColors.danger),
                title: const Text('Sil'),
                onTap: () {
                  Navigator.of(sheetContext).pop();
                  ref
                      .read(chatControllerProvider(widget.id).notifier)
                      .deleteMessage(message);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  void _openEditDialog(BuildContext context, MessageModel message) {
    final controller = TextEditingController(text: message.content);
    showDialog<void>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Mesajı düzenle'),
          content: TextField(
            controller: controller,
            autofocus: true,
            maxLength: AppConstants.maxMessageLength,
            minLines: 2,
            maxLines: 5,
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('Vazgeç'),
            ),
            FilledButton(
              onPressed: () {
                ref
                    .read(chatControllerProvider(widget.id).notifier)
                    .editMessage(message, controller.text);
                Navigator.of(dialogContext).pop();
              },
              child: const Text('Kaydet'),
            ),
          ],
        );
      },
    ).whenComplete(controller.dispose);
  }
}

class _TypingHint extends StatelessWidget {
  const _TypingHint({required this.isTyping});

  final bool isTyping;

  @override
  Widget build(BuildContext context) {
    if (!isTyping) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(left: 6, bottom: 8),
      child: Text(
        'Yazıyorsun...',
        style: Theme.of(context)
            .textTheme
            .bodySmall
            ?.copyWith(color: AppColors.textMuted),
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({
    required this.item,
    required this.onLongPress,
  });

  final MessageModel item;
  final VoidCallback? onLongPress;

  @override
  Widget build(BuildContext context) {
    final isDeleted = item.isDeleted;
    return Align(
      alignment: item.isMine ? Alignment.centerRight : Alignment.centerLeft,
      child: GestureDetector(
        onLongPress: onLongPress,
        child: Container(
          constraints: const BoxConstraints(maxWidth: 292),
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: item.isMine ? AppColors.primary : AppColors.surfaceElevated,
            borderRadius: BorderRadius.only(
              topLeft: const Radius.circular(18),
              topRight: const Radius.circular(18),
              bottomLeft: Radius.circular(item.isMine ? 18 : 4),
              bottomRight: Radius.circular(item.isMine ? 4 : 18),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                item.content,
                style: TextStyle(
                  color: item.isMine
                      ? const Color(0xFF061018)
                      : AppColors.textPrimary,
                  fontStyle: isDeleted ? FontStyle.italic : FontStyle.normal,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '${DateFormatters.time(item.createdAt)}${item.editedAt != null ? ' · düzenlendi' : ''}',
                style: TextStyle(
                  color: item.isMine
                      ? const Color(0xFF061018).withValues(alpha: 0.72)
                      : AppColors.textMuted,
                  fontSize: 11,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
