import 'dart:typed_data';

import 'badge_model.dart';
import 'community_model.dart';
import 'event_model.dart';
import 'user_model.dart';

enum FeedItemType { post, event, announcement, poll, friendActivity, badge, leaderboard }

class PollOptionModel {
  const PollOptionModel({
    required this.id,
    required this.label,
    required this.voteCount,
  });

  final String id;
  final String label;
  final int voteCount;
}

class FeedItemModel {
  const FeedItemModel({
    required this.id,
    required this.type,
    required this.author,
    required this.content,
    required this.createdAt,
    this.title,
    this.event,
    this.community,
    this.badge,
    this.pollOptions = const [],
    this.likeCount = 0,
    this.commentCount = 0,
    this.isLiked = false,
    this.imageUrl,
    this.localImageBytes,
  });

  final String id;
  final FeedItemType type;
  final UserModel author;
  final String? title;
  final String content;
  final DateTime createdAt;
  final EventModel? event;
  final CommunityModel? community;
  final BadgeModel? badge;
  final List<PollOptionModel> pollOptions;
  final int likeCount;
  final int commentCount;
  final bool isLiked;
  final String? imageUrl;
  final Uint8List? localImageBytes;
}
