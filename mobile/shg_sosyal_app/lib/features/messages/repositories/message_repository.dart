import '../../../data/models/conversation_model.dart';
import '../../../data/models/message_model.dart';
import '../services/message_service.dart';

class MessageRepository {
  const MessageRepository(this._service);

  final MessageService _service;

  Future<List<ConversationModel>> getConversations() => _service.fetchConversations();
  Future<List<MessageModel>> getMessages(String conversationId) {
    return _service.fetchMessages(conversationId);
  }

  Future<MessageModel> sendMessage(String conversationId, String content) {
    return _service.sendMessage(conversationId, content);
  }
}
