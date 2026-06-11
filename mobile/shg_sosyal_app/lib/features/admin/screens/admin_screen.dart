import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/auth/role_permissions.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_badge.dart';
import '../../../core/widgets/app_empty_state.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../data/models/user_model.dart';
import '../../auth/providers/auth_providers.dart';
import '../providers/admin_providers.dart';

class AdminScreen extends ConsumerWidget {
  const AdminScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).valueOrNull;
    final adminState = ref.watch(adminControllerProvider);
    if (!RolePermissions.canAccessAdmin(user)) {
      return const Scaffold(
        body: AppEmptyState(
          title: 'Bu alan sadece adminlere açık.',
          message: 'İçerik onayları ve rol işlemleri admin yetkisi ister.',
          icon: Icons.lock_outline,
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Admin')),
      body: adminState.when(
        loading: () => const LoadingView(),
        error: (_, __) => AppEmptyState(
          title: 'Admin verisi yüklenemedi.',
          message: 'Tekrar dene.',
          actionLabel: 'Yenile',
          onAction: () => ref.read(adminControllerProvider.notifier).load(),
        ),
        data: (state) => RefreshIndicator(
          onRefresh: () => ref.read(adminControllerProvider.notifier).load(),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
            children: [
              Container(
                padding: const EdgeInsets.all(15),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.admin_panel_settings_outlined,
                        color: AppColors.primary),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Onay, düzenleme ve rol yönetimi hazır.',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ),
                    const AppBadge(label: 'Admin', color: AppColors.success),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              _ApprovalSection(title: 'Etkinlik onaylari', items: state.events),
              _ApprovalSection(title: 'Anket onaylari', items: state.polls),
              _ApprovalSection(
                  title: 'Topluluk basvurulari', items: state.communities),
              const _AdminUserFilters(),
              _RoleSection(users: state.users),
            ],
          ),
        ),
      ),
    );
  }
}

class _AdminUserFilters extends ConsumerWidget {
  const _AdminUserFilters();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final role = ref.watch(adminRoleFilterProvider);
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            decoration: const InputDecoration(
              hintText: 'Kullanici ara',
              prefixIcon: Icon(Icons.search),
            ),
            onChanged: (value) {
              ref.read(adminPageProvider.notifier).state = 1;
              ref.read(adminUserSearchProvider.notifier).state = value;
            },
          ),
          const SizedBox(height: 10),
          DropdownButtonFormField<UserRole?>(
            initialValue: role,
            decoration: const InputDecoration(labelText: 'Rol filtresi'),
            items: [
              const DropdownMenuItem<UserRole?>(
                value: null,
                child: Text('Tüm roller'),
              ),
              for (final item in UserRole.values)
                DropdownMenuItem<UserRole?>(
                  value: item,
                  child: Text(RolePermissions.label(item)),
                ),
            ],
            onChanged: (value) {
              ref.read(adminPageProvider.notifier).state = 1;
              ref.read(adminRoleFilterProvider.notifier).state = value;
            },
          ),
        ],
      ),
    );
  }
}

class _ApprovalSection extends ConsumerWidget {
  const _ApprovalSection({
    required this.title,
    required this.items,
  });

  final String title;
  final List<AdminApprovalItem> items;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          if (items.isEmpty)
            Text('Bekleyen kayit yok.',
                style: Theme.of(context).textTheme.bodySmall)
          else
            for (final item in items)
              _ApprovalItem(
                item: item,
                onApprove: () async {
                  await ref
                      .read(adminControllerProvider.notifier)
                      .approve(item);
                  if (!context.mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('${item.title} onaylandi.')),
                  );
                },
                onReject: () async {
                  final reason = await _askRejectReason(context, item);
                  if (reason == null) return;
                  await ref
                      .read(adminControllerProvider.notifier)
                      .reject(item, reason: reason);
                  if (!context.mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('${item.title} reddedildi.')),
                  );
                },
              ),
        ],
      ),
    );
  }

  Future<String?> _askRejectReason(
      BuildContext context, AdminApprovalItem item) {
    final controller = TextEditingController();
    return showDialog<String>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: Text('${item.title} reddedilsin mi?'),
          content: TextField(
            controller: controller,
            autofocus: true,
            minLines: 2,
            maxLines: 4,
            decoration: const InputDecoration(
              labelText: 'Red sebebi',
              hintText: 'Kisa ve net bir sebep yaz',
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('Vazgeç'),
            ),
            FilledButton(
              onPressed: () {
                final text = controller.text.trim();
                Navigator.of(dialogContext)
                    .pop(text.isEmpty ? 'Sebep belirtilmedi.' : text);
              },
              child: const Text('Reddet'),
            ),
          ],
        );
      },
    ).whenComplete(controller.dispose);
  }
}

class _ApprovalItem extends StatelessWidget {
  const _ApprovalItem({
    required this.item,
    required this.onApprove,
    required this.onReject,
  });

  final AdminApprovalItem item;
  final VoidCallback onApprove;
  final VoidCallback onReject;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.title,
                    style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 3),
                Text(item.subtitle,
                    style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          IconButton(
            tooltip: 'Reddet',
            onPressed: onReject,
            icon: const Icon(Icons.close, color: AppColors.danger),
          ),
          IconButton.filled(
            tooltip: 'Onayla',
            onPressed: onApprove,
            icon: const Icon(Icons.check),
          ),
        ],
      ),
    );
  }
}

class _RoleSection extends ConsumerWidget {
  const _RoleSection({required this.users});

  final List<UserModel> users;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(adminControllerProvider).valueOrNull;
    final currentPage = state?.page ?? 1;
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Rol yönetimi', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          if (users.isEmpty)
            Text('Kullanici bulunamadi.',
                style: Theme.of(context).textTheme.bodySmall)
          else
            for (final user in users) _RoleItem(user: user),
          if (state != null) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Sayfa ${state.page} · ${state.totalUsers} kullanıcı',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ),
                IconButton.outlined(
                  tooltip: 'Önceki sayfa',
                  onPressed: currentPage <= 1
                      ? null
                      : () => ref.read(adminPageProvider.notifier).state =
                          currentPage - 1,
                  icon: const Icon(Icons.chevron_left),
                ),
                const SizedBox(width: 6),
                IconButton.outlined(
                  tooltip: 'Sonraki sayfa',
                  onPressed: state.hasMoreUsers
                      ? () => ref.read(adminPageProvider.notifier).state =
                          currentPage + 1
                      : null,
                  icon: const Icon(Icons.chevron_right),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _RoleItem extends ConsumerWidget {
  const _RoleItem({required this.user});

  final UserModel user;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(user.fullName,
                    style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 2),
                Text(user.username,
                    style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          AppBadge(label: RolePermissions.label(user.role)),
          if (user.isSuspended) ...[
            const SizedBox(width: 6),
            const AppBadge(label: 'Askıda', color: AppColors.danger),
          ],
          const SizedBox(width: 8),
          PopupMenuButton<UserRole>(
            tooltip: 'Rol degistir',
            onSelected: (role) async {
              final error = await ref
                  .read(adminControllerProvider.notifier)
                  .changeRole(user, role);
              if (!context.mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                    content:
                        Text(error ?? '${user.fullName} rolü güncellendi.')),
              );
            },
            itemBuilder: (context) => [
              for (final role in UserRole.values)
                PopupMenuItem(
                    value: role, child: Text(RolePermissions.label(role))),
            ],
            child: const Padding(
              padding: EdgeInsets.all(6),
              child: Icon(Icons.more_horiz),
            ),
          ),
          IconButton(
            tooltip: user.isSuspended ? 'Aktif et' : 'Askıya al',
            onPressed: () async {
              final error = await ref
                  .read(adminControllerProvider.notifier)
                  .setSuspension(user, !user.isSuspended);
              if (!context.mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    error ??
                        (user.isSuspended
                            ? '${user.fullName} aktif edildi.'
                            : '${user.fullName} askıya alındı.'),
                  ),
                ),
              );
            },
            icon: Icon(
              user.isSuspended
                  ? Icons.lock_open_outlined
                  : Icons.block_outlined,
            ),
          ),
        ],
      ),
    );
  }
}



