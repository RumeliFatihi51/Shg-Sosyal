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
}
