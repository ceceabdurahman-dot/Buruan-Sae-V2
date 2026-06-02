import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

// ============================================================
// Dio HTTP Client — Buruan Sae 2.0 Mobile
// ============================================================

const _storage = FlutterSecureStorage(
  aOptions: AndroidOptions(encryptedSharedPreferences: true),
);

/// Provider utama Dio — gunakan di semua provider API
final dioProvider = Provider<Dio>((ref) {
  final baseUrl = dotenv.env['API_BASE_URL'] ?? 'http://localhost:3001';

  final dio = Dio(
    BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      sendTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ),
  );

  // ── Interceptor: inject access token dari secure storage
  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'access_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },

      onError: (DioException error, handler) async {
        // 401 → coba refresh token
        if (error.response?.statusCode == 401) {
          final refreshToken = await _storage.read(key: 'refresh_token');
          if (refreshToken != null) {
            try {
              final refreshDio = Dio(BaseOptions(baseUrl: baseUrl));
              final res = await refreshDio.post(
                '/auth/refresh',
                data: {'refresh_token': refreshToken},
              );
              final newAccessToken = res.data['data']['access_token'] as String?;
              if (newAccessToken != null) {
                await _storage.write(key: 'access_token', value: newAccessToken);
                // Ulangi request original
                error.requestOptions.headers['Authorization'] =
                    'Bearer $newAccessToken';
                final retryResponse = await dio.fetch(error.requestOptions);
                return handler.resolve(retryResponse);
              }
            } catch (_) {
              // Refresh gagal → hapus semua token
              await _storage.deleteAll();
            }
          }
        }
        return handler.next(error);
      },
    ),
  );

  // ── Log di development (jangan di production)
  // ignore: dead_code
  if (const bool.fromEnvironment('dart.vm.product') == false) {
    dio.interceptors.add(LogInterceptor(
      requestBody: false,   // Jangan log body (mungkin ada data sensitif)
      responseBody: false,
      requestHeader: false,
      error: true,
    ));
  }

  return dio;
});
