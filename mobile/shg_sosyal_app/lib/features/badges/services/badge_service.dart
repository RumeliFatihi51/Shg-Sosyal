import '../../../data/mock/mock_badges.dart';
import '../../../data/models/badge_model.dart';

abstract class BadgeService {
  Future<List<BadgeModel>> fetchBadges();
}

class MockBadgeService implements BadgeService {
  @override
  Future<List<BadgeModel>> fetchBadges() async {
    await Future<void>.delayed(const Duration(milliseconds: 130));
    return mockBadges;
  }
}
