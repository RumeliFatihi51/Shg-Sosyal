import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/app_avatar.dart';
import '../../../core/widgets/app_empty_state.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../data/models/friendship_model.dart';
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
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            decoration: const InputDecoration(
              hintText: '@etiket veya isim ile kişi ara',
              prefixIcon: Icon(Icons.search),
            ),
            onChanged: (value) => ref.read(friendSearchQueryProvider.notifier).state = value,
          ),
          const SizedBox(height: 18),
          Text('Arkadaşların', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 10),
          friendships.when(
            loading: () => const LoadingView(),
            error: (_, __) => const AppEmptyState(title: 'Arkadaşlar yüklenemedi.', message: 'Tekrar dene.'),
            data: (items) => Column(
              children: [
                for (final item in items.where((f) => f.status == FriendshipStatus.accepted)) ...[
                  _FriendTile(name: item.user.fullName, meta: '${item.user.username} · ${item.user.className}', action: 'Mesaj at'),
                  const Divider(),
                ],
              ],
            ),
          ),
          const SizedBox(height: 18),
          Text('Kişiler', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 10),
          search.when(
            loading: () => const LoadingView(),
            error: (_, __) => const AppEmptyState(title: 'Arama yapılamadı.', message: 'Birazdan tekrar dene.'),
            data: (users) => Column(
              children: [
                for (final user in users) ...[
                  _FriendTile(name: user.fullName, meta: '${user.username} · ${user.className}', action: 'Arkadaş ekle'),
                  const Divider(),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FriendTile extends StatelessWidget {
  const _FriendTile({required this.name, required this.meta, required this.action});

  final String name;
  final String meta;
  final String action;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: AppAvatar(name: name),
      title: Text(name),
      subtitle: Text(meta),
      trailing: TextButton(onPressed: () {}, child: Text(action)),
    );
  }
}
