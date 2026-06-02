import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../../core/network/api_client.dart';

part 'detail_postingan_page.g.dart';

// ============================================================
// DetailPostinganPage — Halaman Detail Postingan + Komentar
// ============================================================

@riverpod
Future<Map<String, dynamic>> detailPostingan(
  DetailPostinganRef ref,
  String id,
) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get('/komunitas/postingan/$id');
  return res.data['data'] as Map<String, dynamic>;
}

@riverpod
class KomentarNotifier extends _$KomentarNotifier {
  @override
  AsyncValue<void> build() => const AsyncValue.data(null);

  Future<void> kirimKomentar(String postinganId, String konten) async {
    state = const AsyncValue.loading();
    try {
      final dio = ref.read(dioProvider);
      await dio.post('/komunitas/postingan/$postinganId/komentar',
          data: {'konten': konten});
      state = const AsyncValue.data(null);
      ref.invalidate(detailPostinganProvider(postinganId));
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

class DetailPostinganPage extends ConsumerStatefulWidget {
  final String postinganId;
  const DetailPostinganPage({super.key, required this.postinganId});

  @override
  ConsumerState<DetailPostinganPage> createState() =>
      _DetailPostinganPageState();
}

class _DetailPostinganPageState extends ConsumerState<DetailPostinganPage> {
  final _komentarCtrl = TextEditingController();

  @override
  void dispose() {
    _komentarCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final postAsync =
        ref.watch(detailPostinganProvider(widget.postinganId));
    final komentarState = ref.watch(komentarNotifierProvider);

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('Postingan'),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: postAsync.when(
              loading: () =>
                  const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('Gagal memuat: $e')),
              data: (post) => SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Foto utama
                    if (post['foto_url'] != null)
                      Image.network(
                        post['foto_url'],
                        width: double.infinity,
                        height: 220,
                        fit: BoxFit.cover,
                      ),

                    // Konten
                    Container(
                      color: Colors.white,
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Penulis + waktu
                          Row(
                            children: [
                              CircleAvatar(
                                radius: 16,
                                backgroundColor: Colors.green.shade100,
                                child: Text(
                                  (post['penulis']?['nama_lengkap'] ??
                                      'P')[0],
                                  style: TextStyle(
                                      color: Colors.green.shade700,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      post['penulis']?['nama_lengkap'] ??
                                          '',
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w600,
                                          fontSize: 13),
                                    ),
                                    Text(
                                      _waktuRelatif(
                                          post['created_at'] as String?),
                                      style: TextStyle(
                                          fontSize: 11,
                                          color: Colors.grey.shade500),
                                    ),
                                  ],
                                ),
                              ),
                              _KategoriChip(
                                  kategori:
                                      post['kategori'] ?? 'UMUM'),
                            ],
                          ),
                          const SizedBox(height: 14),

                          // Judul
                          Text(
                            post['judul'] ?? '',
                            style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 12),

                          // Konten
                          Text(
                            post['konten'] ?? '',
                            style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey.shade800,
                                height: 1.6),
                          ),
                          const SizedBox(height: 16),

                          // Stats
                          Row(
                            children: [
                              Text(
                                '❤️ ${(post['_count']?['likes'] ?? 0)} suka',
                                style: TextStyle(
                                    fontSize: 13,
                                    color: Colors.grey.shade600),
                              ),
                              const SizedBox(width: 16),
                              Text(
                                '💬 ${(post['_count']?['komentar'] ?? 0)} komentar',
                                style: TextStyle(
                                    fontSize: 13,
                                    color: Colors.grey.shade600),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 8),

                    // Komentar
                    Container(
                      color: Colors.white,
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Komentar',
                              style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15)),
                          const SizedBox(height: 12),
                          ...((post['komentar'] as List?) ?? [])
                              .map((k) => _KomentarRow(
                                  data: k as Map<String, dynamic>)),
                          if (((post['komentar'] as List?) ?? []).isEmpty)
                            Center(
                              child: Padding(
                                padding:
                                    const EdgeInsets.symmetric(vertical: 8),
                                child: Text(
                                  'Belum ada komentar. Jadilah yang pertama!',
                                  style: TextStyle(
                                      color: Colors.grey.shade400,
                                      fontSize: 13),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 80),
                  ],
                ),
              ),
            ),
          ),

          // ── Input Komentar ───────────────────────────────
          Container(
            padding: EdgeInsets.only(
              left: 16, right: 8, top: 8,
              bottom: MediaQuery.of(context).viewInsets.bottom + 8,
            ),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Color(0xFFEEEEEE))),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _komentarCtrl,
                    decoration: InputDecoration(
                      hintText: 'Tulis komentar...',
                      filled: true,
                      fillColor: Colors.grey.shade100,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(20),
                        borderSide: BorderSide.none,
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 10),
                    ),
                    maxLines: 3,
                    minLines: 1,
                  ),
                ),
                const SizedBox(width: 4),
                IconButton(
                  icon: komentarState.isLoading
                      ? const SizedBox(
                          width: 20, height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2))
                      : const Icon(Icons.send_rounded),
                  color: const Color(0xFF2D7D32),
                  onPressed: komentarState.isLoading ? null : _kirimKomentar,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _kirimKomentar() {
    final konten = _komentarCtrl.text.trim();
    if (konten.isEmpty) return;
    ref.read(komentarNotifierProvider.notifier).kirimKomentar(
          widget.postinganId,
          konten,
        );
    _komentarCtrl.clear();
  }

  String _waktuRelatif(String? isoString) {
    if (isoString == null) return '';
    final dt = DateTime.tryParse(isoString);
    if (dt == null) return '';
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m lalu';
    if (diff.inHours < 24) return '${diff.inHours}j lalu';
    if (diff.inDays < 30) return '${diff.inDays}h lalu';
    return '${dt.day}/${dt.month}/${dt.year}';
  }
}

class _KomentarRow extends StatelessWidget {
  final Map<String, dynamic> data;
  const _KomentarRow({required this.data});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 14,
            backgroundColor: Colors.green.shade100,
            child: Text(
              (data['penulis']?['nama_lengkap'] ?? 'P')[0],
              style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: Colors.green.shade700),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(data['penulis']?['nama_lengkap'] ?? '',
                    style: const TextStyle(
                        fontWeight: FontWeight.w600, fontSize: 12)),
                const SizedBox(height: 2),
                Text(data['konten'] ?? '',
                    style: TextStyle(
                        fontSize: 13, color: Colors.grey.shade800)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _KategoriChip extends StatelessWidget {
  final String kategori;
  const _KategoriChip({required this.kategori});

  static const _colors = {
    'TIPS': Color(0xFFE3F2FD),
    'CERITA': Color(0xFFF3E5F5),
    'PERTANYAAN': Color(0xFFFFF9C4),
    'UMUM': Color(0xFFF5F5F5),
  };
  static const _textColors = {
    'TIPS': Color(0xFF1565C0),
    'CERITA': Color(0xFF6A1B9A),
    'PERTANYAAN': Color(0xFFF57F17),
    'UMUM': Color(0xFF616161),
  };

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: _colors[kategori] ?? Colors.grey.shade100,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        kategori,
        style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w600,
            color: _textColors[kategori] ?? Colors.grey.shade700),
      ),
    );
  }
}
