import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/auth/role_permissions.dart';
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
          IconButton(
              onPressed: () => context.push('/explore'),
              icon: const Icon(Icons.search)),
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
        onRefresh: () => ref.read(feedControllerProvider.notifier).load(),
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
                  onAction: () =>
                      ref.read(feedControllerProvider.notifier).load(),
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
    final communities =
        ref.read(communitiesProvider).valueOrNull ?? const <CommunityModel>[];
    final availableCommunities = communities
        .where(
            (community) => RolePermissions.canPostInCommunity(user, community))
        .toList();
    final controller = TextEditingController();
    CommunityModel? selected =
        availableCommunities.isNotEmpty ? availableCommunities.first : null;
    var isSubmitting = false;
    XFile? pickedImage;
    String? errorText;

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      showDragHandle: true,
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (context, setState) {
            final bottom = MediaQuery.of(context).viewInsets.bottom;
            Future<void> pickImage() async {
              final image = await ImagePicker().pickImage(
                source: ImageSource.gallery,
                maxWidth: 1600,
                imageQuality: 82,
              );
              if (image == null) return;
              final size = await image.length();
              if (size > 3 * 1024 * 1024) {
                setState(() => errorText = 'Görsel en fazla 3MB olabilir.');
                return;
              }
              setState(() {
                pickedImage = image;
                errorText = null;
              });
            }

            Future<void> submit() async {
              final currentUser = user;
              final community = selected;
              final content = controller.text.trim();
              if (currentUser == null) {
                setState(() => errorText = 'Paylaşmak için giriş yapmalısın.');
                return;
              }
              if (community == null) {
                setState(() => errorText = 'Paylaşım için bir topluluk seç.');
                return;
              }
              if (content.length < 3) {
                setState(() => errorText = 'En az 3 karakter yaz.');
                return;
              }
              if (content.length > 280) {
                setState(() => errorText = 'Gönderi 280 karakteri geçemez.');
                return;
              }

              setState(() {
                isSubmitting = true;
                errorText = null;
              });
              try {
                final bytes = await pickedImage?.readAsBytes();
                await ref.read(feedControllerProvider.notifier).addPost(
                      author: currentUser,
                      community: community,
                      content: content,
                      imageBytes: bytes,
                      imageMimeType: pickedImage?.mimeType,
                    );
                if (!context.mounted) return;
                Navigator.of(sheetContext).pop();
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      RolePermissions.bypassesContentApproval(currentUser)
                          ? '${community.name} içinde direkt yayınlandı.'
                          : '${community.name} içinde paylaşıldı.',
                    ),
                  ),
                );
              } catch (error) {
                if (!context.mounted) return;
                setState(() {
                  isSubmitting = false;
                  errorText = 'Paylaşım gönderilemedi: $error';
                });
              }
            }

            Future<void> submitPoll() async {
              final currentUser = user;
              final community = selected;
              final content = controller.text.trim();
              if (currentUser == null) {
                setState(() => errorText = 'Anket için giriş yapmalısın.');
                return;
              }
              if (community == null) {
                setState(() => errorText = 'Anket için bir topluluk seç.');
                return;
              }
              if (content.length < 6) {
                setState(
                    () => errorText = 'Anket sorusu en az 6 karakter olmalı.');
                return;
              }
              setState(() {
                isSubmitting = true;
                errorText = null;
              });
              try {
                await ref.read(feedControllerProvider.notifier).addPoll(
                  author: currentUser,
                  community: community,
                  question: content,
                  options: const ['Evet', 'Hayır', 'Kararsızım'],
                );
                if (!context.mounted) return;
                Navigator.of(sheetContext).pop();
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      RolePermissions.pollNeedsApproval(currentUser)
                          ? 'Anket onaya gönderildi.'
                          : 'Anket direkt yayınlandı.',
                    ),
                  ),
                );
              } catch (error) {
                if (!context.mounted) return;
                setState(() {
                  isSubmitting = false;
                  errorText = 'Anket oluşturulamadı: $error';
                });
              }
            }

            return Padding(
              padding: EdgeInsets.fromLTRB(16, 8, 16, bottom + 16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Gönderi paylaş',
                      style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 12),
                  if (availableCommunities.isEmpty)
                    const AppEmptyState(
                      title: 'Paylaşım yapabileceğin topluluk yok.',
                      message: 'Önce bir topluluğa katıl veya topluluk kur.',
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
                        for (final community in availableCommunities)
                          DropdownMenuItem(
                            value: community,
                            child: Text(
                              '${community.name}${community.adminIds.contains(user?.id) ? ' · yönetici' : ''}',
                            ),
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
                      onChanged: (_) {
                        if (errorText != null) setState(() => errorText = null);
                      },
                      decoration: const InputDecoration(
                        hintText: 'Okulda ne paylaşmak istiyorsun?',
                        alignLabelWithHint: true,
                      ),
                    ),
                    if (pickedImage != null) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 10),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceElevated,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.image_outlined,
                                color: AppColors.primary),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                pickedImage!.name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            IconButton(
                              onPressed: () =>
                                  setState(() => pickedImage = null),
                              icon: const Icon(Icons.close),
                            ),
                          ],
                        ),
                      ),
                    ],
                    if (errorText != null) ...[
                      const SizedBox(height: 8),
                      Text(errorText!,
                          style: const TextStyle(color: AppColors.danger)),
                    ],
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        IconButton.outlined(
                          tooltip: 'Görsel ekle',
                          onPressed: isSubmitting ? null : pickImage,
                          icon: const Icon(Icons.image_outlined),
                        ),
                        OutlinedButton.icon(
                          onPressed: isSubmitting
                              ? null
                              : () {
                                  Navigator.of(sheetContext).pop();
                                  context.push('/events/create');
                                },
                          icon: const Icon(Icons.event_outlined),
                          label: const Text('Etkinlik öner'),
                        ),
                        OutlinedButton.icon(
                          onPressed: isSubmitting ? null : submitPoll,
                          icon: const Icon(Icons.poll_outlined),
                          label: const Text('Anket'),
                        ),
                        FilledButton(
                          onPressed: isSubmitting ? null : submit,
                          child:
                              Text(isSubmitting ? 'Paylaşılıyor...' : 'Paylaş'),
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
