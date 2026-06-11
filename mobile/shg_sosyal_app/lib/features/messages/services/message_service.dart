import '../../../core/network/api_client.dart';
import '../../../core/network/api_mappers.dart';
import '../../../core/constants/app_constants.dart';
import '../../../data/mock/mock_messages.dart';
import '../../../data/models/conversation_model.dart';
import '../../../data/models/message_model.dart';
import '../../../data/models/user_model.dart';

abstract class MessageService {
  Future<List<ConversationModel>> fetchConversations();
  Future<List<MessageModel>> fetchMessages(String conversationId);
  Future<List<MessageModel>> fetchOlderMessages(
      String conversationId, DateTime before);
  Future<ConversationModel> startDirectConversation(UserModel user);
  Future<MessageModel> sendMessage(String conversationId, String content);
  Future<MessageModel> editMessage(
      String messageId, String conversationId, String content);
  Future<void> deleteMessage(String messageId, String conversationId);
  Future<void> markConversationRead(String conversationId);
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
  Future<List<MessageModel>> fetchOlderMessages(
      String conversationId, DateTime before) async {
    await Future<void>.delayed(const Duration(milliseconds: 180));
    return List.generate(3, (index) {
      final createdAt = before.subtract(Duration(minutes: (index + 1) * 8));
      return MessageModel(
        id: 'old-$conversationId-${createdAt.microsecondsSinceEpoch}',
        conversationId: conversationId,
        senderId: index.isEven ? 'u2' : 'u1',
        content: index.isEven
            ? 'Eski mesaj ${index + 1}'
            : 'Önceki yanıt ${index + 1}',
        createdAt: createdAt,
        isMine: index.isOdd,
      );
    }).reversed.toList();
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
  Future<MessageModel> sendMessage(
      String conversationId, String content) async {
    final trimmed = content.trim();
    if (trimmed.isEmpty) {
      throw ArgumentError('Boş mesaj gönderilemez.');
    }
    if (trimmed.length > AppConstants.maxMessageLength) {
      throw ArgumentError(
          'Mesaj ${AppConstants.maxMessageLength} karakteri geçemez.');
    }
    await Future<void>.delayed(const Duration(milliseconds: 120));
    final message = MessageModel(
      id: 'm-${DateTime.now().millisecondsSinceEpoch}',
      conversationId: conversationId,
      senderId: 'u1',
      content: trimmed,
      createdAt: DateTime.now(),
      isMine: true,
    );
    mockMessages
        .putIfAbsent(conversationId, () => <MessageModel>[])
        .add(message);
    final conversationIndex = mockConversations
        .indexWhere((conversation) => conversation.id == conversationId);
    if (conversationIndex != -1) {
      final conversation = mockConversations[conversationIndex];
      mockConversations[conversationIndex] = conversation.copyWith(
        lastMessage: message,
        lastMessageAt: message.createdAt,
        unreadCount: 0,
      );
      final updated = mockConversations.removeAt(conversationIndex);
      mockConversations.insert(0, updated);
    }
    return message;
  }

  @override
  Future<MessageModel> editMessage(
      String messageId, String conversationId, String content) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    final messages = mockMessages[conversationId] ?? <MessageModel>[];
    final index = messages.indexWhere((message) => message.id == messageId);
    if (index == -1) throw StateError('Mesaj bulunamadı.');
    final edited =
        messages[index].copyWith(content: content, editedAt: DateTime.now());
    messages[index] = edited;
    return edited;
  }

  @override
  Future<void> deleteMessage(String messageId, String conversationId) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    final messages = mockMessages[conversationId] ?? <MessageModel>[];
    final index = messages.indexWhere((message) => message.id == messageId);
    if (index == -1) return;
    messages[index] = messages[index].copyWith(
      content: 'Bu mesaj silindi.',
      deletedAt: DateTime.now(),
    );
  }

  @override
  Future<void> markConversationRead(String conversationId) async {
    await Future<void>.delayed(const Duration(milliseconds: 80));
    final index = mockConversations
        .indexWhere((conversation) => conversation.id == conversationId);
    if (index == -1) return;
    final item = mockConversations[index];
    mockConversations[index] = ConversationModel(
      id: item.id,
      otherUser: item.otherUser,
      lastMessage: item.lastMessage,
      lastMessageAt: item.lastMessageAt,
      unreadCount: 0,
    );
  }
}

class ApiMessageService implements MessageService {
  ApiMessageService(this._api);

  final ApiClient _api;
  String? _currentUserId;

  Future<String?> _currentUserIdOrNull() async {
    if (_currentUserId != null) return _currentUserId;
    try {
      final response = await _api.get('/auth/me');
      _currentUserId = apiString(apiData(response.data)['id']);
    } catch (_) {
      _currentUserId = null;
    }
    return _currentUserId;
  }

  @override
  Future<List<ConversationModel>> fetchConversations() async {
    final currentUserId = await _currentUserIdOrNull();
    final response = await _api.get('/messages/conversations');
    return apiList(response.data)
        .map((json) => conversationFromJson(json, currentUserId: currentUserId))
        .toList();
  }

  @override
  Future<List<MessageModel>> fetchMessages(String conversationId) async {
    final currentUserId = await _currentUserIdOrNull();
    final response = await _api.get('/messages/conversations/$conversationId');
    return apiList(response.data)
        .map((json) => messageFromJson(json, currentUserId: currentUserId))
        .toList();
  }

  @override
  Future<List<MessageModel>> fetchOlderMessages(
      String conversationId, DateTime before) async {
    final currentUserId = await _currentUserIdOrNull();
    final response = await _api.get(
      '/messages/conversations/$conversationId',
      queryParameters: {'before': before.toIso8601String()},
    );
    return apiList(response.data)
        .map((json) => messageFromJson(json, currentUserId: currentUserId))
        .toList();
  }

  @override
  Future<ConversationModel> startDirectConversation(UserModel user) async {
    final currentUserId = await _currentUserIdOrNull();
    final response =
        await _api.post('/messages/direct', data: {'user_id': user.id});
    return conversationFromJson(apiData(response.data),
        currentUserId: currentUserId);
  }

  @override
  Future<MessageModel> sendMessage(
      String conversationId, String content) async {
    final trimmed = content.trim();
    if (trimmed.isEmpty) {
      throw ArgumentError('Boş mesaj gönderilemez.');
    }
    if (trimmed.length > AppConstants.maxMessageLength) {
      throw ArgumentError(
          'Mesaj ${AppConstants.maxMessageLength} karakteri geçemez.');
    }
    final currentUserId = await _currentUserIdOrNull();
    final response = await _api.post(
      '/messages/conversations/$conversationId/messages',
      data: {'content': trimmed},
    );
    return messageFromJson(apiData(response.data),
        currentUserId: currentUserId);
  }

  @override
  Future<MessageModel> editMessage(
      String messageId, String conversationId, String content) async {
    final currentUserId = await _currentUserIdOrNull();
    final response = await _api.put(
      '/messages/conversations/$conversationId/messages/$messageId',
      data: {'content': content},
    );
    return messageFromJson(apiData(response.data),
        currentUserId: currentUserId);
  }

  @override
  Future<void> deleteMessage(String messageId, String conversationId) {
    return _api
        .delete('/messages/conversations/$conversationId/messages/$messageId');
  }

  @override
  Future<void> markConversationRead(String conversationId) {
    return _api.post('/messages/conversations/$conversationId/read');
  }
}
