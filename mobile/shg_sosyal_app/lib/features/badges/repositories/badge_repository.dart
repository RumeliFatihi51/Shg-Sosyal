import '../../../data/models/badge_model.dart';
import '../services/badge_service.dart';

class BadgeRepository {
  const BadgeRepository(this._service);

  final BadgeService _service;

  Future<List<BadgeModel>> getBadges() => _service.fetchBadges();
}
