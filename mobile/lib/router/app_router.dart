import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../features/auth/presentation/pages/login_page.dart';
import '../features/auth/presentation/pages/register_page.dart';
import '../features/auth/presentation/pages/otp_page.dart';
import '../features/dashboard/presentation/pages/dashboard_page.dart';
import '../features/lahan/presentation/pages/lahan_list_page.dart';
import '../features/lahan/presentation/pages/lahan_detail_page.dart';
import '../features/produksi/presentation/pages/produksi_page.dart';
import '../features/marketplace/presentation/pages/marketplace_page.dart';
import '../features/marketplace/presentation/pages/detail_produk_page.dart';
import '../features/agrowisata/presentation/pages/agrowisata_page.dart';
import '../features/komunitas/presentation/pages/komunitas_page.dart';
import '../features/komunitas/presentation/pages/tulis_postingan_page.dart';
import '../features/komunitas/presentation/pages/detail_postingan_page.dart';
import '../features/edukasi/presentation/pages/edukasi_page.dart';
import '../features/edukasi/presentation/pages/detail_kursus_page.dart';
import '../features/profil/presentation/pages/profil_page.dart';
import '../features/profil/presentation/pages/edit_profil_page.dart';
import '../features/profil/presentation/pages/ganti_password_page.dart';
import '../features/profil/presentation/pages/poin_page.dart';
import '../features/profil/presentation/pages/privasi_page.dart';
import '../features/splash/presentation/pages/splash_page.dart';
import '../shared/widgets/main_scaffold.dart';
import '../features/auth/data/providers/auth_provider.dart';

part 'app_router.g.dart';

@riverpod
GoRouter appRouter(AppRouterRef ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) {
      final isAuthenticated = authState.isAuthenticated;
      final isAuthRoute = state.matchedLocation.startsWith('/auth');
      final isSplash = state.matchedLocation == '/splash';

      if (isSplash) return null;

      if (!isAuthenticated && !isAuthRoute) {
        return '/auth/login';
      }
      if (isAuthenticated && isAuthRoute) {
        return '/dashboard';
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashPage(),
      ),

      // ── Auth routes ──────────────────────────────────────
      GoRoute(
        path: '/auth/login',
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: '/auth/register',
        builder: (context, state) => const RegisterPage(),
      ),
      GoRoute(
        path: '/auth/otp',
        builder: (context, state) => OtpPage(
          nomor: state.uri.queryParameters['nomor'] ?? '',
        ),
      ),

      // ── Main shell dengan bottom navigation ───────────────
      ShellRoute(
        builder: (context, state, child) => MainScaffold(child: child),
        routes: [
          // Dashboard
          GoRoute(
            path: '/dashboard',
            builder: (context, state) => const DashboardPage(),
          ),

          // Lahan
          GoRoute(
            path: '/lahan',
            builder: (context, state) => const LahanListPage(),
            routes: [
              GoRoute(
                path: ':id',
                builder: (context, state) => LahanDetailPage(
                  lahanId: state.pathParameters['id']!,
                ),
              ),
            ],
          ),

          // Produksi
          GoRoute(
            path: '/produksi',
            builder: (context, state) => const ProduksiPage(),
          ),

          // Marketplace
          GoRoute(
            path: '/marketplace',
            builder: (context, state) => const MarketplacePage(),
            routes: [
              GoRoute(
                path: ':id',
                builder: (context, state) => DetailProdukPage(
                  produkId: state.pathParameters['id']!,
                ),
              ),
            ],
          ),

          // Agrowisata
          GoRoute(
            path: '/agrowisata',
            builder: (context, state) => const AgrowisataPage(),
          ),

          // Komunitas
          GoRoute(
            path: '/komunitas',
            builder: (context, state) => const KomunitasPage(),
            routes: [
              GoRoute(
                path: 'tulis',
                builder: (context, state) => const TulisPostinganPage(),
              ),
              GoRoute(
                path: ':id',
                builder: (context, state) => DetailPostinganPage(
                  postinganId: state.pathParameters['id']!,
                ),
              ),
            ],
          ),

          // Edukasi
          GoRoute(
            path: '/edukasi',
            builder: (context, state) => const EdukasiPage(),
            routes: [
              GoRoute(
                path: ':id',
                builder: (context, state) => DetailKursusPage(
                  kursusId: state.pathParameters['id']!,
                ),
              ),
            ],
          ),

          // Profil
          GoRoute(
            path: '/profil',
            builder: (context, state) => const ProfilPage(),
            routes: [
              GoRoute(
                path: 'edit',
                builder: (context, state) => const EditProfilPage(),
              ),
              GoRoute(
                path: 'ganti-password',
                builder: (context, state) => const GantiPasswordPage(),
              ),
              GoRoute(
                path: 'poin',
                builder: (context, state) => const PoinPage(),
              ),
              GoRoute(
                path: 'privasi',
                builder: (context, state) => const PrivasiPage(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
}
