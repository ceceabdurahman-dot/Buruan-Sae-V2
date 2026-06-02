import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';

import 'package:buruan_sae/features/lahan/data/providers/lahan_provider.dart';
import 'package:buruan_sae/features/lahan/domain/models/lahan_model.dart';
import 'package:buruan_sae/features/lahan/presentation/pages/lahan_list_page.dart';

import 'lahan_list_page_test.mocks.dart';

// ============================================================
// Flutter Widget Test: LahanListPage
// ============================================================

@GenerateMocks([DaftarLahanNotifier])
void main() {
  // Data mock untuk lahan
  final mockLahanList = [
    LahanSingkat(
      id: 'lahan-1',
      nama: 'Kebun Sayur RT 01',
      kecamatan: 'Cidadap',
      kelurahan: 'Hegarmanah',
      luasM2: 250,
      status: 'AKTIF',
      komoditasUtama: ['Bayam', 'Kangkung'],
      createdAt: DateTime(2026, 1, 15),
    ),
    LahanSingkat(
      id: 'lahan-2',
      nama: 'Taman Edukasi Ciumbuleuit',
      kecamatan: 'Cidadap',
      kelurahan: 'Ciumbuleuit',
      luasM2: 400,
      status: 'DALAM_REVIEW',
      komoditasUtama: ['Tomat', 'Cabai'],
      createdAt: DateTime(2026, 2, 10),
    ),
  ];

  Widget buildLahanListPage({
    AsyncValue<List<LahanSingkat>> lahanState = const AsyncValue.loading(),
  }) {
    final testRouter = GoRouter(
      initialLocation: '/lahan',
      routes: [
        GoRoute(
          path: '/lahan',
          builder: (_, __) => const LahanListPage(),
        ),
        GoRoute(
          path: '/lahan/:id',
          builder: (_, state) => Scaffold(
            body: Text('Detail ${state.pathParameters['id']}'),
          ),
        ),
        GoRoute(
          path: '/lahan/tambah',
          builder: (_, __) => const Scaffold(body: Text('Tambah Lahan')),
        ),
      ],
    );

    return ProviderScope(
      overrides: [
        daftarLahanProvider.overrideWith((_) => lahanState),
      ],
      child: MaterialApp.router(
        routerConfig: testRouter,
        theme: ThemeData(colorSchemeSeed: const Color(0xFF2D7D32)),
      ),
    );
  }

  // ============================================================
  // Group: Render & State Loading
  // ============================================================

  group('LahanListPage — State Loading', () {
    testWidgets('harus menampilkan shimmer/loading saat data dimuat', (tester) async {
      await tester.pumpWidget(buildLahanListPage(
        lahanState: const AsyncValue.loading(),
      ));
      await tester.pump();

      // Loading indicator atau shimmer harus ada
      expect(
        find.byType(CircularProgressIndicator).evaluate().isNotEmpty ||
        find.byKey(const Key('lahan_list_skeleton')).evaluate().isNotEmpty,
        isTrue,
      );
    });

    testWidgets('harus menampilkan pesan error jika gagal memuat', (tester) async {
      await tester.pumpWidget(buildLahanListPage(
        lahanState: AsyncValue.error(
          Exception('Gagal memuat data lahan'),
          StackTrace.current,
        ),
      ));
      await tester.pumpAndSettle();

      expect(find.textContaining('Gagal'), findsAtLeast(1));
      // Harus ada tombol retry
      expect(find.byKey(const Key('btn_retry')), findsOneWidget);
    });
  });

  // ============================================================
  // Group: Render Data
  // ============================================================

  group('LahanListPage — Render Data', () {
    testWidgets('harus menampilkan semua lahan dalam daftar', (tester) async {
      await tester.pumpWidget(buildLahanListPage(
        lahanState: AsyncValue.data(mockLahanList),
      ));
      await tester.pumpAndSettle();

      expect(find.text('Kebun Sayur RT 01'), findsOneWidget);
      expect(find.text('Taman Edukasi Ciumbuleuit'), findsOneWidget);
    });

    testWidgets('harus menampilkan kecamatan dan luas pada setiap kartu', (tester) async {
      await tester.pumpWidget(buildLahanListPage(
        lahanState: AsyncValue.data(mockLahanList),
      ));
      await tester.pumpAndSettle();

      expect(find.textContaining('Cidadap'), findsAtLeast(1));
      expect(find.textContaining('250'), findsOneWidget); // 250 m²
    });

    testWidgets('harus menampilkan badge status lahan', (tester) async {
      await tester.pumpWidget(buildLahanListPage(
        lahanState: AsyncValue.data(mockLahanList),
      ));
      await tester.pumpAndSettle();

      expect(find.text('AKTIF'), findsOneWidget);
      expect(find.text('DALAM REVIEW'), findsOneWidget);
    });

    testWidgets('harus menampilkan komoditas utama pada kartu lahan', (tester) async {
      await tester.pumpWidget(buildLahanListPage(
        lahanState: AsyncValue.data(mockLahanList),
      ));
      await tester.pumpAndSettle();

      expect(find.textContaining('Bayam'), findsOneWidget);
      expect(find.textContaining('Tomat'), findsOneWidget);
    });

    testWidgets('harus menampilkan empty state jika tidak ada lahan', (tester) async {
      await tester.pumpWidget(buildLahanListPage(
        lahanState: const AsyncValue.data([]),
      ));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('lahan_empty_state')), findsOneWidget);
      expect(find.textContaining('Belum ada lahan'), findsOneWidget);
    });
  });

  // ============================================================
  // Group: Tab & Navigasi
  // ============================================================

  group('LahanListPage — Tab Navigasi', () {
    testWidgets('harus ada dua tab: Daftar dan Peta', (tester) async {
      await tester.pumpWidget(buildLahanListPage(
        lahanState: AsyncValue.data(mockLahanList),
      ));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('tab_daftar')), findsOneWidget);
      expect(find.byKey(const Key('tab_peta')), findsOneWidget);
    });

    testWidgets('tap tab Peta menampilkan FlutterMap', (tester) async {
      await tester.pumpWidget(buildLahanListPage(
        lahanState: AsyncValue.data(mockLahanList),
      ));
      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const Key('tab_peta')));
      await tester.pumpAndSettle();

      // MapView atau container peta harus muncul
      expect(find.byKey(const Key('lahan_map_view')), findsOneWidget);
    });

    testWidgets('tap kartu lahan navigasi ke halaman detail', (tester) async {
      await tester.pumpWidget(buildLahanListPage(
        lahanState: AsyncValue.data(mockLahanList),
      ));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Kebun Sayur RT 01'));
      await tester.pumpAndSettle();

      expect(find.textContaining('Detail lahan-1'), findsOneWidget);
    });
  });

  // ============================================================
  // Group: FAB Tambah Lahan
  // ============================================================

  group('LahanListPage — FAB Tambah Lahan', () {
    testWidgets('harus ada FloatingActionButton tambah lahan', (tester) async {
      await tester.pumpWidget(buildLahanListPage(
        lahanState: AsyncValue.data(mockLahanList),
      ));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('fab_tambah_lahan')), findsOneWidget);
    });

    testWidgets('tap FAB navigasi ke halaman tambah lahan', (tester) async {
      await tester.pumpWidget(buildLahanListPage(
        lahanState: AsyncValue.data(mockLahanList),
      ));
      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const Key('fab_tambah_lahan')));
      await tester.pumpAndSettle();

      expect(find.text('Tambah Lahan'), findsOneWidget);
    });
  });

  // ============================================================
  // Group: Pull to Refresh
  // ============================================================

  group('LahanListPage — Pull to Refresh', () {
    testWidgets('harus mendukung RefreshIndicator pada tab daftar', (tester) async {
      await tester.pumpWidget(buildLahanListPage(
        lahanState: AsyncValue.data(mockLahanList),
      ));
      await tester.pumpAndSettle();

      expect(find.byType(RefreshIndicator), findsOneWidget);
    });
  });
}
