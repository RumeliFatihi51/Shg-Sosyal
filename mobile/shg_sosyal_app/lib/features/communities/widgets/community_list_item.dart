import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../core/widgets/app_avatar.dart';
import '../../../core/widgets/app_badge.dart';
import '../../../data/models/community_model.dart';

class CommunityListItem extends StatelessWidget {
  const CommunityListItem({required this.community, super.key});

  final CommunityModel community;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => context.push('/communities/${community.id}'),
      borderRadius: BorderRadius.circular(24),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            AppAvatar(name: community.name, size: 54),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          community.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                      ),
                      AppBadge(
                        label: community.isJoined ? 'Katıldın' : 'Aktif',
                        color: community.isJoined ? AppColors.success : AppColors.primary,
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    community.description,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: [
                      _Metric('${community.memberCount}', 'üye'),
                      _Metric('${community.postCount}', 'gönderi'),
                      _Metric(DateFormatters.relative(community.lastActivityAt), 'aktif'),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric(this.value, this.label);

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppColors.border),
      ),
      child: Text(
        '$value $label',
        style: Theme.of(context).textTheme.bodySmall,
      ),
    );
  }
}
