import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../../core/network/api_client.dart';

part 'marketplace_provider.g.dart';

// ============================================================
// Marketplace Providers — Riverpod
// ============================================================

@riverpod
Future<List<Map<String, dynamic>>> daftarProduk(
  DaftarProdukRef ref, {
  String sort = 'terbaru',
  String? kategori,
}) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get('/marketplace/produk', queryParameters: {
    'sort': sort,
    if (kategori != null) 'kategori': kategori,
    'limit': 30,
  });
  final items = res.data['data']['items'] as List;
  return items.cast<Map<String, dynamic>>();
}

@riverpod
Future<Map<String, dynamic>> detailProduk(
  DetailProdukRef ref,
  String id,
) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get('/marketplace/produk/$id');
  return res.data['data'] as Map<String, dynamic>;
}

@riverpod
Future<List<Map<String, dynamic>>> daftarPesananSaya(
  DaftarPesananSayaRef ref,
) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get('/marketplace/pesanan');
  final items = res.data['data']['items'] as List;
  return items.cast<Map<String, dynamic>>();
}

// Notifier untuk buat pesanan
@riverpod
class BuatPesananNotifier extends _$BuatPesananNotifier {
  @override
  AsyncValue<Map<String, dynamic>?> build() => const AsyncValue.data(null);

  Future<void> buatPesanan({
    required List<Map<String, dynamic>> items,
    required String alamatPengiriman,
    String? catatan,
  }) async {
    state = const AsyncValue.loading();
    try {
      final dio = ref.read(dioProvider);
      final res = await dio.post('/marketplace/pesanan', data: {
        'items': items,
        'alamat_pengiriman': alamatPengiriman,
        if (catatan != null) 'catatan': catatan,
      });
      state = AsyncValue.data(res.data['data'] as Map<String, dynamic>);
      ref.invalidate(daftarPesananSayaProvider);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<String?> bayarPesanan(String pesananId) async {
    try {
      final dio = ref.read(dioProvider);
      final res = await dio.post('/marketplace/pesanan/$pesananId/bayar');
      return res.data['data']['snap_token'] as String?;
    } catch (_) {
      return null;
    }
  }
}
