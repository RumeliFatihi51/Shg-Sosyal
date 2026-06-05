import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../data/models/conversation_model.dart';
import '../../../data/models/message_model.dart';
import '../../../data/models/user_model.dart';
import '../repositories/message_repository.dart';
import '../services/message_service.dart';

final messageServiceProvider = Provider<MessageService>((ref) {
  const useApi = bool.fromEnvironment('SHG_USE_API');
  if (useApi) return ApiMessageService(ApiClient());
  return MockMessageService();
});
final messageRepositoryProvider = Provider<MessageRepository>(
  (ref) => MessageRepository(ref.watch(messageServiceProvider)),
);

final conversationsProvider = FutureProvider<List<ConversationModel>>((ref) {
  return ref.watch(messageRepositoryProvider).getConversations();
});

final startConversationControllerProvider =
    StateNotifierProvider<StartConversationController, AsyncValue<void>>(
  (ref) => StartConversationController(ref.watch(messageRepositoryProvider), ref),
);

class StartConversationController extends StateNotifier<AsyncValue<void>> {
  StartConversationController(this._repository, this._ref) : super(const AsyncValue.data(null));

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

final chatControllerProvider =
    StateNotifierProvider.family<ChatController, AsyncValue<List<MessageModel>>, String>(
  (ref, conversationId) => ChatController(
    ref.watch(messageRepositoryProvider),
    conversationId,
  )..load(),
);

class ChatController extends StateNotifier<AsyncValue<List<MessageModel>>> {
  ChatController(this._repository, this._conversationId)
      : super(const AsyncValue.loading());

  final MessageRepository _repository;
  final String _conversationId;

  Future<void> load() async {
    state = AsyncValue.data(await _repository.getMessages(_conversationId));
  }

  Future<void> send(String content) async {
    final trimmed = content.trim();
    if (trimmed.isEmpty) return;
    final current = state.value ?? <MessageModel>[];
    final message = await _repository.sendMessage(_conversationId, trimmed);
    state = AsyncValue.data([...current, message]);
  }
}
