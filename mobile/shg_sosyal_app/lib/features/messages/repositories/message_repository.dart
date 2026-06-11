import '../../../data/models/conversation_model.dart';
import '../../../data/models/message_model.dart';
import '../../../data/models/user_model.dart';
import '../services/message_service.dart';

class MessageRepository {
  const MessageRepository(this._service);

  final MessageService _service;

  Future<List<ConversationModel>> getConversations() =>
      _service.fetchConversations();
  Future<List<MessageModel>> getMessages(String conversationId) {
    return _service.fetchMessages(conversationId);
  }

  Future<List<MessageModel>> getOlderMessages(
    String conversationId,
    DateTime before,
  ) {
    return _service.fetchOlderMessages(conversationId, before);
  }

  Future<ConversationModel> startDirectConversation(UserModel user) {
    return _service.startDirectConversation(user);
  }

  Future<MessageModel> sendMessage(String conversationId, String content) {
    return _service.sendMessage(conversationId, content);
  }

  Future<MessageModel> editMessage(
    String messageId,
    String conversationId,
    String content,
  ) {
    return _service.editMessage(messageId, conversationId, content);
  }

  Future<void> deleteMessage(String messageId, String conversationId) {
    return _service.deleteMessage(messageId, conversationId);
  }

  Future<void> markConversationRead(String conversationId) {
    return _service.markConversationRead(conversationId);
  }
}
