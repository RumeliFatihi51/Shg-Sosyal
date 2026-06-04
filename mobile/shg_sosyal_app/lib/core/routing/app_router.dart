import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/profile_setup_screen.dart';
import '../../features/auth/screens/register_screen.dart';
import '../../features/badges/screens/badges_screen.dart';
import '../../features/calendar/screens/calendar_screen.dart';
import '../../features/communities/screens/communities_screen.dart';
import '../../features/communities/screens/community_create_screen.dart';
import '../../features/communities/screens/community_detail_screen.dart';
import '../../features/events/screens/event_create_screen.dart';
import '../../features/events/screens/event_detail_screen.dart';
import '../../features/events/screens/events_screen.dart';
import '../../features/feed/screens/feed_screen.dart';
import '../../features/friends/screens/friends_screen.dart';
import '../../features/leaderboard/screens/leaderboard_screen.dart';
import '../../features/messages/screens/chat_screen.dart';
import '../../features/messages/screens/conversations_screen.dart';
import '../../features/notifications/screens/notifications_screen.dart';
import '../../features/profile/screens/edit_profile_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/settings/screens/settings_screen.dart';
import '../../features/shell/screens/main_shell_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/home',
    routes: [
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/register', builder: (context, state) => const RegisterScreen()),
      GoRoute(
        path: '/profile-setup',
        builder: (context, state) => const ProfileSetupScreen(),
      ),
      ShellRoute(
        builder: (context, state, child) => MainShellScreen(child: child),
        routes: [
          GoRoute(path: '/home', builder: (context, state) => const FeedScreen()),
          GoRoute(path: '/events', builder: (context, state) => const EventsScreen()),
          GoRoute(
            path: '/events/create',
            builder: (context, state) => const EventCreateScreen(),
          ),
          GoRoute(
            path: '/events/:id',
            builder: (context, state) => EventDetailScreen(id: state.pathParameters['id']!),
          ),
          GoRoute(
            path: '/communities',
            builder: (context, state) => const CommunitiesScreen(),
          ),
          GoRoute(
            path: '/communities/create',
            builder: (context, state) => const CommunityCreateScreen(),
          ),
          GoRoute(
            path: '/communities/:id',
            builder: (context, state) =>
                CommunityDetailScreen(id: state.pathParameters['id']!),
          ),
          GoRoute(path: '/friends', builder: (context, state) => const FriendsScreen()),
          GoRoute(
            path: '/messages',
            builder: (context, state) => const ConversationsScreen(),
          ),
          GoRoute(
            path: '/messages/:id',
            builder: (context, state) => ChatScreen(id: state.pathParameters['id']!),
          ),
          GoRoute(
            path: '/notifications',
            builder: (context, state) => const NotificationsScreen(),
          ),
          GoRoute(path: '/calendar', builder: (context, state) => const CalendarScreen()),
          GoRoute(path: '/badges', builder: (context, state) => const BadgesScreen()),
          GoRoute(
            path: '/leaderboard',
            builder: (context, state) => const LeaderboardScreen(),
          ),
          GoRoute(
            path: '/profile/edit',
            builder: (context, state) => const EditProfileScreen(),
          ),
          GoRoute(
            path: '/profile/:id',
            builder: (context, state) => const ProfileScreen(),
          ),
          GoRoute(path: '/settings', builder: (context, state) => const SettingsScreen()),
        ],
      ),
    ],
  );
});
