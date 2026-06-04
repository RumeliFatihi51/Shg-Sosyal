import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_colors.dart';
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
              error: (_, __) => const AppEmptyState(title: 'Sohbet açılmadı.', message: 'Tekrar dene.'),
              data: (items) => items.isEmpty
                  ? const AppEmptyState(title: 'Henüz mesaj yok.', message: 'İlk mesajı gönder.')
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: items.length,
                      itemBuilder: (context, index) {
                        final item = items[index];
                        return Align(
                          alignment: item.isMine ? Alignment.centerRight : Alignment.centerLeft,
                          child: Container(
                            constraints: const BoxConstraints(maxWidth: 280),
                            margin: const EdgeInsets.only(bottom: 10),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                            decoration: BoxDecoration(
                              color: item.isMine ? AppColors.primary : AppColors.surfaceElevated,
                              borderRadius: BorderRadius.circular(18),
                            ),
                            child: Text(
                              item.content,
                              style: TextStyle(
                                color: item.isMine ? const Color(0xFF061018) : AppColors.textPrimary,
                              ),
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      maxLength: AppConstants.maxMessageLength,
                      decoration: const InputDecoration(
                        hintText: 'Mesaj yaz',
                        counterText: '',
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    onPressed: () {
                      ref.read(chatControllerProvider(widget.id).notifier).send(_controller.text);
                      _controller.clear();
                    },
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
