import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../../core/network/api_client.dart';

part 'detail_kursus_page.g.dart';

// ============================================================
// DetailKursusPage — Detail Kursus + Daftar Modul
// ============================================================

@riverpod
Future<Map<String, dynamic>> detailKursus(
  DetailKursusRef ref,
  String id,
) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get('/edukasi/kursus/$id');
  return res.data['data'] as Map<String, dynamic>;
}

@riverpod
class DaftarKursusNotifier extends _$DaftarKursusNotifier {
  @override
  AsyncValue<void> build() => const AsyncValue.data(null);

  Future<void> daftar(String kursusId) async {
    state = const AsyncValue.loading();
    try {
      final dio = ref.read(dioProvider);
      await dio.post('/edukasi/kursus/$kursusId/daftar');
      state = const AsyncValue.data(null);
      ref.invalidate(detailKursusProvider(kursusId));
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

class DetailKursusPage extends ConsumerWidget {
  final String kursusId;
  const DetailKursusPage({super.key, required this.kursusId});

  static const _levelColor = {
    'PEMULA': Color(0xFF4CAF50),
    'MENENGAH': Color(0xFFFFC107),
    'LANJUTAN': Color(0xFFF44336),
  };

  static const _kategoriEmoji = {
    'DASAR': '🌱', 'TEKNIK': '🔧', 'BISNIS': '💼', 'KESEHATAN': '🍃',
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final kursusAsync = ref.watch(detailKursusProvider(kursusId));
    final daftarState = ref.watch(daftarKursusNotifierProvider);

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('Detail Kursus'),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: kursusAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Gagal memuat: $e')),
        data: (kursus) {
          final level = kursus['level'] as String? ?? 'PEMULA';
          final kategori = kursus['kategori'] as String? ?? 'DASAR';
          final modul = (kursus['modul'] as List?) ?? [];
          final progres = kursus['progres'] as Map<String, dynamic>?;
          final sudahDaftar = progres != null;

          return Stack(
            children: [
              SingleChildScrollView(
                padding: const EdgeInsets.only(bottom: 100),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header
                    Container(
                      color: Colors.white,
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Emoji + level
                          Row(
                            children: [
                              Container(
                                width: 64, height: 64,
                                decoration: BoxDecoration(
                                  color: Colors.green.shade50,
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                child: Center(
                                  child: Text(
                                    _kategoriEmoji[kategori] ?? '📚',
                                    style: const TextStyle(fontSize: 36),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: (_levelColor[level] ??
                                                Colors.grey)
                                            .withOpacity(0.15),
                                        borderRadius:
                                            BorderRadius.circular(10),
                                      ),
                                      child: Text(
                                        level,
                                        style: TextStyle(
                                            fontSize: 11,
                                            color: _levelColor[level] ??
                                                Colors.grey,
                                            fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      kursus['judul'] ?? '',
                                      style: const TextStyle(
                                          fontSize: 17,
                                          fontWeight: FontWeight.bold),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),

                          // Info row
                          Row(
                            children: [
                              _InfoChip('📖', '${modul.length} modul'),
                              const SizedBox(width: 8),
                              _InfoChip('⏱️',
                                  '${kursus['durasi_menit']} menit'),
                              if (sudahDaftar) ...[
                                const Spacer(),
                                Text(
                                  'Progres: ${progres['progres_persen'] ?? 0}%',
                                  style: TextStyle(
                                      color: Colors.green.shade700,
                                      fontWeight: FontWeight.w600,
                                      fontSize: 13),
                                ),
                              ],
                            ],
                          ),

                          if (sudahDaftar) ...[
                            const SizedBox(height: 8),
                            LinearProgressIndicator(
                              value: ((progres['progres_persen'] as num?) ??
                                      0) /
                                  100,
                              backgroundColor: Colors.grey.shade200,
                              valueColor: AlwaysStoppedAnimation(
                                  Colors.green.shade700),
                            ),
                          ],
                        ],
                      ),
                    ),

                    const SizedBox(height: 8),

                    // Deskripsi
                    if (kursus['deskripsi'] != null)
                      Container(
                        color: Colors.white,
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Tentang Kursus',
                                style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 15)),
                            const SizedBox(height: 8),
                            Text(kursus['deskripsi'],
                                style: TextStyle(
                                    color: Colors.grey.shade700,
                                    fontSize: 14,
                                    height: 1.5)),
                          ],
                        ),
                      ),

                    const SizedBox(height: 8),

                    // Daftar Modul
                    Container(
                      color: Colors.white,
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Daftar Modul',
                              style: TextStyle(
                                  fontWeight: FontWeight.bold, fontSize: 15)),
                          const SizedBox(height: 12),
                          ...modul.asMap().entries.map((e) {
                            final idx = e.key;
                            final m = e.value as Map<String, dynamic>;
                            final selesai =
                                m['selesai'] as bool? ?? false;
                            return ListTile(
                              contentPadding: EdgeInsets.zero,
                              leading: CircleAvatar(
                                radius: 16,
                                backgroundColor: selesai
                                    ? Colors.green.shade100
                                    : Colors.grey.shade100,
                                child: selesai
                                    ? Icon(Icons.check,
                                        size: 16,
                                        color: Colors.green.shade700)
                                    : Text('${idx + 1}',
                                        style: const TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold)),
                              ),
                              title: Text(m['judul'] ?? '',
                                  style: const TextStyle(fontSize: 14)),
                              subtitle: Text(
                                '${m['durasi_menit'] ?? 0} menit',
                                style: const TextStyle(fontSize: 12),
                              ),
                              trailing: Icon(
                                sudahDaftar
                                    ? Icons.play_circle_outline
                                    : Icons.lock_outline,
                                color: sudahDaftar
                                    ? Colors.green.shade700
                                    : Colors.grey,
                              ),
                            );
                          }),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),

              // Bottom CTA
              if (!sudahDaftar)
                Positioned(
                  bottom: 0, left: 0, right: 0,
                  child: Container(
                    padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
                    color: Colors.white,
                    child: SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: daftarState.isLoading
                            ? null
                            : () => ref
                                .read(
                                    daftarKursusNotifierProvider.notifier)
                                .daftar(kursusId),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green.shade700,
                          foregroundColor: Colors.white,
                          padding:
                              const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                        child: daftarState.isLoading
                            ? const SizedBox(
                                width: 20, height: 20,
                                child: CircularProgressIndicator(
                                    color: Colors.white, strokeWidth: 2))
                            : const Text('Ikuti Kursus Ini',
                                style: TextStyle(fontSize: 16)),
                      ),
                    ),
                  ),
                ),

              if (sudahDaftar)
                Positioned(
                  bottom: 0, left: 0, right: 0,
                  child: Container(
                    padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
                    color: Colors.white,
                    child: SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {},
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green.shade700,
                          foregroundColor: Colors.white,
                          padding:
                              const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text('Lanjutkan Belajar',
                            style: TextStyle(fontSize: 16)),
                      ),
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final String emoji;
  final String label;
  const _InfoChip(this.emoji, this.label);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.green.shade50,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text('$emoji $label',
          style: TextStyle(fontSize: 12, color: Colors.green.shade700)),
    );
  }
}
