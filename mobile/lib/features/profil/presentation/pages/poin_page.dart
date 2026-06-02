import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../../core/network/api_client.dart';
import '../../../auth/data/providers/auth_provider.dart';

part 'poin_page.g.dart';

// ============================================================
// PoinPage — Riwayat & Total Poin Pengguna
// ============================================================

@riverpod
Future<List<Map<String, dynamic>>> riwayatPoin(
  RiwayatPoinRef ref,
) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get('/pengguna/poin/riwayat');
  final items = res.data['data']['items'] as List;
  return items.cast<Map<String, dynamic>>();
}

class PoinPage extends ConsumerWidget {
  const PoinPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateNotifierProvider);
    final riwayatAsync = ref.watch(riwayatPoinProvider);

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('Poin Saya'),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: Column(
        children: [
          // Total poin header
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.amber.shade400, Colors.amber.shade600],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Column(
              children: [
                const Text('⭐', style: TextStyle(fontSize: 48)),
                const SizedBox(height: 8),
                Text(
                  '${authState.totalPoin ?? 0}',
                  style: const TextStyle(
                    fontSize: 48,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const Text('Total Poin',
                    style: TextStyle(color: Colors.white, fontSize: 14)),
              ],
            ),
          ),

          // Info cara mendapat poin
          Container(
            color: Colors.white,
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: const [
                _CaraPoin(emoji: '🌾', label: 'Catat Panen', poin: '+10'),
                _CaraPoin(emoji: '📖', label: 'Selesai Kursus', poin: '+50'),
                _CaraPoin(emoji: '💬', label: 'Buat Postingan', poin: '+5'),
              ],
            ),
          ),

          const Divider(height: 1),

          // Riwayat
          Expanded(
            child: riwayatAsync.when(
              loading: () =>
                  const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('Gagal memuat: $e')),
              data: (riwayat) => riwayat.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text('⭐',
                              style: TextStyle(fontSize: 48)),
                          const SizedBox(height: 12),
                          Text('Belum ada riwayat poin',
                              style: TextStyle(
                                  color: Colors.grey.shade600,
                                  fontSize: 16)),
                          const SizedBox(height: 4),
                          Text(
                            'Mulai aktivitas untuk mendapatkan poin!',
                            style: TextStyle(color: Colors.grey.shade400,
                                fontSize: 13),
                          ),
                        ],
                      ),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: riwayat.length,
                      separatorBuilder: (_, __) =>
                          const SizedBox(height: 8),
                      itemBuilder: (_, i) =>
                          _PoinRow(data: riwayat[i]),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CaraPoin extends StatelessWidget {
  final String emoji;
  final String label;
  final String poin;
  const _CaraPoin(
      {required this.emoji, required this.label, required this.poin});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(emoji, style: const TextStyle(fontSize: 24)),
        const SizedBox(height: 4),
        Text(label,
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500)),
        Text(poin,
            style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: Colors.amber)),
      ],
    );
  }
}

class _PoinRow extends StatelessWidget {
  final Map<String, dynamic> data;
  const _PoinRow({required this.data});

  @override
  Widget build(BuildContext context) {
    final jumlah = data['jumlah'] as int? ?? 0;
    final tgl = data['created_at'] as String?;
    final dt = tgl != null ? DateTime.tryParse(tgl) : null;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Row(
        children: [
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(
              color: Colors.amber.shade50,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Center(
                child: Text('⭐', style: TextStyle(fontSize: 20))),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  data['keterangan'] ?? '',
                  style: const TextStyle(fontWeight: FontWeight.w500,
                      fontSize: 14),
                ),
                if (dt != null)
                  Text(
                    '${dt.day}/${dt.month}/${dt.year}',
                    style: TextStyle(
                        fontSize: 11, color: Colors.grey.shade500),
                  ),
              ],
            ),
          ),
          Text(
            '${jumlah > 0 ? '+' : ''}$jumlah',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: jumlah > 0
                  ? Colors.amber.shade700
                  : Colors.red.shade600,
            ),
          ),
        ],
      ),
    );
  }
}
