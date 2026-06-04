import '../../../data/mock/mock_messages.dart';
import '../../../data/models/conversation_model.dart';
import '../../../data/models/message_model.dart';

abstract class MessageService {
  Future<List<ConversationModel>> fetchConversations();
  Future<List<MessageModel>> fetchMessages(String conversationId);
  Future<MessageModel> sendMessage(String conversationId, String content);
}

class MockMessageService implements MessageService {
  @override
  Future<List<ConversationModel>> fetchConversations() async {
    await Future<void>.delayed(const Duration(milliseconds: 160));
    return mockConversations;
  }

  @override
  Future<List<MessageModel>> fetchMessages(String conversationId) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    return [...mockMessages[conversationId] ?? <MessageModel>[]];
  }

  @override
  Future<MessageModel> sendMessage(String conversationId, String content) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    final message = MessageModel(
      id: 'm-${DateTime.now().millisecondsSinceEpoch}',
      conversationId: conversationId,
      senderId: 'u1',
      content: content,
      createdAt: DateTime.now(),
      isMine: true,
    );
    mockMessages.putIfAbsent(conversationId, () => <MessageModel>[]).add(message);
    return message;
  }
}
