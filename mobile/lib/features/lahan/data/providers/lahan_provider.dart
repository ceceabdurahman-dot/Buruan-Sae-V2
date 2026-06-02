import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../../core/network/api_client.dart';
import '../../domain/models/lahan_model.dart';

part 'lahan_provider.g.dart';

// ============================================================
// Lahan Providers (Riverpod)
// ============================================================

@riverpod
Future<DaftarLahanResponse> daftarLahan(DaftarLahanRef ref) async {
  final dio = ref.watch(dioProvider);
  final response = await dio.get('/api/v1/lahan', queryParameters: {
    'limit': 50,
  });
  return DaftarLahanResponse.fromJson(response.data);
}

@riverpod
Future<Map<String, dynamic>> petaLahan(PetaLahanRef ref) async {
  final dio = ref.watch(dioProvider);
  final response = await dio.get('/api/v1/lahan/peta');
  return response.data as Map<String, dynamic>;
}

@riverpod
Future<LahanDetail> detailLahan(DetailLahanRef ref, String lahanId) async {
  final dio = ref.watch(dioProvider);
  final response = await dio.get('/api/v1/lahan/$lahanId');
  return LahanDetail.fromJson(response.data);
}

// ============================================================
// Notifier untuk tambah lahan
// ============================================================

@riverpod
class TambahLahanNotifier extends _$TambahLahanNotifier {
  @override
  AsyncValue<void> build() => const AsyncData(null);

  Future<String> tambah(Map<String, dynamic> data) async {
    state = const AsyncLoading();
    try {
      final dio = ref.read(dioProvider);
      final response = await dio.post('/api/v1/lahan', data: data);
      state = const AsyncData(null);
      ref.invalidate(daftarLahanProvider);
      return response.data['id'] as String;
    } catch (e) {
      state = AsyncError(e, StackTrace.current);
      rethrow;
    }
  }
}
