import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../../core/network/api_client.dart';

part 'auth_provider.g.dart';

const _storage = FlutterSecureStorage();

// ============================================================
// Auth State
// ============================================================

class AuthState {
  final bool isLoading;
  final bool isAuthenticated;
  final String? peran;
  final String? penggunaId;
  final String? namaLengkap;
  final int? totalPoin;
  final String? errorMessage;

  const AuthState({
    this.isLoading = false,
    required this.isAuthenticated,
    this.peran,
    this.penggunaId,
    this.namaLengkap,
    this.totalPoin,
    this.errorMessage,
  });

  const AuthState.unauthenticated()
      : isLoading = false,
        isAuthenticated = false,
        peran = null,
        penggunaId = null,
        namaLengkap = null,
        totalPoin = null,
        errorMessage = null;

  AuthState copyWith({
    bool? isLoading,
    bool? isAuthenticated,
    String? peran,
    String? penggunaId,
    String? namaLengkap,
    int? totalPoin,
    String? errorMessage,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      peran: peran ?? this.peran,
      penggunaId: penggunaId ?? this.penggunaId,
      namaLengkap: namaLengkap ?? this.namaLengkap,
      totalPoin: totalPoin ?? this.totalPoin,
      errorMessage: errorMessage,
    );
  }
}

// ============================================================
// Auth State Notifier
// ============================================================

@riverpod
class AuthStateNotifier extends _$AuthStateNotifier {
  @override
  AuthState build() => const AuthState.unauthenticated();

  /// Inisialisasi: baca token dari secure storage saat app launch
  Future<void> initialize() async {
    final token = await _storage.read(key: 'access_token');
    if (token == null) return;

    final peran = await _storage.read(key: 'peran');
    final id = await _storage.read(key: 'pengguna_id');
    final nama = await _storage.read(key: 'nama_lengkap');
    final poinStr = await _storage.read(key: 'total_poin');

    state = AuthState(
      isAuthenticated: true,
      peran: peran,
      penggunaId: id,
      namaLengkap: nama,
      totalPoin: poinStr != null ? int.tryParse(poinStr) : null,
    );
  }

  // ── Register ────────────────────────────────────────────────

  Future<void> register({
    required String nik,
    required String namaLengkap,
    required String nomorWa,
    String email = '',
    required String password,
    required String peran,
    bool consentDataPribadi = true,
    bool consentPublikasiData = false,
  }) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final dio = ref.read(dioProvider);
      await dio.post('/auth/register', data: {
        'nik': nik,
        'nama_lengkap': namaLengkap,
        'nomor_wa': nomorWa,
        'email': email,
        'password': password,
        'peran': peran,
        'consent_data_pribadi': consentDataPribadi,
        'consent_publikasi_data': consentPublikasiData,
      });
      // Register sukses → OTP dikirim ke WA
    } catch (e) {
      state = state.copyWith(errorMessage: _parseError(e));
      rethrow;
    } finally {
      state = state.copyWith(isLoading: false);
    }
  }

  // ── OTP ─────────────────────────────────────────────────────

  Future<void> kirimOtp(String nomorWa) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final dio = ref.read(dioProvider);
      await dio.post('/auth/otp/kirim', data: {'nomor_wa': nomorWa});
    } catch (e) {
      state = state.copyWith(errorMessage: _parseError(e));
      rethrow;
    } finally {
      state = state.copyWith(isLoading: false);
    }
  }

  Future<void> verifikasiOtp({
    required String nomorWa,
    required String kodeOtp,
  }) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final dio = ref.read(dioProvider);
      final response = await dio.post('/auth/otp/verify', data: {
        'nomor_wa': nomorWa,
        'kode_otp': kodeOtp,
      });
      await _simpanToken(response.data['data'] as Map<String, dynamic>);
    } catch (e) {
      state = state.copyWith(errorMessage: _parseError(e));
      rethrow;
    } finally {
      state = state.copyWith(isLoading: false);
    }
  }

  // ── Login ───────────────────────────────────────────────────

  Future<void> loginWithOtp(String nomorWa, String kodeOtp) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final dio = ref.read(dioProvider);
      final response = await dio.post('/auth/otp/verify', data: {
        'nomor_wa': nomorWa,
        'kode_otp': kodeOtp,
      });
      await _simpanToken(response.data['data'] as Map<String, dynamic>);
    } catch (e) {
      state = state.copyWith(errorMessage: _parseError(e));
      rethrow;
    } finally {
      state = state.copyWith(isLoading: false);
    }
  }

  Future<void> loginWithPassword({
    required String identifier,
    required String password,
  }) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final dio = ref.read(dioProvider);
      final response = await dio.post('/auth/login', data: {
        'identifier': identifier,
        'password': password,
      });
      await _simpanToken(response.data['data'] as Map<String, dynamic>);
    } catch (e) {
      state = state.copyWith(errorMessage: _parseError(e));
      rethrow;
    } finally {
      state = state.copyWith(isLoading: false);
    }
  }

  // ── Logout ──────────────────────────────────────────────────

  Future<void> logout() async {
    try {
      final refreshToken = await _storage.read(key: 'refresh_token');
      if (refreshToken != null) {
        final dio = ref.read(dioProvider);
        await dio.post('/auth/logout',
            data: {'refresh_token': refreshToken});
      }
    } catch (_) {
      // Tetap logout meski request gagal
    } finally {
      await _storage.deleteAll();
      state = const AuthState.unauthenticated();
    }
  }

  // ── Helper ──────────────────────────────────────────────────

  Future<void> _simpanToken(Map<String, dynamic> data) async {
    final accessToken = data['access_token'] as String;
    final refreshToken = data['refresh_token'] as String;
    final peran = data['pengguna']?['peran'] as String? ??
        data['peran'] as String? ?? '';
    final nama = data['pengguna']?['nama_lengkap'] as String? ?? '';
    final poin = (data['pengguna']?['total_poin'] as num?)?.toInt() ?? 0;

    await _storage.write(key: 'access_token', value: accessToken);
    await _storage.write(key: 'refresh_token', value: refreshToken);
    await _storage.write(key: 'peran', value: peran);
    await _storage.write(key: 'nama_lengkap', value: nama);
    await _storage.write(key: 'total_poin', value: '$poin');

    // Decode JWT untuk ambil sub (id pengguna)
    String? penggunaId;
    final parts = accessToken.split('.');
    if (parts.length == 3) {
      try {
        final payload = json.decode(
          utf8.decode(base64Url.decode(base64Url.normalize(parts[1]))),
        ) as Map<String, dynamic>;
        penggunaId = payload['sub'] as String?;
        if (penggunaId != null) {
          await _storage.write(key: 'pengguna_id', value: penggunaId);
        }
      } catch (_) {
        // JWT decode gagal, lanjut
      }
    }

    state = AuthState(
      isLoading: false,
      isAuthenticated: true,
      peran: peran,
      penggunaId: penggunaId,
      namaLengkap: nama,
      totalPoin: poin,
    );
  }

  String _parseError(Object e) {
    // Dio throws DioException — extract backend message if available
    final str = e.toString();
    if (str.contains('"message"')) {
      try {
        final match = RegExp(r'"message"\s*:\s*"([^"]+)"').firstMatch(str);
        if (match != null) return match.group(1)!;
      } catch (_) {}
    }
    return 'Terjadi kesalahan. Coba lagi.';
  }
}

// ── Convenience provider ─────────────────────────────────────

@riverpod
AuthState authState(AuthStateRef ref) =>
    ref.watch(authStateNotifierProvider);
