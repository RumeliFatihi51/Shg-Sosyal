import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_avatar.dart';
import '../../../core/widgets/app_empty_state.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../data/models/community_model.dart';
import '../../auth/providers/auth_providers.dart';
import '../../communities/providers/community_providers.dart';
import '../providers/feed_providers.dart';
import '../widgets/feed_item_card.dart';

class FeedScreen extends ConsumerWidget {
  const FeedScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feed = ref.watch(feedItemsProvider);
    final user = ref.watch(authControllerProvider).valueOrNull;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Ana Akış'),
        actions: [
          IconButton(onPressed: () => context.push('/explore'), icon: const Icon(Icons.search)),
          IconButton(
            onPressed: () => context.push('/notifications'),
            icon: const Icon(Icons.notifications_none),
          ),
          IconButton(
            tooltip: 'Profil',
            onPressed: () => context.push('/profile/me'),
            icon: const Icon(Icons.person_outline),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(feedItemsProvider.future),
        child: ListView(
          padding: const EdgeInsets.only(bottom: 86),
          children: [
            _Composer(
              userName: user?.fullName ?? 'ŞHG',
              onPost: () => _openComposeSheet(context, ref),
            ),
            feed.when(
              loading: () => const Padding(
                padding: EdgeInsets.all(16),
                child: LoadingView(),
              ),
              error: (error, stack) => Padding(
                padding: const EdgeInsets.all(16),
                child: AppEmptyState(
                  title: 'Akış yüklenemedi.',
                  message: 'Tekrar dene.',
                  actionLabel: 'Yenile',
                  onAction: () => ref.invalidate(feedItemsProvider),
                ),
              ),
              data: (items) => items.isEmpty
                  ? Padding(
                      padding: const EdgeInsets.all(16),
                      child: AppEmptyState(
                        title: 'Bugün henüz sakin.',
                        message: 'İlk gönderiyi sen paylaş.',
                        actionLabel: 'Gönderi paylaş',
                        onAction: () => _openComposeSheet(context, ref),
                      ),
                    )
                  : Column(
                      children: [
                        for (final item in items) FeedItemCard(item: item),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }

  void _openComposeSheet(BuildContext context, WidgetRef ref) {
    final user = ref.read(authControllerProvider).valueOrNull;
    final communities = ref.read(communitiesProvider).valueOrNull ?? const <CommunityModel>[];
    final joined = communities.where((community) => community.isJoined).toList();
    final controller = TextEditingController();
    CommunityModel? selected = joined.isNotEmpty ? joined.first : null;

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      showDragHandle: true,
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (context, setState) {
            final bottom = MediaQuery.of(context).viewInsets.bottom;
            return Padding(
              padding: EdgeInsets.fromLTRB(16, 8, 16, bottom + 16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Gönderi paylaş', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 12),
                  if (joined.isEmpty)
                    const AppEmptyState(
                      title: 'Önce bir topluluğa katıl.',
                      message: 'Paylaşımlar topluluk içinde görünür.',
                      icon: Icons.groups_2_outlined,
                    )
                  else ...[
                    DropdownButtonFormField<CommunityModel>(
                      initialValue: selected,
                      decoration: const InputDecoration(
                        labelText: 'Topluluk',
                        prefixIcon: Icon(Icons.groups_2_outlined),
                      ),
                      items: [
                        for (final community in joined)
                          DropdownMenuItem(
                            value: community,
                            child: Text(community.name),
                          ),
                      ],
                      onChanged: (value) => setState(() => selected = value),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: controller,
                      autofocus: true,
                      minLines: 4,
                      maxLines: 8,
                      maxLength: 280,
                      decoration: const InputDecoration(
                        hintText: 'Okulda ne paylaşmak istiyorsun?',
                        alignLabelWithHint: true,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () => context.push('/events/create'),
                            icon: const Icon(Icons.event_outlined),
                            label: const Text('Etkinlik öner'),
                          ),
                        ),
                        const SizedBox(width: 10),
                        FilledButton(
                          onPressed: () {
                            final currentUser = user;
                            final community = selected;
                            if (currentUser == null || community == null) return;
                            ref.read(localFeedPostsProvider.notifier).addPost(
                                  author: currentUser,
                                  community: community,
                                  content: controller.text,
                                );
                            Navigator.of(sheetContext).pop();
                          },
                          child: const Text('Paylaş'),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            );
          },
        );
      },
    ).whenComplete(controller.dispose);
  }
}

class _Composer extends StatelessWidget {
  const _Composer({
    required this.userName,
    required this.onPost,
  });

  final String userName;
  final VoidCallback onPost;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onPost,
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
        decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: AppColors.border)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AppAvatar(name: userName, size: 40),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'Okulda ne paylaşmak istiyorsun?',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
            ),
            FilledButton(
              onPressed: onPost,
              style: FilledButton.styleFrom(
                minimumSize: const Size(78, 36),
                padding: const EdgeInsets.symmetric(horizontal: 14),
              ),
              child: const Text('Paylaş'),
            ),
          ],
        ),
      ),
    );
  }
}
