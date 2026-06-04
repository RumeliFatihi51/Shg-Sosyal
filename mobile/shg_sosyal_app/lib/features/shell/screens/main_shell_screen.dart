import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';

class MainShellScreen extends StatelessWidget {
  const MainShellScreen({required this.child, super.key});

  final Widget child;

  int _indexForPath(String path) {
    if (path.startsWith('/explore')) return 1;
    if (path.startsWith('/events')) return 2;
    if (path.startsWith('/calendar')) return 3;
    if (path.startsWith('/communities')) return 4;
    if (path.startsWith('/messages')) return 5;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final path = GoRouterState.of(context).uri.path;
    final index = _indexForPath(path);

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light.copyWith(
        statusBarColor: AppColors.background,
        systemNavigationBarColor: AppColors.background,
      ),
      child: Scaffold(
        extendBody: true,
        backgroundColor: AppColors.background,
        bottomNavigationBar: Container(
          decoration: const BoxDecoration(
            color: AppColors.background,
            border: Border(top: BorderSide(color: AppColors.border)),
          ),
          child: SafeArea(
            top: false,
            child: NavigationBar(
              selectedIndex: index,
              height: 66,
              onDestinationSelected: (value) {
                final route = switch (value) {
                  0 => '/home',
                  1 => '/explore',
                  2 => '/events',
                  3 => '/calendar',
                  4 => '/communities',
                  _ => '/messages',
                };
                context.go(route);
              },
              destinations: const [
                NavigationDestination(
                  icon: Icon(Icons.dynamic_feed_outlined),
                  label: 'Akış',
                ),
                NavigationDestination(
                  icon: Icon(Icons.search),
                  label: 'Keşfet',
                ),
                NavigationDestination(
                  icon: Icon(Icons.event_outlined),
                  label: 'Etkinlik',
                ),
                NavigationDestination(
                  icon: Icon(Icons.calendar_month_outlined),
                  label: 'Takvim',
                ),
                NavigationDestination(
                  icon: Icon(Icons.groups_2_outlined),
                  label: 'Topluluk',
                ),
                NavigationDestination(
                  icon: Icon(Icons.chat_bubble_outline),
                  label: 'Mesaj',
                ),
              ],
            ),
          ),
        ),
        body: SafeArea(child: child),
      ),
    );
  }
}
