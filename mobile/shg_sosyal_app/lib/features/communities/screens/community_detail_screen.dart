import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/date_formatters.dart';
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
      appBar: AppBar(
        title: const Text('Topluluk'),
        actions: [
          IconButton(onPressed: () {}, icon: const Icon(Icons.ios_share_outlined)),
        ],
      ),
      body: community.when(
        loading: () => const LoadingView(),
        error: (_, __) => const AppEmptyState(title: 'Topluluk açılmadı.', message: 'Tekrar dene.'),
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
                              Text(item.name, style: Theme.of(context).textTheme.headlineMedium),
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: [
                                  AppBadge(label: item.category),
                                  AppBadge(
                                    label: item.isJoined ? 'Katıldın' : 'Bugün aktif',
                                    color: item.isJoined ? AppColors.success : AppColors.primary,
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(item.description, style: Theme.of(context).textTheme.bodyMedium),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        _Metric(value: '${item.memberCount}', label: 'üye'),
                        _Metric(value: '${item.postCount}', label: 'gönderi'),
                        _Metric(value: DateFormatters.relative(item.lastActivityAt), label: 'aktif'),
                      ],
                    ),
                    const SizedBox(height: 16),
                    AppButton(
                      label: item.isJoined ? 'Topluluktan ayrıl' : 'Topluluğa katıl',
                      icon: item.isJoined ? Icons.check_circle_outline : Icons.add_circle_outline,
                      expand: true,
                      onPressed: () {},
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              _Tabs(),
              const SizedBox(height: 14),
              const AppEmptyState(
                title: 'Henüz yeni paylaşım yok.',
                message: 'Topluluk hareketlenmeye hazır.',
                icon: Icons.dynamic_feed_outlined,
              ),
              const SizedBox(height: 14),
              _InfoPanel(title: 'Yakındaki etkinlikler', body: 'Bu topluluğun etkinlikleri burada görünecek.'),
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
                color: tab == 'Akış' ? AppColors.primary.withValues(alpha: 0.14) : AppColors.surface,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: tab == 'Akış' ? AppColors.primary : AppColors.border),
              ),
              child: Text(
                tab,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: tab == 'Akış' ? AppColors.textPrimary : AppColors.textSecondary,
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
