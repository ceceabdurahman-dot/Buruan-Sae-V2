import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';

import 'package:buruan_sae/features/auth/data/providers/auth_provider.dart';
import 'package:buruan_sae/features/auth/presentation/pages/login_page.dart';

import 'login_page_test.mocks.dart';

// ============================================================
// Flutter Widget Test: LoginPage
// ============================================================

@GenerateMocks([AuthStateNotifier])
void main() {
  late MockAuthStateNotifier mockAuthNotifier;

  setUp(() {
    mockAuthNotifier = MockAuthStateNotifier();

    // Default state: belum terautentikasi
    when(mockAuthNotifier.state).thenReturn(
      const AuthState(
        isLoading: false,
        isAuthenticated: false,
        errorMessage: null,
      ),
    );
  });

  // --------------------------------------------------------
  // Helper: bungkus widget dengan provider override + router
  // --------------------------------------------------------
  Widget buildLoginPage({AuthState? overrideState}) {
    final testRouter = GoRouter(
      initialLocation: '/auth/login',
      routes: [
        GoRoute(
          path: '/auth/login',
          builder: (_, __) => const LoginPage(),
        ),
        GoRoute(
          path: '/dashboard',
          builder: (_, __) => const Scaffold(body: Text('Dashboard')),
        ),
        GoRoute(
          path: '/auth/register',
          builder: (_, __) => const Scaffold(body: Text('Register')),
        ),
      ],
    );

    if (overrideState != null) {
      when(mockAuthNotifier.state).thenReturn(overrideState);
    }

    return ProviderScope(
      overrides: [
        authStateNotifierProvider.overrideWith((_) => mockAuthNotifier),
      ],
      child: MaterialApp.router(
        routerConfig: testRouter,
        theme: ThemeData(colorSchemeSeed: const Color(0xFF2D7D32)),
      ),
    );
  }

  // ============================================================
  // Group: Render & Struktur UI
  // ============================================================

  group('LoginPage — Render UI', () {
    testWidgets('harus menampilkan field identifier dan password', (tester) async {
      await tester.pumpWidget(buildLoginPage());
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('field_identifier')), findsOneWidget);
      expect(find.byKey(const Key('field_password')), findsOneWidget);
      expect(find.byKey(const Key('btn_login')), findsOneWidget);
    });

    testWidgets('harus menampilkan logo atau judul aplikasi', (tester) async {
      await tester.pumpWidget(buildLoginPage());
      await tester.pumpAndSettle();

      // Cek teks judul ada di halaman
      expect(
        find.textContaining('Buruan Sae', findRichText: true),
        findsAtLeast(1),
      );
    });

    testWidgets('harus ada link ke halaman register', (tester) async {
      await tester.pumpWidget(buildLoginPage());
      await tester.pumpAndSettle();

      expect(find.byKey(const Key('link_daftar')), findsOneWidget);
    });

    testWidgets('password tersembunyi secara default', (tester) async {
      await tester.pumpWidget(buildLoginPage());
      await tester.pumpAndSettle();

      final passwordField = tester.widget<TextField>(
        find.descendant(
          of: find.byKey(const Key('field_password')),
          matching: find.byType(TextField),
        ),
      );
      expect(passwordField.obscureText, isTrue);
    });

    testWidgets('ikon toggle password mengubah visibilitas', (tester) async {
      await tester.pumpWidget(buildLoginPage());
      await tester.pumpAndSettle();

      // Tap ikon toggle
      await tester.tap(find.byKey(const Key('toggle_password_visibility')));
      await tester.pumpAndSettle();

      final passwordField = tester.widget<TextField>(
        find.descendant(
          of: find.byKey(const Key('field_password')),
          matching: find.byType(TextField),
        ),
      );
      expect(passwordField.obscureText, isFalse);
    });
  });

  // ============================================================
  // Group: Validasi Form
  // ============================================================

  group('LoginPage — Validasi Form', () {
    testWidgets('harus tampil error jika identifier kosong', (tester) async {
      await tester.pumpWidget(buildLoginPage());
      await tester.pumpAndSettle();

      // Langsung tap login tanpa isi field
      await tester.tap(find.byKey(const Key('btn_login')));
      await tester.pumpAndSettle();

      expect(find.textContaining('tidak boleh kosong'), findsAtLeast(1));
    });

    testWidgets('harus tampil error jika identifier tidak valid', (tester) async {
      await tester.pumpWidget(buildLoginPage());
      await tester.pumpAndSettle();

      await tester.enterText(
        find.byKey(const Key('field_identifier')),
        'bukan-email-atau-wa',
      );
      await tester.enterText(
        find.byKey(const Key('field_password')),
        'Password123',
      );
      await tester.tap(find.byKey(const Key('btn_login')));
      await tester.pumpAndSettle();

      expect(find.textContaining('email atau nomor WhatsApp'), findsOneWidget);
    });

    testWidgets('harus tampil error jika password kosong', (tester) async {
      await tester.pumpWidget(buildLoginPage());
      await tester.pumpAndSettle();

      await tester.enterText(
        find.byKey(const Key('field_identifier')),
        '08123456789',
      );
      // Tidak isi password
      await tester.tap(find.byKey(const Key('btn_login')));
      await tester.pumpAndSettle();

      expect(find.textContaining('Password'), findsAtLeast(1));
    });

    testWidgets('tidak ada error jika form diisi dengan benar', (tester) async {
      when(mockAuthNotifier.loginWithPassword(
        identifier: anyNamed('identifier'),
        password: anyNamed('password'),
      )).thenAnswer((_) async {});

      await tester.pumpWidget(buildLoginPage());
      await tester.pumpAndSettle();

      await tester.enterText(
        find.byKey(const Key('field_identifier')),
        '08123456789',
      );
      await tester.enterText(
        find.byKey(const Key('field_password')),
        'Password123',
      );
      await tester.tap(find.byKey(const Key('btn_login')));
      await tester.pumpAndSettle();

      expect(find.textContaining('tidak boleh kosong'), findsNothing);
    });
  });

  // ============================================================
  // Group: State Loading
  // ============================================================

  group('LoginPage — State Loading', () {
    testWidgets('harus tampil CircularProgressIndicator saat loading', (tester) async {
      when(mockAuthNotifier.state).thenReturn(
        const AuthState(
          isLoading: true,
          isAuthenticated: false,
          errorMessage: null,
        ),
      );

      await tester.pumpWidget(buildLoginPage(
        overrideState: const AuthState(
          isLoading: true,
          isAuthenticated: false,
          errorMessage: null,
        ),
      ));
      await tester.pump(); // Tidak pumpAndSettle karena loading tidak selesai

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('tombol login disabled saat loading', (tester) async {
      await tester.pumpWidget(buildLoginPage(
        overrideState: const AuthState(
          isLoading: true,
          isAuthenticated: false,
          errorMessage: null,
        ),
      ));
      await tester.pump();

      final button = tester.widget<ElevatedButton>(
        find.byKey(const Key('btn_login')),
      );
      expect(button.onPressed, isNull);
    });
  });

  // ============================================================
  // Group: State Error
  // ============================================================

  group('LoginPage — Tampil Pesan Error', () {
    testWidgets('harus tampil SnackBar atau teks error dari state', (tester) async {
      await tester.pumpWidget(buildLoginPage(
        overrideState: const AuthState(
          isLoading: false,
          isAuthenticated: false,
          errorMessage: 'Nomor WA atau password salah',
        ),
      ));
      await tester.pumpAndSettle();

      expect(
        find.textContaining('Nomor WA atau password salah'),
        findsOneWidget,
      );
    });
  });

  // ============================================================
  // Group: Navigasi
  // ============================================================

  group('LoginPage — Navigasi', () {
    testWidgets('tap link daftar navigasi ke halaman register', (tester) async {
      await tester.pumpWidget(buildLoginPage());
      await tester.pumpAndSettle();

      await tester.tap(find.byKey(const Key('link_daftar')));
      await tester.pumpAndSettle();

      expect(find.text('Register'), findsOneWidget);
    });

    testWidgets('login berhasil navigasi ke dashboard', (tester) async {
      // Mock login berhasil → state berubah ke authenticated
      when(mockAuthNotifier.loginWithPassword(
        identifier: anyNamed('identifier'),
        password: anyNamed('password'),
      )).thenAnswer((_) async {
        when(mockAuthNotifier.state).thenReturn(
          const AuthState(
            isLoading: false,
            isAuthenticated: true,
            errorMessage: null,
            peran: 'PETANI',
            penggunaId: 'test-user-id',
          ),
        );
      });

      await tester.pumpWidget(buildLoginPage());
      await tester.pumpAndSettle();

      await tester.enterText(
        find.byKey(const Key('field_identifier')),
        '08123456789',
      );
      await tester.enterText(
        find.byKey(const Key('field_password')),
        'Password123',
      );
      await tester.tap(find.byKey(const Key('btn_login')));
      await tester.pumpAndSettle();

      // Setelah login berhasil, router redirect ke /dashboard
      expect(find.text('Dashboard'), findsOneWidget);
    });
  });

  // ============================================================
  // Group: Panggil Service
  // ============================================================

  group('LoginPage — Interaksi dengan AuthNotifier', () {
    testWidgets('harus panggil loginWithPassword dengan data yang benar', (tester) async {
      when(mockAuthNotifier.loginWithPassword(
        identifier: anyNamed('identifier'),
        password: anyNamed('password'),
      )).thenAnswer((_) async {});

      await tester.pumpWidget(buildLoginPage());
      await tester.pumpAndSettle();

      await tester.enterText(
        find.byKey(const Key('field_identifier')),
        'test@gmail.com',
      );
      await tester.enterText(
        find.byKey(const Key('field_password')),
        'Password123',
      );
      await tester.tap(find.byKey(const Key('btn_login')));
      await tester.pumpAndSettle();

      verify(mockAuthNotifier.loginWithPassword(
        identifier: 'test@gmail.com',
        password: 'Password123',
      )).called(1);
    });
  });
}
