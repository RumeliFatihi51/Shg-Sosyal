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
    final tab = ref.watch(friendTabProvider);
    final friendships = ref.watch(friendshipsProvider(tab));
    final search = ref.watch(userSearchProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Arkadaşlar')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(friendshipsProvider(tab));
          ref.invalidate(userSearchProvider);
        },
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
          children: [
            TextField(
              decoration: const InputDecoration(
                hintText: '@etiket veya isim ile kişi ara',
                prefixIcon: Icon(Icons.search),
              ),
              onChanged: (value) =>
                  ref.read(friendSearchQueryProvider.notifier).state = value,
            ),
            const SizedBox(height: 12),
            _Tabs(current: tab),
            const SizedBox(height: 16),
            _SearchSection(search: search),
            const SizedBox(height: 18),
            _SectionTitle(_titleFor(tab)),
            const SizedBox(height: 10),
            friendships.when(
              loading: () => const LoadingView(),
              error: (_, __) => const AppEmptyState(
                title: 'Arkadaşlar yüklenemedi.',
                message: 'Tekrar dene.',
              ),
              data: (items) {
                if (items.isEmpty) {
                  return AppEmptyState(
                    title: _emptyTitle(tab),
                    message: _emptyMessage(tab),
                    icon: Icons.person_add_alt,
                  );
                }
                return Column(
                  children: [
                    for (final item in items) ...[
                      _FriendshipTile(friendship: item, tab: tab),
                      const SizedBox(height: 10),
                    ],
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  String _titleFor(String tab) {
    return switch (tab) {
      'incoming' => 'Gelen istekler',
      'outgoing' => 'Gönderilen istekler',
      _ => 'Arkadaşların',
    };
  }

  String _emptyTitle(String tab) {
    return switch (tab) {
      'incoming' => 'Yeni istek yok.',
      'outgoing' => 'Gönderilen istek yok.',
      _ => 'Henüz arkadaş yok.',
    };
  }

  String _emptyMessage(String tab) {
    return switch (tab) {
      'incoming' => 'Biri istek gönderdiğinde burada görünecek.',
      'outgoing' => 'Aramadan kişi bulup istek gönderebilirsin.',
      _ => 'Okuldaki kişileri @etiket ile bul.',
    };
  }
}

class _Tabs extends ConsumerWidget {
  const _Tabs({required this.current});

  final String current;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    const tabs = {
      'accepted': 'Arkadaşlar',
      'incoming': 'Gelen',
      'outgoing': 'Gönderilen',
    };

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          for (final entry in tabs.entries) ...[
            ChoiceChip(
              label: Text(entry.value),
              selected: current == entry.key,
              onSelected: (_) =>
                  ref.read(friendTabProvider.notifier).state = entry.key,
            ),
            const SizedBox(width: 8),
          ],
        ],
      ),
    );
  }
}

class _SearchSection extends StatelessWidget {
  const _SearchSection({required this.search});

  final AsyncValue<List<UserModel>> search;

  @override
  Widget build(BuildContext context) {
    return search.when(
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
      data: (users) {
        if (users.isEmpty) return const SizedBox.shrink();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const _SectionTitle('Kişiler'),
            const SizedBox(height: 10),
            for (final user in users.take(8)) ...[
              _UserTile(user: user),
              const SizedBox(height: 10),
            ],
          ],
        );
      },
    );
  }
}

class _FriendshipTile extends ConsumerWidget {
  const _FriendshipTile({required this.friendship, required this.tab});

  final FriendshipModel friendship;
  final String tab;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return _PersonShell(
      user: friendship.user,
      trailing: switch (tab) {
        'incoming' => Wrap(
            spacing: 6,
            children: [
              TextButton(
                onPressed: () => _run(
                    context,
                    ref,
                    () => ref
                        .read(friendActionControllerProvider.notifier)
                        .reject(friendship.id),
                    'İstek reddedildi.'),
                child: const Text('Reddet'),
              ),
              FilledButton(
                onPressed: () => _run(
                    context,
                    ref,
                    () => ref
                        .read(friendActionControllerProvider.notifier)
                        .accept(friendship.id),
                    'Arkadaş oldunuz.'),
                child: const Text('Kabul et'),
              ),
            ],
          ),
        'outgoing' => TextButton(
            onPressed: () => _run(
                context,
                ref,
                () => ref
                    .read(friendActionControllerProvider.notifier)
                    .cancel(friendship.id),
                'İstek iptal edildi.'),
            child: const Text('İptal'),
          ),
        _ => Wrap(
            spacing: 6,
            children: [
              TextButton(
                onPressed: () => _run(
                    context,
                    ref,
                    () => ref
                        .read(friendActionControllerProvider.notifier)
                        .remove(friendship.id),
                    'Arkadaşlıktan çıkarıldı.'),
                child: const Text('Kaldır'),
              ),
              FilledButton(
                onPressed: () async {
                  final conversation = await ref
                      .read(startConversationControllerProvider.notifier)
                      .start(friendship.user);
                  if (!context.mounted) return;
                  if (conversation == null) {
                    final error = ref
                        .read(startConversationControllerProvider)
                        .error
                        ?.toString();
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(error ??
                            'Mesajlaşma başlatılamadı. Biraz sonra tekrar dene.'),
                      ),
                    );
                    return;
                  }
                  context.push('/messages/${conversation.id}');
                },
                child: const Text('Mesaj'),
              ),
            ],
          ),
      },
    );
  }
}

class _UserTile extends ConsumerWidget {
  const _UserTile({required this.user});

  final UserModel user;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return _PersonShell(
      user: user,
      trailing: FilledButton.tonal(
        onPressed: () => _run(
          context,
          ref,
          () => ref
              .read(friendActionControllerProvider.notifier)
              .sendRequest(user),
          'Arkadaşlık isteği gönderildi.',
        ),
        child: const Text('Ekle'),
      ),
    );
  }
}

class _PersonShell extends StatelessWidget {
  const _PersonShell({required this.user, required this.trailing});

  final UserModel user;
  final Widget trailing;

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
                Text(user.fullName,
                    style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 4),
                Text('${user.username} · ${user.className}',
                    style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          trailing,
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

Future<void> _run(
  BuildContext context,
  WidgetRef ref,
  Future<void> Function() action,
  String successMessage,
) async {
  try {
    await action();
    if (!context.mounted) return;
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(successMessage)));
  } catch (error) {
    if (!context.mounted) return;
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text('İşlem tamamlanamadı: $error')));
  }
}
