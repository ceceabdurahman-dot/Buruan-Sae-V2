import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'api_client.g.dart';

const _storage = FlutterSecureStorage();

// ============================================================
// Dio Provider — dikonfigurasi dengan interceptor auth
// ============================================================

@riverpod
Dio dio(DioRef ref) {
  final baseUrl = dotenv.env['API_BASE_URL'] ?? 'http://localhost:3000';

  final dio = Dio(BaseOptions(
    baseUrl: baseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 30),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  ));

  // Auth interceptor: tambah Bearer token otomatis
  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'access_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        // 401 → coba refresh token otomatis
        if (error.response?.statusCode == 401) {
          final refreshed = await _refreshToken(dio);
          if (refreshed) {
            // Retry request asli
            final token = await _storage.read(key: 'access_token');
            error.requestOptions.headers['Authorization'] = 'Bearer $token';
            final response = await dio.fetch(error.requestOptions);
            return handler.resolve(response);
          }
        }
        handler.next(error);
      },
    ),
  );

  // Log interceptor (dev mode saja)
  assert(() {
    dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
      logPrint: (obj) => print('[Dio] $obj'),
    ));
    return true;
  }());

  return dio;
}

Future<bool> _refreshToken(Dio dio) async {
  try {
    final refreshToken = await _storage.read(key: 'refresh_token');
    if (refreshToken == null) return false;

    // Buat instance Dio baru (tanpa interceptor) untuk refresh
    final refreshDio = Dio(BaseOptions(baseUrl: dio.options.baseUrl));
    final response = await refreshDio.post('/api/v1/auth/refresh', data: {
      'refresh_token': refreshToken,
    });

    final newAccessToken = response.data['access_token'] as String;
    final newRefreshToken = response.data['refresh_token'] as String;

    await _storage.write(key: 'access_token', value: newAccessToken);
    await _storage.write(key: 'refresh_token', value: newRefreshToken);

    return true;
  } catch (_) {
    // Hapus token expired — redirect ke login
    await _storage.deleteAll();
    return false;
  }
}
