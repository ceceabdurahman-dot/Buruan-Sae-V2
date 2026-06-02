import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:buruan_sae/features/lahan/data/providers/lahan_provider.dart';
import 'package:buruan_sae/features/lahan/domain/models/lahan_model.dart';
import 'package:buruan_sae/features/lahan/presentation/pages/lahan_list_page.dart';

// ============================================================
// Flutter Widget Test: LahanListPage
// ============================================================

void main() {
  // Data mock untuk lahan
  final mockLahanList = <LahanSingkat>[
    LahanSingkat(
      id: 'lahan-1',
      nama: 'Kebun Sayur RT 01',
      alamat: 'Jl. Kebun 1',
      kecamatan: 'Cidadap',
      kelurahan: 'Hegarmanah',
      luas_m2: 250,
      status: 'AKTIF',
      created_at: '2026-01-15T00:00:00.000Z',
    ),
    LahanSingkat(
      id: 'lahan-2',
      nama: 'Taman Edukasi Ciumbuleuit',
      alamat: 'Jl. Taman 2',
      kecamatan: 'Cidadap',
      kelurahan: 'Ciumbuleuit',
      luas_m2: 400,
      status: 'DALAM_REVIEW',
      created_at: '2026-02-10T00:00:00.000Z',
    ),
  ];

  final mockLahanResponse = DaftarLahanResponse(
    data: mockLahanList,
    total: mockLahanList.length,
    page: 1,
    limit: 20,
    totalHalaman: 1,
  );

  const emptyLahanResponse = DaftarLahanResponse(
    data: [],
    total: 0,
    page: 1,
    limit: 20,
    totalHalaman: 0,
  );

  Widget buildLahanListPage({
    AsyncValue<DaftarLahanResponse> lahanState = const AsyncValue.loading(),
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
        daftarLahanProvider.overrideWith((_) => lahanState.valueOrNull ?? const DaftarLahanResponse(
          data: [],
          total: 0,
          page: 1,
          limit: 20,
          totalHalaman: 0,
        )),
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
        lahanState: AsyncValue.data(mockLahanResponse),
      ));
      await tester.pumpAndSettle();

      expect(find.text('Kebun Sayur RT 01'), findsOneWidget);
      expect(find.text('Taman Edukasi Ciumbuleuit'), findsOneWidget);
    });

    testWidgets('harus menampilkan kecamatan dan luas pada setiap kartu', (tester) async {
      await tester.pumpWidget(buildLahanListPage(
        lahanState: AsyncValue.data(mockLahanResponse),
      ));
      await tester.pumpAndSettle();

      expect(find.textContaining('Cidadap'), findsAtLeast(1));
      expect(find.textContaining('250'), findsOneWidget); // 250 m²
    });

    testWidgets('harus menampilkan badge status lahan', (tester) async {
      await tester.pumpWidget(buildLahanListPage(
        lahanState: AsyncValue.data(mockLahanResponse),
      ));
      await tester.pumpAndSettle();

      expect(find.text('AKTIF'), findsOneWidget);
      expect(find.text('DALAM REVIEW'), findsOneWidget);
    });

    testWidgets('harus menampilkan komoditas utama pada kartu lahan', (tester) async {
      await tester.pumpWidget(buildLahanListPage(
        lahanState: AsyncValue.data(mockLahanResponse),
      ));
      await tester.pumpAndSettle();

      expect(find.textContaining('Bayam'), findsOneWidget);
      expect(find.textContaining('Tomat'), findsOneWidget);
    });

    testWidgets('harus menampilkan empty state jika tidak ada lahan', (tester) async {
      await tester.pumpWidget(buildLahanListPage(
        lahanState: const AsyncValue.data(emptyLahanResponse),
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
        lahanState: AsyncValue.data(mockLahanResponse),
      ));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('tab_daftar')), findsOneWidget);
      expect(find.byKey(const Key('tab_peta')), findsOneWidget);
    });

    testWidgets('tap tab Peta menampilkan FlutterMap', (tester) async {
      await tester.pumpWidget(buildLahanListPage(
        lahanState: AsyncValue.data(mockLahanResponse),
      ));
      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const Key('tab_peta')));
      await tester.pumpAndSettle();

      // MapView atau container peta harus muncul
      expect(find.byKey(const Key('lahan_map_view')), findsOneWidget);
    });

    testWidgets('tap kartu lahan navigasi ke halaman detail', (tester) async {
      await tester.pumpWidget(buildLahanListPage(
        lahanState: AsyncValue.data(mockLahanResponse),
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
        lahanState: AsyncValue.data(mockLahanResponse),
      ));
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('fab_tambah_lahan')), findsOneWidget);
    });

    testWidgets('tap FAB navigasi ke halaman tambah lahan', (tester) async {
      await tester.pumpWidget(buildLahanListPage(
        lahanState: AsyncValue.data(mockLahanResponse),
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
        lahanState: AsyncValue.data(mockLahanResponse),
      ));
      await tester.pumpAndSettle();

      expect(find.byType(RefreshIndicator), findsOneWidget);
    });
  });
}
