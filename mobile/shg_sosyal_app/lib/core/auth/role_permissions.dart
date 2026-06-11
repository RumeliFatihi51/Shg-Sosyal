import '../../data/models/community_model.dart';
import '../../data/models/user_model.dart';

class RolePermissions {
  const RolePermissions._();

  static bool isAdmin(UserModel? user) => user?.role == UserRole.admin;
  static bool isTeacher(UserModel? user) => user?.role == UserRole.teacher;
  static bool isCommunityAdmin(UserModel? user) =>
      user?.role == UserRole.communityAdmin;

  static bool canAccessAdmin(UserModel? user) => isAdmin(user);
  static bool canApproveContent(UserModel? user) => isAdmin(user);
  static bool canChangeRoles(UserModel? user) => isAdmin(user);

  static bool bypassesContentApproval(UserModel? user) {
    return isAdmin(user) || isTeacher(user);
  }

  static bool eventNeedsApproval(UserModel? user) {
    return !bypassesContentApproval(user);
  }

  static bool pollNeedsApproval(UserModel? user) {
    return !bypassesContentApproval(user);
  }

  static bool communityNeedsApproval(UserModel? user) {
    return !isAdmin(user);
  }

  static bool canPostInCommunity(UserModel? user, CommunityModel community) {
    if (user == null) return false;
    if (isAdmin(user) || isTeacher(user)) return true;
    return community.isJoined || community.adminIds.contains(user.id);
  }

  static bool canManageCommunity(UserModel? user, CommunityModel community) {
    if (user == null) return false;
    return isAdmin(user) || community.adminIds.contains(user.id);
  }

  static bool canManageCommunityMembers(
    UserModel? user,
    CommunityModel community,
  ) {
    return canManageCommunity(user, community);
  }

  static bool canManageCommunityPosts(
    UserModel? user,
    CommunityModel community,
  ) {
    return canManageCommunity(user, community);
  }

  static bool canCreateCommunityEvent(
    UserModel? user,
    CommunityModel community,
  ) {
    return isAdmin(user) ||
        isTeacher(user) ||
        community.adminIds.contains(user?.id);
  }

  static String label(UserRole role) {
    return switch (role) {
      UserRole.admin => 'Admin',
      UserRole.communityAdmin => 'Topluluk admini',
      UserRole.teacher => 'Öğretmen',
      UserRole.student => 'Öğrenci',
    };
  }

  static String shortPolicyText(UserModel? user) {
    if (isAdmin(user)) {
      return 'Admin yetkisi: tüm onay ve düzenleme işlemleri açık.';
    }
    if (isTeacher(user)) {
      return 'Öğretmen: paylaşımları ve etkinlikleri onaysız yayınlar.';
    }
    if (isCommunityAdmin(user)) {
      return 'Topluluk admini: kendi topluluğunda yönetim yapar.';
    }
    return 'Öğrenci: etkinlik, anket ve topluluk başvuruları onaya gider.';
  }
}
