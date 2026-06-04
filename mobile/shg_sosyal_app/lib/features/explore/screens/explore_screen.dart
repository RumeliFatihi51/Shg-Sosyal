import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/utils/date_formatters.dart';
import '../../../core/widgets/app_avatar.dart';
import '../../../core/widgets/loading_view.dart';
import '../../../data/models/community_model.dart';
import '../../../data/models/event_model.dart';
import '../../../data/models/feed_item_model.dart';
import '../../communities/providers/community_providers.dart';
import '../../events/providers/event_providers.dart';
import '../../feed/providers/feed_providers.dart';

class ExploreScreen extends ConsumerWidget {
  const ExploreScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final eventsState = ref.watch(eventsProvider);
    final communitiesState = ref.watch(communitiesProvider);
    final feedState = ref.watch(feedItemsProvider);

    final events = eventsState.valueOrNull ?? const <EventModel>[];
    final communities = communitiesState.valueOrNull ?? const <CommunityModel>[];
    final feed = feedState.valueOrNull ?? const <FeedItemModel>[];
    final loading = eventsState.isLoading && communitiesState.isLoading && feedState.isLoading;

    return Scaffold(
      appBar: AppBar(title: const Text('Keşfet')),
      body: loading
          ? const LoadingView()
          : ListView(
              padding: const EdgeInsets.only(bottom: 86),
              children: [
                const Padding(
                  padding: EdgeInsets.fromLTRB(16, 8, 16, 12),
                  child: TextField(
                    decoration: InputDecoration(
                      hintText: 'Etkinlik, topluluk veya konu ara',
                      prefixIcon: Icon(Icons.search),
                    ),
                  ),
                ),
                _TopicRail(feed: feed),
                const Divider(height: 1),
                _SectionHeader(title: 'Yakında', action: 'Tümü', onAction: () => context.push('/events')),
                for (final event in events.take(4)) _EventExploreRow(event: event),
                const Divider(height: 1),
                _SectionHeader(
                  title: 'Aktif topluluklar',
                  action: 'Tümü',
                  onAction: () => context.push('/communities'),
                ),
                for (final community in communities.take(5))
                  _CommunityExploreRow(community: community),
                const Divider(height: 1),
                _SectionHeader(title: 'Konuşulanlar', action: 'Akış', onAction: () => context.push('/home')),
                for (final item in feed.take(5)) _FeedExploreRow(item: item),
              ],
            ),
    );
  }
}

class _TopicRail extends StatelessWidget {
  const _TopicRail({required this.feed});

  final List<FeedItemModel> feed;

  @override
  Widget build(BuildContext context) {
    final topics = <String>[
      '#Robotik',
      '#Tiyatro',
      '#Basketbol',
      '#YapayZeka',
      '#OkulGündemi',
    ];

    return SizedBox(
      height: 44,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
        scrollDirection: Axis.horizontal,
        itemCount: topics.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          return Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: index == 0 ? AppColors.primary : AppColors.border),
            ),
            child: Text(topics[index], style: Theme.of(context).textTheme.bodySmall),
          );
        },
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, required this.action, required this.onAction});

  final String title;
  final String action;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Row(
        children: [
          Expanded(child: Text(title, style: Theme.of(context).textTheme.titleLarge)),
          TextButton(onPressed: onAction, child: Text(action)),
        ],
      ),
    );
  }
}

class _EventExploreRow extends StatelessWidget {
  const _EventExploreRow({required this.event});

  final EventModel event;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => context.push('/events/${event.id}'),
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
        decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: AppColors.border)),
        ),
        child: Row(
          children: [
            SizedBox(
              width: 42,
              child: Column(
                children: [
                  Text('${event.startsAt.day}', style: Theme.of(context).textTheme.titleMedium),
                  Text(DateFormatters.dayMonth(event.startsAt).split(' ').last, style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(event.title, style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 3),
                  Text(
                    '${DateFormatters.time(event.startsAt)} · ${event.location}',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  Text('${event.participantCount} kişi katılıyor', style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: AppColors.textMuted),
          ],
        ),
      ),
    );
  }
}

class _CommunityExploreRow extends StatelessWidget {
  const _CommunityExploreRow({required this.community});

  final CommunityModel community;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => context.push('/communities/${community.id}'),
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
        decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: AppColors.border)),
        ),
        child: Row(
          children: [
            AppAvatar(name: community.name, size: 42),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(community.name, style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 3),
                  Text(
                    '${community.memberCount} üye · ${community.postCount} gönderi',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ),
            TextButton(onPressed: () => context.push('/communities/${community.id}'), child: const Text('Aç')),
          ],
        ),
      ),
    );
  }
}

class _FeedExploreRow extends StatelessWidget {
  const _FeedExploreRow({required this.item});

  final FeedItemModel item;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AppAvatar(name: item.author.fullName, size: 38),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.title ?? item.author.fullName, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 3),
                Text(
                  item.content,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
