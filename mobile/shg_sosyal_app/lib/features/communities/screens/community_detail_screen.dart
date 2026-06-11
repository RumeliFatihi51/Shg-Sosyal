import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/auth/role_permissions.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../core/widgets/app_avatar.dart';
import '../../../core/widgets/app_badge.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_empty_state.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../data/models/community_model.dart';
import '../../../data/models/user_model.dart';
import '../../auth/providers/auth_providers.dart';
import '../providers/community_providers.dart';

class CommunityDetailScreen extends ConsumerWidget {
  const CommunityDetailScreen({required this.id, super.key});

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final community = ref.watch(communityDetailProvider(id));
    final user = ref.watch(authControllerProvider).valueOrNull;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Topluluk'),
        actions: [
          IconButton(
              onPressed: () {}, icon: const Icon(Icons.ios_share_outlined)),
        ],
      ),
      body: community.when(
        loading: () => const LoadingView(),
        error: (_, __) => const AppEmptyState(
            title: 'Topluluk açılmadı.', message: 'Tekrar dene.'),
        data: (item) {
          if (item == null) {
            return const AppEmptyState(
              title: 'Topluluk bulunamadı.',
              message: 'Bu topluluk kaldırılmış olabilir.',
            );
          }
          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
            children: [
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(30),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        AppAvatar(name: item.name, size: 72),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(item.name,
                                  style: Theme.of(context)
                                      .textTheme
                                      .headlineMedium),
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: [
                                  AppBadge(label: item.category),
                                  AppBadge(
                                    label: item.isJoined
                                        ? 'Katıldın'
                                        : 'Bugün aktif',
                                    color: item.isJoined
                                        ? AppColors.success
                                        : AppColors.primary,
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(item.description,
                        style: Theme.of(context).textTheme.bodyMedium),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        _Metric(value: '${item.memberCount}', label: 'üye'),
                        _Metric(value: '${item.postCount}', label: 'gönderi'),
                        _Metric(
                            value: DateFormatters.relative(item.lastActivityAt),
                            label: 'aktif'),
                      ],
                    ),
                    const SizedBox(height: 16),
                    AppButton(
                      label: item.isJoined
                          ? 'Topluluktan ayrıl'
                          : 'Topluluğa katıl',
                      icon: item.isJoined
                          ? Icons.check_circle_outline
                          : Icons.add_circle_outline,
                      expand: true,
                      onPressed: () async {
                        try {
                          final controller =
                              ref.read(communityManagementProvider.notifier);
                          if (item.isJoined) {
                            await controller.leave(item.id);
                          } else {
                            await controller.join(item.id);
                          }
                          if (!context.mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                item.isJoined
                                    ? 'Topluluktan ayrıldın.'
                                    : 'Topluluğa katıldın.',
                              ),
                            ),
                          );
                        } catch (error) {
                          if (!context.mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('İşlem tamamlanamadı: $error'),
                            ),
                          );
                        }
                      },
                    ),
                  ],
                ),
              ),
              if (RolePermissions.canManageCommunity(user, item)) ...[
                const SizedBox(height: 14),
                _CommunityAdminPanel(
                  community: item,
                  isGlobalAdmin: RolePermissions.isAdmin(user),
                  onAddMember: (member) async {
                    await ref
                        .read(communityManagementProvider.notifier)
                        .addMember(item.id, member);
                    if (!context.mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                          content:
                              Text('${member.fullName} topluluğa eklendi.')),
                    );
                  },
                  onRemoveMember: (member) async {
                    await ref
                        .read(communityManagementProvider.notifier)
                        .removeMember(item.id, member.id);
                    if (!context.mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                          content: Text(
                              '${member.fullName} topluluktan çıkarıldı.')),
                    );
                  },
                ),
              ],
              const SizedBox(height: 18),
              _Tabs(),
              const SizedBox(height: 14),
              const AppEmptyState(
                title: 'Henüz yeni paylaşım yok.',
                message: 'Topluluk hareketlenmeye hazır.',
                icon: Icons.dynamic_feed_outlined,
              ),
              const SizedBox(height: 14),
              _InfoPanel(
                  title: 'Yakındaki etkinlikler',
                  body: 'Bu topluluğun etkinlikleri burada görünecek.'),
            ],
          );
        },
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.all(11),
        decoration: BoxDecoration(
          color: AppColors.surfaceElevated,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(value, style: Theme.of(context).textTheme.titleMedium),
            Text(label, style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    );
  }
}

class _Tabs extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    const tabs = ['Akış', 'Etkinlikler', 'Üyeler'];
    return Row(
      children: [
        for (final tab in tabs) ...[
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                color: tab == 'Akış'
                    ? AppColors.primary.withValues(alpha: 0.14)
                    : AppColors.surface,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(
                    color:
                        tab == 'Akış' ? AppColors.primary : AppColors.border),
              ),
              child: Text(
                tab,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: tab == 'Akış'
                      ? AppColors.textPrimary
                      : AppColors.textSecondary,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
          if (tab != tabs.last) const SizedBox(width: 8),
        ],
      ],
    );
  }
}

class _InfoPanel extends StatelessWidget {
  const _InfoPanel({required this.title, required this.body});

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          const Icon(Icons.event_outlined, color: AppColors.primary),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 4),
                Text(body, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CommunityAdminPanel extends StatelessWidget {
  const _CommunityAdminPanel({
    required this.community,
    required this.isGlobalAdmin,
    required this.onAddMember,
    required this.onRemoveMember,
  });

  final CommunityModel community;
  final bool isGlobalAdmin;
  final ValueChanged<UserModel> onAddMember;
  final ValueChanged<UserModel> onRemoveMember;

  @override
  Widget build(BuildContext context) {
    void show(String message) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(message)));
    }

    final removableMemberIds = community.memberIds
        .where((memberId) => !community.adminIds.contains(memberId))
        .toList();

    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.28)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.admin_panel_settings_outlined,
                  color: AppColors.primary),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  isGlobalAdmin ? 'Admin yönetimi' : 'Topluluk yönetimi',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
              AppBadge(
                label: isGlobalAdmin ? 'sınırsız' : 'topluluk içi',
                color: isGlobalAdmin ? AppColors.success : AppColors.primary,
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            isGlobalAdmin
                ? '${community.name} üzerinde tüm düzenleme yetkilerin açık.'
                : '${community.name} içinde üye, gönderi ve etkinlik yönetebilirsin.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              OutlinedButton.icon(
                onPressed: () =>
                    _MemberSearchSheet.show(context, community, onAddMember),
                icon: const Icon(Icons.person_add_alt_outlined),
                label: const Text('Üye ekle'),
              ),
              OutlinedButton.icon(
                onPressed: removableMemberIds.isEmpty
                    ? null
                    : () => onRemoveMember(
                          UserModel(
                            id: removableMemberIds.last,
                            fullName: 'Üye',
                            username: '@uye',
                            email: '',
                            className: '',
                            points: 0,
                            role: UserRole.student,
                          ),
                        ),
                icon: const Icon(Icons.person_remove_outlined),
                label: const Text('Üye çıkar'),
              ),
              OutlinedButton.icon(
                onPressed: () =>
                    show('Gönderi yönetimi topluluk API’sine bağlanacak.'),
                icon: const Icon(Icons.dynamic_feed_outlined),
                label: const Text('Gönderiler'),
              ),
              FilledButton.icon(
                onPressed: () => context.push('/events/create'),
                icon: const Icon(Icons.event_outlined),
                label: const Text('Etkinlik oluştur'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text('Üyeler', style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: 8),
          if (community.memberIds.isEmpty)
            Text('Henüz üye yok.', style: Theme.of(context).textTheme.bodySmall)
          else
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final member in community.memberIds.take(6))
                  AppBadge(
                    label: community.adminIds.contains(member)
                        ? '${member.fullName} · admin'
                        : 'Üye',
                    color: community.adminIds.contains(member)
                        ? AppColors.primary
                        : AppColors.surface,
                  ),
              ],
            ),
        ],
      ),
    );
  }
}

class _MemberSearchSheet extends ConsumerWidget {
  const _MemberSearchSheet({
    required this.community,
    required this.onAddMember,
  });

  final CommunityModel community;
  final ValueChanged<UserModel> onAddMember;

  static Future<void> show(
    BuildContext context,
    CommunityModel community,
    ValueChanged<UserModel> onAddMember,
  ) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (_) => _MemberSearchSheet(
        community: community,
        onAddMember: onAddMember,
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final query = ref.watch(communityMemberSearchQueryProvider(community.id));
    final results = ref.watch(communityMemberSearchProvider(community.id));

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          16,
          8,
          16,
          MediaQuery.of(context).viewInsets.bottom + 18,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Üye ekle', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 12),
            TextField(
              autofocus: true,
              decoration: const InputDecoration(
                hintText: '@etiket veya isim ara',
                prefixIcon: Icon(Icons.search),
              ),
              onChanged: (value) => ref
                  .read(
                      communityMemberSearchQueryProvider(community.id).notifier)
                  .state = value,
            ),
            const SizedBox(height: 12),
            if (query.trim().length < 2)
              const AppEmptyState(
                title: 'Kişi ara',
                message: 'Üye eklemek için en az 2 karakter yaz.',
                icon: Icons.person_search_outlined,
              )
            else
              results.when(
                loading: () => const LoadingView(),
                error: (_, __) => const AppEmptyState(
                  title: 'Arama yapılamadı.',
                  message: 'Biraz sonra tekrar dene.',
                  icon: Icons.wifi_off_outlined,
                ),
                data: (users) {
                  final candidates = users
                      .where((user) => !community.memberIds.contains(user.id))
                      .toList();
                  if (candidates.isEmpty) {
                    return const AppEmptyState(
                      title: 'Uygun kişi bulunamadı.',
                      message: 'Bu kişi zaten toplulukta olabilir.',
                      icon: Icons.person_off_outlined,
                    );
                  }
                  return ConstrainedBox(
                    constraints: const BoxConstraints(maxHeight: 360),
                    child: ListView.separated(
                      shrinkWrap: true,
                      itemCount: candidates.length,
                      separatorBuilder: (_, __) => const Divider(height: 1),
                      itemBuilder: (context, index) {
                        final user = candidates[index];
                        return ListTile(
                          leading: AppAvatar(name: user.fullName, size: 40),
                          title: Text(user.fullName),
                          subtitle:
                              Text('${user.username} · ${user.className}'),
                          trailing: FilledButton.tonal(
                            onPressed: () {
                              Navigator.of(context).pop();
                              onAddMember(user);
                            },
                            child: const Text('Ekle'),
                          ),
                        );
                      },
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }
}

extension _CommunityMemberLabel on String {
  String get fullName => 'Üye';
}
