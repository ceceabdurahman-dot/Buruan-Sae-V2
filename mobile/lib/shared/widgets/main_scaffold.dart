import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

// ============================================================
// MainScaffold — Bottom Navigation Shell untuk ShellRoute
// ============================================================

class MainScaffold extends StatelessWidget {
  final Widget child;
  const MainScaffold({super.key, required this.child});

  static const _navItems = [
    _NavItem(
      path: '/dashboard',
      icon: Icons.home_outlined,
      activeIcon: Icons.home,
      label: 'Beranda',
    ),
    _NavItem(
      path: '/lahan',
      icon: Icons.map_outlined,
      activeIcon: Icons.map,
      label: 'Lahan',
    ),
    _NavItem(
      path: '/produksi',
      icon: Icons.agriculture_outlined,
      activeIcon: Icons.agriculture,
      label: 'Produksi',
    ),
    _NavItem(
      path: '/marketplace',
      icon: Icons.storefront_outlined,
      activeIcon: Icons.storefront,
      label: 'Pasar',
    ),
    _NavItem(
      path: '/profil',
      icon: Icons.person_outline,
      activeIcon: Icons.person,
      label: 'Profil',
    ),
  ];

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    for (int i = 0; i < _navItems.length; i++) {
      if (location.startsWith(_navItems[i].path)) return i;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final currentIndex = _currentIndex(context);

    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: currentIndex,
        onDestinationSelected: (i) {
          if (i != currentIndex) {
            context.go(_navItems[i].path);
          }
        },
        backgroundColor: Colors.white,
        indicatorColor: const Color(0xFF2D7D32).withOpacity(0.12),
        destinations: _navItems
            .map((item) => NavigationDestination(
                  icon: Icon(item.icon, color: Colors.grey.shade600),
                  selectedIcon: Icon(item.activeIcon,
                      color: const Color(0xFF2D7D32)),
                  label: item.label,
                ))
            .toList(),
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
      ),
    );
  }
}

class _NavItem {
  final String path;
  final IconData icon;
  final IconData activeIcon;
  final String label;
  const _NavItem({
    required this.path,
    required this.icon,
    required this.activeIcon,
    required this.label,
  });
}
