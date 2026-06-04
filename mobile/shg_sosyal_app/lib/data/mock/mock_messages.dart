import '../models/conversation_model.dart';
import '../models/message_model.dart';
import 'mock_users.dart';

final mockMessages = <String, List<MessageModel>>{
  'conv1': [
    MessageModel(
      id: 'm1',
      conversationId: 'conv1',
      senderId: 'u2',
      content: 'Basketbol turnuvasına takım kuruyor muyuz?',
      createdAt: DateTime.now().subtract(const Duration(minutes: 25)),
      isMine: false,
    ),
    MessageModel(
      id: 'm2',
      conversationId: 'conv1',
      senderId: 'u1',
      content: 'Evet, 3 kişi olduk. Bir kişi daha lazım.',
      createdAt: DateTime.now().subtract(const Duration(minutes: 18)),
      isMine: true,
    ),
  ],
  'conv2': [
    MessageModel(
      id: 'm3',
      conversationId: 'conv2',
      senderId: 'u3',
      content: 'Doğaçlama sahnesi için prova bugün mü?',
      createdAt: DateTime.now().subtract(const Duration(hours: 2)),
      isMine: false,
    ),
  ],
};

final mockConversations = <ConversationModel>[
  ConversationModel(
    id: 'conv1',
    otherUser: mockUsers[1],
    lastMessage: mockMessages['conv1']!.last,
    lastMessageAt: mockMessages['conv1']!.last.createdAt,
    unreadCount: 1,
  ),
  ConversationModel(
    id: 'conv2',
    otherUser: mockUsers[2],
    lastMessage: mockMessages['conv2']!.last,
    lastMessageAt: mockMessages['conv2']!.last.createdAt,
    unreadCount: 0,
  ),
];
