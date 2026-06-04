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
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
        decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: AppColors.border)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AppAvatar(name: community.name, size: 50),
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
                  const SizedBox(height: 8),
                  Text(
                    '${community.memberCount} üye · ${community.postCount} gönderi · ${DateFormatters.relative(community.lastActivityAt)}',
                    style: Theme.of(context).textTheme.bodySmall,
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
