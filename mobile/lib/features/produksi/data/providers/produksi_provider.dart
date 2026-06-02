import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../../core/network/api_client.dart';

part 'produksi_provider.g.dart';

// ============================================================
// Produksi Providers
// ============================================================

@riverpod
Future<Map<String, dynamic>> catatanPanen(CatatanPanenRef ref) async {
  final dio = ref.watch(dioProvider);
  final response = await dio.get('/api/v1/produksi/catatan', queryParameters: {
    'limit': 20,
  });
  return response.data as Map<String, dynamic>;
}

@riverpod
Future<Map<String, dynamic>> ringkasanProduksi(
  RingkasanProduksiRef ref,
  int tahun,
) async {
  final dio = ref.watch(dioProvider);
  final response = await dio.get('/api/v1/produksi/ringkasan', queryParameters: {
    'tahun': tahun,
  });
  return response.data as Map<String, dynamic>;
}

@riverpod
Future<List<Map<String, dynamic>>> komoditas(KomoditasRef ref) async {
  final dio = ref.watch(dioProvider);
  final response = await dio.get('/api/v1/produksi/komoditas');
  return (response.data as List).cast<Map<String, dynamic>>();
}

@riverpod
Future<List<Map<String, dynamic>>> lahanSingkat(LahanSingkatRef ref) async {
  final dio = ref.watch(dioProvider);
  final response = await dio.get('/api/v1/lahan', queryParameters: {
    'limit': 100,
    'status': 'AKTIF',
  });
  final data = response.data['data'] as List? ?? [];
  return data.cast<Map<String, dynamic>>();
}

// ============================================================
// Notifier untuk tambah catatan panen
// ============================================================

@riverpod
class TambahPanenNotifier extends _$TambahPanenNotifier {
  @override
  AsyncValue<void> build() => const AsyncData(null);

  Future<void> tambah(Map<String, dynamic> data) async {
    state = const AsyncLoading();
    try {
      final dio = ref.read(dioProvider);
      await dio.post('/api/v1/produksi/catatan', data: data);
      state = const AsyncData(null);
      ref.invalidate(catatanPanenProvider);
      ref.invalidate(ringkasanProduksiProvider);
    } catch (e) {
      state = AsyncError(e, StackTrace.current);
      rethrow;
    }
  }
}
