import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/utils/date_formatters.dart';
import '../../../core/widgets/app_avatar.dart';
import '../../../core/widgets/app_empty_state.dart';
import '../../../core/widgets/loading_view.dart';
import '../providers/message_providers.dart';

class ConversationsScreen extends ConsumerWidget {
  const ConversationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final conversations = ref.watch(conversationsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Mesajlar')),
      body: conversations.when(
        loading: () => const LoadingView(),
        error: (_, __) => const AppEmptyState(title: 'Mesajlar yüklenemedi.', message: 'Birazdan tekrar dene.'),
        data: (items) => items.isEmpty
            ? const AppEmptyState(title: 'Henüz mesaj yok.', message: 'İlk mesajı gönder.')
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: items.length,
                separatorBuilder: (_, __) => const Divider(height: 18),
                itemBuilder: (context, index) {
                  final item = items[index];
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: AppAvatar(name: item.otherUser.fullName),
                    title: Text(item.otherUser.fullName),
                    subtitle: Text(item.lastMessage.content, maxLines: 1, overflow: TextOverflow.ellipsis),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(DateFormatters.relative(item.lastMessageAt)),
                        if (item.unreadCount > 0)
                          Badge(label: Text('${item.unreadCount}')),
                      ],
                    ),
                    onTap: () => context.push('/messages/${item.id}'),
                  );
                },
              ),
      ),
    );
  }
}
