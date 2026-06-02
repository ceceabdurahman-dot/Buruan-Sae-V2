import 'package:flutter/material.dart';

import 'home_page.dart';

// ============================================================
// DashboardPage — Entry point untuk tab Beranda
// Delegates rendering ke HomePage
// ============================================================

class DashboardPage extends StatelessWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context) => const HomePage();
}
