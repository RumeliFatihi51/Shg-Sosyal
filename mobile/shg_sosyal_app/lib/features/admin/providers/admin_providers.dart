import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_mappers.dart';
import '../../../data/mock/mock_communities.dart';
import '../../../data/mock/mock_events.dart';
import '../../../data/mock/mock_feed.dart';
import '../../../data/mock/mock_users.dart';
import '../../../data/models/feed_item_model.dart';
import '../../../data/models/user_model.dart';

enum AdminApprovalType { event, poll, community }

class AdminApprovalItem {
  const AdminApprovalItem({
    required this.id,
    required this.type,
    required this.title,
    required this.subtitle,
  });

  final String id;
  final AdminApprovalType type;
  final String title;
  final String subtitle;
}

class AdminState {
  const AdminState({
    required this.events,
    required this.polls,
    required this.communities,
    required this.users,
    this.page = 1,
    this.totalUsers = 0,
    this.hasMoreUsers = false,
  });

  final List<AdminApprovalItem> events;
  final List<AdminApprovalItem> polls;
  final List<AdminApprovalItem> communities;
  final List<UserModel> users;
  final int page;
  final int totalUsers;
  final bool hasMoreUsers;

  AdminState copyWith({
    List<AdminApprovalItem>? events,
    List<AdminApprovalItem>? polls,
    List<AdminApprovalItem>? communities,
    List<UserModel>? users,
    int? page,
    int? totalUsers,
    bool? hasMoreUsers,
  }) {
    return AdminState(
      events: events ?? this.events,
      polls: polls ?? this.polls,
      communities: communities ?? this.communities,
      users: users ?? this.users,
      page: page ?? this.page,
      totalUsers: totalUsers ?? this.totalUsers,
      hasMoreUsers: hasMoreUsers ?? this.hasMoreUsers,
    );
  }
}

abstract class AdminService {
  Future<AdminState> fetchAdminState({
    String query = '',
    UserRole? role,
    int page = 1,
  });
  Future<void> approve(AdminApprovalItem item);
  Future<void> reject(AdminApprovalItem item, {String? reason});
  Future<UserModel> changeRole(UserModel user, UserRole role);
  Future<UserModel> setSuspension(UserModel user, bool isSuspended);
}

class MockAdminService implements AdminService {
  @override
  Future<AdminState> fetchAdminState({
    String query = '',
    UserRole? role,
    int page = 1,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    final normalized = query.trim().toLowerCase().replaceAll('@', '');
    final users = mockUsers.where((user) {
      final matchesQuery = normalized.isEmpty ||
          user.fullName.toLowerCase().contains(normalized) ||
          user.username.toLowerCase().contains(normalized);
      final matchesRole = role == null || user.role == role;
      return matchesQuery && matchesRole;
    }).toList();
    return AdminState(
      events: [
        for (final event in mockEvents.take(4))
          AdminApprovalItem(
            id: event.id,
            type: AdminApprovalType.event,
            title: event.title,
            subtitle: '${event.organizerName} · ${event.location}',
          ),
      ],
      polls: [
        for (final poll
            in mockFeedItems.where((item) => item.type == FeedItemType.poll))
          AdminApprovalItem(
            id: poll.id,
            type: AdminApprovalType.poll,
            title: poll.title ?? poll.content,
            subtitle: poll.author.fullName,
          ),
      ],
      communities: [
        for (final community
            in mockCommunities.where((item) => !item.isJoined).take(4))
          AdminApprovalItem(
            id: community.id,
            type: AdminApprovalType.community,
            title: community.name,
            subtitle: community.category,
          ),
      ],
      users: users,
      page: page,
      totalUsers: users.length,
      hasMoreUsers: false,
    );
  }

  @override
  Future<void> approve(AdminApprovalItem item) async {
    await Future<void>.delayed(const Duration(milliseconds: 160));
  }

  @override
  Future<void> reject(AdminApprovalItem item, {String? reason}) async {
    await Future<void>.delayed(const Duration(milliseconds: 160));
  }

  @override
  Future<UserModel> changeRole(UserModel user, UserRole role) async {
    await Future<void>.delayed(const Duration(milliseconds: 160));
    final updatedUser = user.copyWith(role: role);
    final userIndex = mockUsers.indexWhere((item) => item.id == user.id);
    if (userIndex != -1) mockUsers[userIndex] = updatedUser;
    return updatedUser;
  }

  @override
  Future<UserModel> setSuspension(UserModel user, bool isSuspended) async {
    await Future<void>.delayed(const Duration(milliseconds: 160));
    final updatedUser = user.copyWith(isSuspended: isSuspended);
    final userIndex = mockUsers.indexWhere((item) => item.id == user.id);
    if (userIndex != -1) mockUsers[userIndex] = updatedUser;
    return updatedUser;
  }
}

class ApiAdminService implements AdminService {
  const ApiAdminService(this._api);

  final ApiClient _api;

  @override
  Future<AdminState> fetchAdminState({
    String query = '',
    UserRole? role,
    int page = 1,
  }) async {
    final response = await _api.get(
      '/admin/overview',
      queryParameters: {
        if (query.trim().isNotEmpty) 'q': query.trim(),
        if (role != null) 'role': _roleToApi(role),
        'page': page,
      },
    );
    final data = apiData(response.data);
    final pagination = apiMap(data['pagination']);
    return AdminState(
      events: _items(data['events'], AdminApprovalType.event),
      polls: _items(data['polls'], AdminApprovalType.poll),
      communities: _items(data['communities'], AdminApprovalType.community),
      users: apiList(data['users']).map(userFromJson).toList(),
      page: apiInt(pagination['page'], page),
      totalUsers: apiInt(pagination['total']),
      hasMoreUsers: apiBool(pagination['has_more']),
    );
  }

  @override
  Future<void> approve(AdminApprovalItem item) {
    return _api.post(
      '/admin/approvals',
      data: {'type': item.type.name, 'id': item.id, 'decision': 'approve'},
    );
  }

  @override
  Future<void> reject(AdminApprovalItem item, {String? reason}) {
    return _api.post(
      '/admin/approvals',
      data: {
        'type': item.type.name,
        'id': item.id,
        'decision': 'reject',
        if (reason != null && reason.trim().isNotEmpty) 'reason': reason.trim(),
      },
    );
  }

  @override
  Future<UserModel> changeRole(UserModel user, UserRole role) async {
    final response = await _api.put(
      '/admin/users/${user.id}/role',
      data: {'role': _roleToApi(role)},
    );
    return userFromJson(apiData(response.data));
  }

  @override
  Future<UserModel> setSuspension(UserModel user, bool isSuspended) async {
    final response = await _api.put(
      '/admin/users/${user.id}/suspension',
      data: {'is_suspended': isSuspended},
    );
    return userFromJson(apiData(response.data));
  }

  List<AdminApprovalItem> _items(Object? value, AdminApprovalType type) {
    return apiList(value)
        .map(
          (json) => AdminApprovalItem(
            id: apiString(json['id']),
            type: type,
            title: apiString(json['title']),
            subtitle: apiString(json['subtitle']),
          ),
        )
        .toList();
  }

  String _roleToApi(UserRole role) {
    return switch (role) {
      UserRole.admin => 'admin',
      UserRole.teacher => 'teacher',
      UserRole.communityAdmin => 'community_admin',
      UserRole.student => 'student',
    };
  }
}

final adminServiceProvider = Provider<AdminService>((ref) {
  const useApi = bool.fromEnvironment('SHG_USE_API', defaultValue: true);
  if (useApi) return ApiAdminService(ApiClient());
  return MockAdminService();
});

final adminUserSearchProvider = StateProvider<String>((ref) => '');
final adminRoleFilterProvider = StateProvider<UserRole?>((ref) => null);
final adminPageProvider = StateProvider<int>((ref) => 1);

final adminControllerProvider =
    StateNotifierProvider<AdminController, AsyncValue<AdminState>>(
  (ref) => AdminController(
    ref.watch(adminServiceProvider),
    query: ref.watch(adminUserSearchProvider),
    role: ref.watch(adminRoleFilterProvider),
    page: ref.watch(adminPageProvider),
  )..load(),
);

class AdminController extends StateNotifier<AsyncValue<AdminState>> {
  AdminController(
    this._service, {
    required this.query,
    required this.role,
    required this.page,
  }) : super(const AsyncValue.loading());

  final AdminService _service;
  final String query;
  final UserRole? role;
  final int page;

  Future<void> load() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () => _service.fetchAdminState(query: query, role: role, page: page),
    );
  }

  Future<void> approve(AdminApprovalItem item) async {
    await _service.approve(item);
    _removeApproval(item);
  }

  Future<void> reject(AdminApprovalItem item, {String? reason}) async {
    await _service.reject(item, reason: reason);
    _removeApproval(item);
  }

  void _removeApproval(AdminApprovalItem item) {
    final current = state.valueOrNull;
    if (current == null) return;
    state = AsyncValue.data(
      switch (item.type) {
        AdminApprovalType.event => current.copyWith(
            events:
                current.events.where((entry) => entry.id != item.id).toList(),
          ),
        AdminApprovalType.poll => current.copyWith(
            polls: current.polls.where((entry) => entry.id != item.id).toList(),
          ),
        AdminApprovalType.community => current.copyWith(
            communities: current.communities
                .where((entry) => entry.id != item.id)
                .toList(),
          ),
      },
    );
  }

  Future<String?> changeRole(UserModel user, UserRole role) async {
    if (user.id == mockCurrentUser.id && role != UserRole.admin) {
      return 'Admin kendi rolünü düşüremez.';
    }
    final current = state.valueOrNull;
    if (current == null) return 'Kullanıcı listesi hazır değil.';
    final updatedUser = await _service.changeRole(user, role);
    state = AsyncValue.data(
      current.copyWith(
        users: [
          for (final item in current.users)
            item.id == user.id ? updatedUser : item,
        ],
      ),
    );
    return null;
  }

  Future<String?> setSuspension(UserModel user, bool isSuspended) async {
    final current = state.valueOrNull;
    if (current == null) return 'Kullanıcı listesi hazır değil.';
    if (user.role == UserRole.admin && isSuspended) {
      return 'Admin kullanıcısı askıya alınamaz.';
    }
    final updatedUser = await _service.setSuspension(user, isSuspended);
    state = AsyncValue.data(
      current.copyWith(
        users: [
          for (final item in current.users)
            item.id == user.id ? updatedUser : item,
        ],
      ),
    );
    return null;
  }
}
