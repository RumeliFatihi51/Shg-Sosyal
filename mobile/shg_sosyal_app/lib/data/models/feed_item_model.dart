import 'dart:typed_data';

import 'badge_model.dart';
import 'community_model.dart';
import 'event_model.dart';
import 'user_model.dart';

enum FeedItemType {
  post,
  event,
  announcement,
  poll,
  friendActivity,
  badge,
  leaderboard
}

class FeedCommentModel {
  const FeedCommentModel({
    required this.id,
    required this.author,
    required this.content,
    required this.createdAt,
  });

  final String id;
  final UserModel author;
  final String content;
  final DateTime createdAt;
}

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
    this.comments = const [],
    this.editedAt,
    this.isDeleted = false,
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
  final List<FeedCommentModel> comments;
  final DateTime? editedAt;
  final bool isDeleted;

  int get visibleCommentCount => commentCount + comments.length;

  FeedItemModel copyWith({
    String? id,
    FeedItemType? type,
    UserModel? author,
    String? title,
    String? content,
    DateTime? createdAt,
    EventModel? event,
    CommunityModel? community,
    BadgeModel? badge,
    List<PollOptionModel>? pollOptions,
    int? likeCount,
    int? commentCount,
    bool? isLiked,
    String? imageUrl,
    Uint8List? localImageBytes,
    List<FeedCommentModel>? comments,
    DateTime? editedAt,
    bool? isDeleted,
  }) {
    return FeedItemModel(
      id: id ?? this.id,
      type: type ?? this.type,
      author: author ?? this.author,
      title: title ?? this.title,
      content: content ?? this.content,
      createdAt: createdAt ?? this.createdAt,
      event: event ?? this.event,
      community: community ?? this.community,
      badge: badge ?? this.badge,
      pollOptions: pollOptions ?? this.pollOptions,
      likeCount: likeCount ?? this.likeCount,
      commentCount: commentCount ?? this.commentCount,
      isLiked: isLiked ?? this.isLiked,
      imageUrl: imageUrl ?? this.imageUrl,
      localImageBytes: localImageBytes ?? this.localImageBytes,
      comments: comments ?? this.comments,
      editedAt: editedAt ?? this.editedAt,
      isDeleted: isDeleted ?? this.isDeleted,
    );
  }
}
