import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class MainShellScreen extends StatelessWidget {
  const MainShellScreen({required this.child, super.key});

  final Widget child;

  int _indexForPath(String path) {
    if (path.startsWith('/events')) return 1;
    if (path.startsWith('/communities')) return 2;
    if (path.startsWith('/messages')) return 3;
    if (path.startsWith('/profile')) return 4;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final path = GoRouterState.of(context).uri.path;
    final index = _indexForPath(path);

    return Scaffold(
      body: SafeArea(child: child),
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (value) {
          final route = switch (value) {
            0 => '/home',
            1 => '/events',
            2 => '/communities',
            3 => '/messages',
            _ => '/profile/me',
          };
          context.go(route);
        },
        destinations: const [
          NavigationDestination(icon: Icon(Icons.dynamic_feed_outlined), label: 'Akış'),
          NavigationDestination(icon: Icon(Icons.event_outlined), label: 'Etkinlik'),
          NavigationDestination(icon: Icon(Icons.groups_2_outlined), label: 'Topluluk'),
          NavigationDestination(icon: Icon(Icons.chat_bubble_outline), label: 'Mesaj'),
          NavigationDestination(icon: Icon(Icons.person_outline), label: 'Profil'),
        ],
      ),
    );
  }
}
