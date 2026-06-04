import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/app_avatar.dart';
import '../../../core/widgets/app_badge.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_empty_state.dart';
import '../../../core/widgets/loading_view.dart';
import '../providers/community_providers.dart';

class CommunityDetailScreen extends ConsumerWidget {
  const CommunityDetailScreen({required this.id, super.key});

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final community = ref.watch(communityDetailProvider(id));

    return Scaffold(
      appBar: AppBar(title: const Text('Topluluk')),
      body: community.when(
        loading: () => const LoadingView(),
        error: (_, __) => const AppEmptyState(title: 'Topluluk açılmadı.', message: 'Tekrar dene.'),
        data: (item) {
          if (item == null) {
            return const AppEmptyState(title: 'Topluluk bulunamadı.', message: 'Bu topluluk kaldırılmış olabilir.');
          }
          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Row(
                children: [
                  AppAvatar(name: item.name, size: 64),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(item.name, style: Theme.of(context).textTheme.headlineMedium),
                        const SizedBox(height: 6),
                        AppBadge(label: item.category),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              Text(item.description),
              const SizedBox(height: 18),
              Text('${item.memberCount} üye · ${item.postCount} gönderi'),
              const SizedBox(height: 18),
              AppButton(label: item.isJoined ? 'Ayrıl' : 'Katıl', onPressed: () {}),
              const SizedBox(height: 24),
              Text('Gönderiler', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 10),
              const AppEmptyState(
                title: 'Henüz yeni paylaşım yok.',
                message: 'Topluluk hareketlenmeye hazır.',
              ),
            ],
          );
        },
      ),
    );
  }
}
