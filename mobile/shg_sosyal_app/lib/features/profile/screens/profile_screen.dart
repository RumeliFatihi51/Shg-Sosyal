import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/app_avatar.dart';
import '../../../core/widgets/app_badge.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_empty_state.dart';
import '../../../core/widgets/loading_view.dart';
import '../providers/profile_providers.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(profileProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profil'),
        actions: [
          IconButton(onPressed: () => context.push('/settings'), icon: const Icon(Icons.settings_outlined)),
        ],
      ),
      body: profile.when(
        loading: () => const LoadingView(),
        error: (_, __) => const AppEmptyState(title: 'Profil yüklenemedi.', message: 'Tekrar dene.'),
        data: (summary) => ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Row(
              children: [
                AppAvatar(name: summary.user.fullName, size: 72),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(summary.user.fullName, style: Theme.of(context).textTheme.headlineMedium),
                      const SizedBox(height: 4),
                      Text('${summary.user.username} · ${summary.user.className}'),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(summary.user.bio ?? 'Bugün henüz sakin.', style: Theme.of(context).textTheme.bodyMedium),
            const SizedBox(height: 18),
            Row(
              children: [
                _Metric(label: 'Puan', value: '${summary.user.points}'),
                _Metric(label: 'Etkinlik', value: '${summary.events.length}'),
                _Metric(label: 'Topluluk', value: '${summary.communities.length}'),
              ],
            ),
            const SizedBox(height: 18),
            AppButton(label: 'Profili düzenle', outlined: true, onPressed: () => context.push('/profile/edit')),
            const SizedBox(height: 24),
            Text('Rozetler', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final badge in summary.badges.take(4))
                  AppBadge(label: badge.name, icon: Icons.workspace_premium_outlined),
              ],
            ),
            const SizedBox(height: 20),
            AppButton(label: 'Tüm rozetleri gör', onPressed: () => context.push('/badges')),
            const SizedBox(height: 10),
            AppButton(label: 'Sıralamaya bak', outlined: true, onPressed: () => context.push('/leaderboard')),
          ],
        ),
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric({required this.label, required this.value});

  final String label;
  final String value;

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
