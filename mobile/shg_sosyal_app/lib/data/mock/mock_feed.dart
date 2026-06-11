import '../models/feed_item_model.dart';
import 'mock_badges.dart';
import 'mock_communities.dart';
import 'mock_events.dart';
import 'mock_users.dart';

final mockFeedItems = <FeedItemModel>[
  FeedItemModel(
    id: 'f1',
    type: FeedItemType.event,
    author: mockUsers[3],
    title: 'Robotik Mini Demo bugün 15:00’te.',
    content: 'Bilişim Laboratuvarı’nda küçük demo masası kuruluyor.',
    createdAt: DateTime.now().subtract(const Duration(minutes: 12)),
    event: mockEvents[0],
    likeCount: 14,
    commentCount: 3,
  ),
  FeedItemModel(
    id: 'f2',
    type: FeedItemType.announcement,
    author: mockUsers[2],
    title: 'Sahne ve Tiyatro bugün aktif.',
    content: 'Doğaçlama Sahnesi için son prova öğle arasında yapılacak.',
    createdAt: DateTime.now().subtract(const Duration(minutes: 40)),
    community: mockCommunities[1],
    likeCount: 8,
    commentCount: 2,
  ),
  FeedItemModel(
    id: 'f3',
    type: FeedItemType.poll,
    author: mockUsers[1],
    title: 'Öğle arasında hangi etkinlik daha iyi?',
    content: 'Bugünkü kısa ara için fikir seçiyoruz.',
    createdAt: DateTime.now().subtract(const Duration(hours: 1)),
    pollOptions: const [
      PollOptionModel(id: 'p1', label: 'Müzik buluşması', voteCount: 18),
      PollOptionModel(id: 'p2', label: 'Satranç maçı', voteCount: 11),
      PollOptionModel(id: 'p3', label: 'Bahçe yürüyüşü', voteCount: 7),
    ],
    likeCount: 5,
    commentCount: 6,
  ),
  FeedItemModel(
    id: 'f4',
    type: FeedItemType.post,
    author: mockUsers[4],
    title: 'Fizik Laboratuvarı için gönüllü lazım.',
    content:
        'Deney masalarını kurmak için son derste 2 kişi yardım edebilir mi?',
    createdAt: DateTime.now().subtract(const Duration(hours: 2)),
    likeCount: 19,
    commentCount: 5,
  ),
  FeedItemModel(
    id: 'f5',
    type: FeedItemType.badge,
    author: mockUsers[0],
    title: 'İlk Katılım rozeti kazanıldı.',
    content: 'Robotik Mini Demo’ya katılımın kaydedildi.',
    createdAt: DateTime.now().subtract(const Duration(hours: 3)),
    badge: mockBadges[1],
    likeCount: 7,
  ),
  FeedItemModel(
    id: 'f6',
    type: FeedItemType.friendActivity,
    author: mockUsers[1],
    title: 'Ali ve Zeynep basketbol turnuvasına katılıyor.',
    content: '3x3 Basketbol Turnuvası yarın okul bahçesinde.',
    createdAt: DateTime.now().subtract(const Duration(hours: 4)),
    event: mockEvents[1],
    likeCount: 10,
    commentCount: 1,
  ),
];
