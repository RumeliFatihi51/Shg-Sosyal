import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../core/widgets/app_avatar.dart';
import '../../../core/widgets/app_empty_state.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../data/models/conversation_model.dart';
import '../providers/message_providers.dart';

class ConversationsScreen extends ConsumerWidget {
  const ConversationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final conversations = ref.watch(filteredConversationsProvider);
    final query = ref.watch(conversationSearchProvider);

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
            TextField(
              onChanged: (value) =>
                  ref.read(conversationSearchProvider.notifier).state = value,
              decoration: const InputDecoration(
                hintText: 'Kişi veya mesaj ara',
                prefixIcon: Icon(Icons.search),
              ),
            ),
            const SizedBox(height: 14),
            if (items.isEmpty)
              AppEmptyState(
                title: query.trim().isEmpty
                    ? 'Henüz mesaj yok.'
                    : 'Sonuç bulunamadı.',
                message: query.trim().isEmpty
                    ? 'Arkadaşlarınla sohbet başlat.'
                    : 'Başka bir isim veya mesaj dene.',
                icon: Icons.chat_bubble_outline,
              )
            else
              for (final item in items) _ConversationTile(item: item),
          ],
        ),
      ),
    );
  }
}

class _ConversationTile extends ConsumerWidget {
  const _ConversationTile({required this.item});

  final ConversationModel item;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isUnread = item.unreadCount > 0;

    return InkWell(
      borderRadius: BorderRadius.circular(18),
      onTap: () {
        ref.read(messageRepositoryProvider).markConversationRead(item.id);
        ref.invalidate(conversationsProvider);
        context.push('/messages/${item.id}');
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: AppColors.border)),
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
                          style:
                              Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: isUnread
                                        ? FontWeight.w800
                                        : FontWeight.w600,
                                  ),
                        ),
                      ),
                      Text(
                        DateFormatters.relative(item.lastMessageAt),
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: isUnread
                                  ? AppColors.primary
                                  : AppColors.textMuted,
                            ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          item.lastMessage.content,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: isUnread
                                        ? AppColors.textPrimary
                                        : AppColors.textSecondary,
                                    fontWeight: isUnread
                                        ? FontWeight.w600
                                        : FontWeight.w400,
                                  ),
                        ),
                      ),
                      if (isUnread) ...[
                        const SizedBox(width: 10),
                        Badge(label: Text('${item.unreadCount}')),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
