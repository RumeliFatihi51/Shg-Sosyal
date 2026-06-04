import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
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
        error: (_, __) => const AppEmptyState(
          title: 'Mesajlar yüklenemedi.',
          message: 'Birazdan tekrar dene.',
        ),
        data: (items) => ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
          children: [
            const TextField(
              decoration: InputDecoration(
                hintText: 'Kişi veya mesaj ara',
                prefixIcon: Icon(Icons.search),
              ),
            ),
            const SizedBox(height: 14),
            if (items.isEmpty)
              const AppEmptyState(
                title: 'Henüz mesaj yok.',
                message: 'Arkadaşlarınla sohbet başlat.',
                icon: Icons.chat_bubble_outline,
              )
            else
              for (final item in items) ...[
                InkWell(
                  borderRadius: BorderRadius.circular(22),
                  onTap: () => context.push('/messages/${item.id}'),
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      children: [
                        AppAvatar(name: item.otherUser.fullName, size: 50),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      item.otherUser.fullName,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: Theme.of(context).textTheme.titleMedium,
                                    ),
                                  ),
                                  Text(
                                    DateFormatters.relative(item.lastMessageAt),
                                    style: Theme.of(context).textTheme.bodySmall,
                                  ),
                                ],
                              ),
                              const SizedBox(height: 5),
                              Text(
                                item.lastMessage.content,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                            ],
                          ),
                        ),
                        if (item.unreadCount > 0) ...[
                          const SizedBox(width: 10),
                          Badge(label: Text('${item.unreadCount}')),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 10),
              ],
          ],
        ),
      ),
    );
  }
}
