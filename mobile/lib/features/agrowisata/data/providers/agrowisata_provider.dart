import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../../core/network/api_client.dart';

part 'agrowisata_provider.g.dart';

// ============================================================
// Agrowisata Providers — Riverpod
// ============================================================

@riverpod
Future<List<Map<String, dynamic>>> daftarPaketWisata(
  DaftarPaketWisataRef ref, {
  String? status,
}) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get('/agrowisata/paket', queryParameters: {
    if (status != null) 'status': status,
    'limit': 20,
  });
  final items = res.data['data']['items'] as List;
  return items.cast<Map<String, dynamic>>();
}

@riverpod
Future<Map<String, dynamic>> detailPaketWisata(
  DetailPaketWisataRef ref,
  String id,
) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get('/agrowisata/paket/$id');
  return res.data['data'] as Map<String, dynamic>;
}

@riverpod
Future<List<Map<String, dynamic>>> daftarBookingSaya(
  DaftarBookingSayaRef ref,
) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get('/agrowisata/booking');
  final items = res.data['data']['items'] as List;
  return items.cast<Map<String, dynamic>>();
}

// Notifier untuk buat booking
@riverpod
class BuatBookingNotifier extends _$BuatBookingNotifier {
  @override
  AsyncValue<Map<String, dynamic>?> build() => const AsyncValue.data(null);

  Future<void> buatBooking({
    required String paketId,
    required String tanggalKunjungan,
    required int jumlahPeserta,
    String? catatan,
  }) async {
    state = const AsyncValue.loading();
    try {
      final dio = ref.read(dioProvider);
      final res = await dio.post('/agrowisata/booking', data: {
        'paket_id': paketId,
        'tanggal_kunjungan': tanggalKunjungan,
        'jumlah_peserta': jumlahPeserta,
        if (catatan != null) 'catatan': catatan,
      });
      state = AsyncValue.data(res.data['data'] as Map<String, dynamic>);
      ref.invalidate(daftarBookingSayaProvider);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<String?> bayarBooking(String bookingId) async {
    try {
      final dio = ref.read(dioProvider);
      final res = await dio.post('/agrowisata/booking/$bookingId/bayar');
      return res.data['data']['snap_token'] as String?;
    } catch (_) {
      return null;
    }
  }
}
