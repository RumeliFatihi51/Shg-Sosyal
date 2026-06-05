import '../../../core/network/api_client.dart';
import '../../../data/mock/mock_messages.dart';
import '../../../data/models/conversation_model.dart';
import '../../../data/models/message_model.dart';
import '../../../data/models/user_model.dart';

abstract class MessageService {
  Future<List<ConversationModel>> fetchConversations();
  Future<List<MessageModel>> fetchMessages(String conversationId);
  Future<ConversationModel> startDirectConversation(UserModel user);
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
  Future<ConversationModel> startDirectConversation(UserModel user) async {
    await Future<void>.delayed(const Duration(milliseconds: 140));
    for (final conversation in mockConversations) {
      if (conversation.otherUser.id == user.id) return conversation;
    }
    final conversationId = 'conv-${DateTime.now().millisecondsSinceEpoch}';
    final message = MessageModel(
      id: 'm-$conversationId',
      conversationId: conversationId,
      senderId: user.id,
      content: '${user.fullName.split(' ').first} ile sohbet başlatıldı.',
      createdAt: DateTime.now(),
      isMine: false,
    );
    mockMessages[conversationId] = [message];
    final conversation = ConversationModel(
      id: conversationId,
      otherUser: user,
      lastMessage: message,
      lastMessageAt: message.createdAt,
      unreadCount: 0,
    );
    mockConversations.insert(0, conversation);
    return conversation;
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

class ApiMessageService implements MessageService {
  const ApiMessageService(this._api);

  final ApiClient _api;

  @override
  Future<List<ConversationModel>> fetchConversations() async {
    await _api.get('/messages/conversations');
    throw UnimplementedError('ApiMessageService conversation mapping is not connected yet.');
  }

  @override
  Future<List<MessageModel>> fetchMessages(String conversationId) async {
    await _api.get('/messages/conversations/$conversationId');
    throw UnimplementedError('ApiMessageService message mapping is not connected yet.');
  }

  @override
  Future<ConversationModel> startDirectConversation(UserModel user) async {
    await _api.post('/messages/direct', data: {'user_id': user.id});
    throw UnimplementedError('ApiMessageService direct conversation mapping is not connected yet.');
  }

  @override
  Future<MessageModel> sendMessage(String conversationId, String content) async {
    await _api.post(
      '/messages/conversations/$conversationId/messages',
      data: {'content': content},
    );
    throw UnimplementedError('ApiMessageService send mapping is not connected yet.');
  }
}
