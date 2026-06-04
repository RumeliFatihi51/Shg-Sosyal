import '../models/friendship_model.dart';
import 'mock_users.dart';

final mockFriendships = <FriendshipModel>[
  FriendshipModel(
    id: 'fr1',
    user: mockUsers[1],
    status: FriendshipStatus.accepted,
    createdAt: DateTime.now().subtract(const Duration(days: 12)),
  ),
  FriendshipModel(
    id: 'fr2',
    user: mockUsers[2],
    status: FriendshipStatus.accepted,
    createdAt: DateTime.now().subtract(const Duration(days: 8)),
  ),
  FriendshipModel(
    id: 'fr3',
    user: mockUsers[3],
    status: FriendshipStatus.pending,
    createdAt: DateTime.now().subtract(const Duration(hours: 3)),
  ),
];
