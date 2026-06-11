import 'message_model.dart';
import 'user_model.dart';

class ConversationModel {
  const ConversationModel({
    required this.id,
    required this.otherUser,
    required this.lastMessage,
    required this.lastMessageAt,
    required this.unreadCount,
  });

  final String id;
  final UserModel otherUser;
  final MessageModel lastMessage;
  final DateTime lastMessageAt;
  final int unreadCount;

  ConversationModel copyWith({
    String? id,
    UserModel? otherUser,
    MessageModel? lastMessage,
    DateTime? lastMessageAt,
    int? unreadCount,
  }) {
    return ConversationModel(
      id: id ?? this.id,
      otherUser: otherUser ?? this.otherUser,
      lastMessage: lastMessage ?? this.lastMessage,
      lastMessageAt: lastMessageAt ?? this.lastMessageAt,
      unreadCount: unreadCount ?? this.unreadCount,
    );
  }
}
