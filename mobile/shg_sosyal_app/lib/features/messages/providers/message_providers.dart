import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/storage/local_storage.dart';
import '../../../data/models/conversation_model.dart';
import '../../../data/models/message_model.dart';
import '../../../data/models/user_model.dart';
import '../repositories/message_repository.dart';
import '../services/message_service.dart';

final messageServiceProvider = Provider<MessageService>((ref) {
  const useApi = bool.fromEnvironment('SHG_USE_API', defaultValue: true);
  if (useApi) return ApiMessageService(ApiClient());
  return MockMessageService();
});
final messageRepositoryProvider = Provider<MessageRepository>(
  (ref) => MessageRepository(ref.watch(messageServiceProvider)),
);

final conversationsProvider = FutureProvider<List<ConversationModel>>((ref) {
  return ref.watch(messageRepositoryProvider).getConversations();
});

final conversationSearchProvider = StateProvider<String>((ref) => '');

final filteredConversationsProvider =
    Provider<AsyncValue<List<ConversationModel>>>((ref) {
  final conversations = ref.watch(conversationsProvider);
  final query = ref.watch(conversationSearchProvider).trim().toLowerCase();
  return conversations.whenData((items) {
    if (query.isEmpty) return items;
    return items.where((item) {
      final name = item.otherUser.fullName.toLowerCase();
      final username = item.otherUser.username.toLowerCase();
      final last = item.lastMessage.content.toLowerCase();
      return name.contains(query) ||
          username.contains(query) ||
          last.contains(query);
    }).toList();
  });
});

final startConversationControllerProvider =
    StateNotifierProvider<StartConversationController, AsyncValue<void>>(
  (ref) =>
      StartConversationController(ref.watch(messageRepositoryProvider), ref),
);

class StartConversationController extends StateNotifier<AsyncValue<void>> {
  StartConversationController(this._repository, this._ref)
      : super(const AsyncValue.data(null));

  final MessageRepository _repository;
  final Ref _ref;

  Future<ConversationModel?> start(UserModel user) async {
    state = const AsyncValue.loading();
    try {
      final conversation = await _repository.startDirectConversation(user);
      _ref.invalidate(conversationsProvider);
      state = const AsyncValue.data(null);
      return conversation;
    } catch (error, stack) {
      state = AsyncValue.error(error, stack);
      return null;
    }
  }
}

final typingIndicatorProvider =
    StateProvider.family<bool, String>((ref, conversationId) => false);

final chatControllerProvider = StateNotifierProvider.family<ChatController,
    AsyncValue<List<MessageModel>>, String>(
  (ref, conversationId) => ChatController(
    ref.watch(messageRepositoryProvider),
    conversationId,
    ref,
  )..load(),
);

class ChatController extends StateNotifier<AsyncValue<List<MessageModel>>> {
  ChatController(this._repository, this._conversationId, this._ref)
      : super(const AsyncValue.loading());

  final MessageRepository _repository;
  final String _conversationId;
  final Ref _ref;
  final LocalStorage _storage = LocalStorage();
  bool _isLoadingOlder = false;

  String get _cacheKey => 'messages_$_conversationId';

  Future<void> load({bool silent = false}) async {
    if (!silent) state = const AsyncValue.loading();
    final previous = state.valueOrNull ?? await _readCachedMessages();
    try {
      final messages = await _repository.getMessages(_conversationId);
      state = AsyncValue.data(messages);
      await _writeCachedMessages(messages);
      await _repository.markConversationRead(_conversationId);
      _ref.invalidate(conversationsProvider);
    } catch (error, stack) {
      if (previous.isNotEmpty) {
        state = AsyncValue.data(previous);
        return;
      }
      state = AsyncValue.error(error, stack);
    }
  }

  Future<void> loadOlder() async {
    if (_isLoadingOlder) return;
    final current = state.value ?? <MessageModel>[];
    if (current.isEmpty) return;
    _isLoadingOlder = true;
    try {
      final older = await _repository.getOlderMessages(
          _conversationId, current.first.createdAt);
      state = AsyncValue.data([...older, ...current]);
      await _writeCachedMessages([...older, ...current]);
    } finally {
      _isLoadingOlder = false;
    }
  }

  Future<void> send(String content) async {
    final trimmed = content.trim();
    if (trimmed.isEmpty) return;
    final current = state.value ?? <MessageModel>[];
    final message = await _repository.sendMessage(_conversationId, trimmed);
    state = AsyncValue.data([...current, message]);
    await _writeCachedMessages([...current, message]);
    _ref.invalidate(conversationsProvider);
  }

  Future<void> editMessage(MessageModel message, String content) async {
    final trimmed = content.trim();
    if (!message.isMine || message.isDeleted || trimmed.isEmpty) return;
    final current = state.value ?? <MessageModel>[];
    final edited =
        await _repository.editMessage(message.id, _conversationId, trimmed);
    state = AsyncValue.data([
      for (final item in current) item.id == edited.id ? edited : item,
    ]);
    await _writeCachedMessages(state.valueOrNull ?? current);
    _ref.invalidate(conversationsProvider);
  }

  Future<void> deleteMessage(MessageModel message) async {
    if (!message.isMine || message.isDeleted) return;
    final current = state.value ?? <MessageModel>[];
    await _repository.deleteMessage(message.id, _conversationId);
    state = AsyncValue.data([
      for (final item in current)
        item.id == message.id
            ? item.copyWith(
                content: 'Bu mesaj silindi.', deletedAt: DateTime.now())
            : item,
    ]);
    await _writeCachedMessages(state.valueOrNull ?? current);
    _ref.invalidate(conversationsProvider);
  }

  Future<List<MessageModel>> _readCachedMessages() async {
    final raw = await _storage.readString(_cacheKey);
    if (raw == null || raw.isEmpty) return const [];
    final decoded = jsonDecode(raw);
    if (decoded is! List) return const [];
    return decoded.whereType<Map<String, dynamic>>().map((json) {
      return MessageModel(
        id: json['id'] as String,
        conversationId: json['conversation_id'] as String,
        senderId: json['sender_id'] as String,
        content: json['content'] as String? ?? '',
        createdAt: DateTime.tryParse(json['created_at'] as String? ?? '') ??
            DateTime.now(),
        editedAt: DateTime.tryParse(json['edited_at'] as String? ?? ''),
        deletedAt: DateTime.tryParse(json['deleted_at'] as String? ?? ''),
        isMine: json['is_mine'] as bool? ?? false,
      );
    }).toList();
  }

  Future<void> _writeCachedMessages(List<MessageModel> messages) async {
    final encoded = jsonEncode([
      for (final message in messages.take(80))
        {
          'id': message.id,
          'conversation_id': message.conversationId,
          'sender_id': message.senderId,
          'content': message.content,
          'created_at': message.createdAt.toIso8601String(),
          'edited_at': message.editedAt?.toIso8601String(),
          'deleted_at': message.deletedAt?.toIso8601String(),
          'is_mine': message.isMine,
        },
    ]);
    await _storage.writeString(_cacheKey, encoded);
  }
}
