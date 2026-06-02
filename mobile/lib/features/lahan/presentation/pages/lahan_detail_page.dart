import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../../core/network/api_client.dart';

part 'lahan_detail_page.g.dart';

// ============================================================
// LahanDetailPage — Detail & Monitoring Lahan
// ============================================================

@riverpod
Future<Map<String, dynamic>> detailLahan(
  DetailLahanRef ref,
  String id,
) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get('/lahan/$id');
  return res.data['data'] as Map<String, dynamic>;
}

class LahanDetailPage extends ConsumerWidget {
  final String lahanId;
  const LahanDetailPage({super.key, required this.lahanId});

  static const _statusColor = {
    'AKTIF': Color(0xFF4CAF50),
    'DALAM_REVIEW': Color(0xFFFFC107),
    'DITOLAK': Color(0xFFF44336),
    'NONAKTIF': Color(0xFF9E9E9E),
  };

  static const _statusLabel = {
    'AKTIF': 'Aktif',
    'DALAM_REVIEW': 'Dalam Review',
    'DITOLAK': 'Ditolak',
    'NONAKTIF': 'Nonaktif',
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lahanAsync = ref.watch(detailLahanProvider(lahanId));
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('Detail Lahan'),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: lahanAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 12),
              Text('Gagal memuat: $e'),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () => ref.invalidate(detailLahanProvider(lahanId)),
                child: const Text('Coba Lagi'),
              ),
            ],
          ),
        ),
        data: (lahan) => SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Header ──────────────────────────────────
              Container(
                width: double.infinity,
                color: Colors.white,
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            lahan['nama_lahan'] ?? '',
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        _StatusBadge(
                          status: lahan['status'] as String? ?? 'DALAM_REVIEW',
                          statusColor: _statusColor,
                          statusLabel: _statusLabel,
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Icon(Icons.location_on_outlined,
                            size: 14, color: Colors.grey.shade500),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            '${lahan['kecamatan'] ?? ''}, ${lahan['kelurahan'] ?? ''}',
                            style: TextStyle(
                                color: Colors.grey.shade600, fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 8),

              // ── Statistik ────────────────────────────────
              Container(
                color: Colors.white,
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Statistik Lahan',
                        style: TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 15)),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _StatCard(
                            icon: '📐',
                            label: 'Luas',
                            value:
                                '${lahan['luas_m2'] ?? 0} m²',
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _StatCard(
                            icon: '🌱',
                            label: 'Komoditas',
                            value:
                                '${(lahan['komoditas'] as List?)?.length ?? 0} jenis',
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _StatCard(
                            icon: '🏆',
                            label: 'Panen',
                            value:
                                '${(lahan['catatan_panen'] as List?)?.length ?? 0}x',
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 8),

              // ── Komoditas ────────────────────────────────
              if ((lahan['komoditas'] as List?)?.isNotEmpty == true)
                Container(
                  color: Colors.white,
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Komoditas Ditanam',
                          style: TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 15)),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: ((lahan['komoditas'] as List?) ?? [])
                            .map((k) => Chip(
                                  label: Text(k['nama'] ?? '',
                                      style: const TextStyle(fontSize: 12)),
                                  backgroundColor:
                                      theme.colorScheme.primary.withOpacity(0.1),
                                  side: BorderSide.none,
                                ))
                            .toList(),
                      ),
                    ],
                  ),
                ),

              const SizedBox(height: 8),

              // ── Riwayat Panen ────────────────────────────
              Container(
                color: Colors.white,
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Riwayat Panen',
                            style: TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 15)),
                        TextButton(
                          onPressed: () =>
                              context.push('/produksi'),
                          child: const Text('Lihat Semua'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    ...((lahan['catatan_panen'] as List?) ?? [])
                        .take(3)
                        .map((p) => _PanenRow(data: p as Map<String, dynamic>)),
                    if (((lahan['catatan_panen'] as List?) ?? []).isEmpty)
                      Center(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          child: Text('Belum ada catatan panen',
                              style: TextStyle(color: Colors.grey.shade500)),
                        ),
                      ),
                  ],
                ),
              ),

              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;
  final Map<String, Color> statusColor;
  final Map<String, String> statusLabel;
  const _StatusBadge(
      {required this.status,
      required this.statusColor,
      required this.statusLabel});

  @override
  Widget build(BuildContext context) {
    final color = statusColor[status] ?? Colors.grey;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        statusLabel[status] ?? status,
        style: TextStyle(
            fontSize: 12, color: color, fontWeight: FontWeight.w600),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String icon;
  final String label;
  final String value;
  const _StatCard(
      {required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        children: [
          Text(icon, style: const TextStyle(fontSize: 24)),
          const SizedBox(height: 4),
          Text(value,
              style: const TextStyle(
                  fontWeight: FontWeight.bold, fontSize: 14)),
          Text(label,
              style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
        ],
      ),
    );
  }
}

class _PanenRow extends StatelessWidget {
  final Map<String, dynamic> data;
  const _PanenRow({required this.data});

  @override
  Widget build(BuildContext context) {
    final tgl = data['tanggal_panen'] as String?;
    final dt = tgl != null ? DateTime.tryParse(tgl) : null;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: Colors.green.shade50,
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Center(
                child: Text('🌾', style: TextStyle(fontSize: 18))),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(data['komoditas']?['nama'] ?? '',
                    style: const TextStyle(
                        fontWeight: FontWeight.w500, fontSize: 13)),
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
            '${data['berat_kg']} kg',
            style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 14,
                color: Color(0xFF2D7D32)),
          ),
        ],
      ),
    );
  }
}
