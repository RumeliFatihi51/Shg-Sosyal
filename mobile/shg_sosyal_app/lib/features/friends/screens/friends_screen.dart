import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_avatar.dart';
import '../../../core/widgets/app_empty_state.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../data/models/friendship_model.dart';
import '../../../data/models/user_model.dart';
import '../../messages/providers/message_providers.dart';
import '../providers/friend_providers.dart';

class FriendsScreen extends ConsumerWidget {
  const FriendsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final friendships = ref.watch(friendshipsProvider);
    final search = ref.watch(userSearchProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Arkadaşlar')),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
        children: [
          TextField(
            decoration: const InputDecoration(
              hintText: '@etiket veya isim ile kişi ara',
              prefixIcon: Icon(Icons.search),
            ),
            onChanged: (value) => ref.read(friendSearchQueryProvider.notifier).state = value,
          ),
          const SizedBox(height: 14),
          _FriendSummary(friendships: friendships.valueOrNull ?? const []),
          const SizedBox(height: 18),
          _SectionTitle('Arkadaşların'),
          const SizedBox(height: 10),
          friendships.when(
            loading: () => const LoadingView(),
            error: (_, __) => const AppEmptyState(title: 'Arkadaşlar yüklenemedi.', message: 'Tekrar dene.'),
            data: (items) {
              final accepted = items.where((f) => f.status == FriendshipStatus.accepted).toList();
              if (accepted.isEmpty) {
                return const AppEmptyState(
                  title: 'Henüz arkadaş yok.',
                  message: 'Okuldaki kişileri @etiket ile bul.',
                  icon: Icons.person_add_alt,
                );
              }
              return Column(
                children: [
                  for (final item in accepted) ...[
                    _FriendTile(
                      user: item.user,
                      action: 'Mesaj',
                      onAction: () async {
                        final conversation = await ref
                            .read(startConversationControllerProvider.notifier)
                            .start(item.user);
                        if (!context.mounted || conversation == null) return;
                        context.push('/messages/${conversation.id}');
                      },
                    ),
                    const SizedBox(height: 10),
                  ],
                ],
              );
            },
          ),
          const SizedBox(height: 18),
          _SectionTitle('Kişiler'),
          const SizedBox(height: 10),
          search.when(
            loading: () => const LoadingView(),
            error: (_, __) => const AppEmptyState(title: 'Arama yapılamadı.', message: 'Birazdan tekrar dene.'),
            data: (users) => Column(
              children: [
                for (final user in users) ...[
                  _FriendTile(user: user, action: 'Ekle', onAction: () {}),
                  const SizedBox(height: 10),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FriendSummary extends StatelessWidget {
  const _FriendSummary({required this.friendships});

  final List<FriendshipModel> friendships;

  @override
  Widget build(BuildContext context) {
    final accepted = friendships.where((f) => f.status == FriendshipStatus.accepted).length;
    final pending = friendships.where((f) => f.status == FriendshipStatus.pending).length;

    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          _SummaryMetric(value: '$accepted', label: 'arkadaş'),
          _SummaryMetric(value: '$pending', label: 'istek'),
          _SummaryMetric(value: '3', label: 'öneri'),
        ],
      ),
    );
  }
}

class _SummaryMetric extends StatelessWidget {
  const _SummaryMetric({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(value, style: Theme.of(context).textTheme.titleLarge),
          Text(label, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.title);

  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(title, style: Theme.of(context).textTheme.titleMedium);
  }
}

class _FriendTile extends StatelessWidget {
  const _FriendTile({required this.user, required this.action, required this.onAction});

  final UserModel user;
  final String action;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          AppAvatar(name: user.fullName, size: 48),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(user.fullName, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 4),
                Text('${user.username} · ${user.className}', style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          TextButton(onPressed: onAction, child: Text(action)),
        ],
      ),
    );
  }
}
