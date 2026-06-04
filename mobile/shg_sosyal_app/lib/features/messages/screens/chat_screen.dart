import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../core/widgets/app_empty_state.dart';
import '../../../core/widgets/loading_view.dart';
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

  @override
  void initState() {
    super.initState();
    _controller.addListener(() {
      final next = _controller.text.trim().isNotEmpty;
      if (next != _canSend) setState(() => _canSend = next);
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final messages = ref.watch(chatControllerProvider(widget.id));

    return Scaffold(
      appBar: AppBar(title: const Text('Sohbet')),
      body: Column(
        children: [
          Expanded(
            child: messages.when(
              loading: () => const LoadingView(),
              error: (_, __) => const AppEmptyState(
                title: 'Sohbet açılmadı.',
                message: 'Tekrar dene.',
              ),
              data: (items) => items.isEmpty
                  ? const AppEmptyState(
                      title: 'Henüz mesaj yok.',
                      message: 'İlk mesajı gönder.',
                      icon: Icons.chat_bubble_outline,
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                      itemCount: items.length,
                      itemBuilder: (context, index) {
                        final item = items[index];
                        return Align(
                          alignment: item.isMine ? Alignment.centerRight : Alignment.centerLeft,
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
                                    color: item.isMine ? const Color(0xFF061018) : AppColors.textPrimary,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  DateFormatters.time(item.createdAt),
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
                      decoration: const InputDecoration(
                        hintText: 'Mesaj yaz',
                        counterText: '',
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    onPressed: _canSend
                        ? () {
                            ref.read(chatControllerProvider(widget.id).notifier).send(_controller.text);
                            _controller.clear();
                          }
                        : null,
                    icon: const Icon(Icons.send),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
