import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../../core/network/api_client.dart';

part 'komunitas_page.g.dart';

// ============================================================
// KomunitasPage — Forum Petani Buruan Sae 2.0
// ============================================================

@riverpod
Future<List<Map<String, dynamic>>> daftarPostingan(
  DaftarPostinganRef ref, {
  String sort = 'terbaru',
}) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get('/komunitas/postingan', queryParameters: {
    'sort': sort,
    'limit': 20,
  });
  final items = res.data['data']['items'] as List;
  return items.cast<Map<String, dynamic>>();
}

class KomunitasPage extends ConsumerStatefulWidget {
  const KomunitasPage({super.key});

  @override
  ConsumerState<KomunitasPage> createState() => _KomunitasPageState();
}

class _KomunitasPageState extends ConsumerState<KomunitasPage> {
  String _sort = 'terbaru';

  @override
  Widget build(BuildContext context) {
    final postinganAsync = ref.watch(daftarPostinganProvider(sort: _sort));

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('Komunitas'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline),
            onPressed: () => context.push('/komunitas/tulis'),
            tooltip: 'Buat Postingan',
          ),
        ],
      ),
      body: Column(
        children: [
          // Sort bar
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(
              children: [
                _SortChip(label: 'Terbaru', value: 'terbaru', selected: _sort,
                  onTap: (v) => setState(() => _sort = v)),
                const SizedBox(width: 8),
                _SortChip(label: 'Terpopuler', value: 'terpopuler', selected: _sort,
                  onTap: (v) => setState(() => _sort = v)),
              ],
            ),
          ),

          Expanded(
            child: postinganAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('Gagal memuat: $e')),
              data: (postingan) => postingan.isEmpty
                  ? const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text('💬', style: TextStyle(fontSize: 48)),
                          SizedBox(height: 12),
                          Text('Belum ada postingan',
                            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                          Text('Jadilah yang pertama berbagi!',
                            style: TextStyle(color: Colors.grey, fontSize: 13)),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: () async =>
                        ref.invalidate(daftarPostinganProvider),
                      child: ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: postingan.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (_, i) => _PostinganCard(data: postingan[i]),
                      ),
                    ),
            ),
          ),
        ],
      ),

      // FAB tulis postingan
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/komunitas/tulis'),
        icon: const Icon(Icons.edit_outlined),
        label: const Text('Tulis'),
        backgroundColor: const Color(0xFF2D7D32),
        foregroundColor: Colors.white,
      ),
    );
  }
}

class _SortChip extends StatelessWidget {
  final String label, value, selected;
  final void Function(String) onTap;
  const _SortChip({required this.label, required this.value, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final active = selected == value;
    return GestureDetector(
      onTap: () => onTap(value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: active ? const Color(0xFF2D7D32) : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: active ? Colors.white : Colors.grey.shade700,
            fontWeight: active ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
      ),
    );
  }
}

class _PostinganCard extends StatelessWidget {
  final Map<String, dynamic> data;
  const _PostinganCard({required this.data});

  @override
  Widget build(BuildContext context) {
    final count = data['_count'] as Map<String, dynamic>? ?? {};

    return GestureDetector(
      onTap: () => context.push('/komunitas/${data['id']}'),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 6)],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (data['foto_url'] != null)
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
                child: Image.network(
                  data['foto_url'],
                  height: 160,
                  width: double.infinity,
                  fit: BoxFit.cover,
                ),
              ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Kategori + waktu
                  Row(
                    children: [
                      _KategoriChip(kategori: data['kategori'] ?? 'UMUM'),
                      const Spacer(),
                      Text(
                        _waktuRelatif(data['created_at']),
                        style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Judul
                  Text(
                    data['judul'] ?? '',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),

                  // Cuplikan konten
                  Text(
                    data['konten'] ?? '',
                    style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 10),

                  // Footer: penulis + stats
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 12,
                        backgroundColor: Colors.green.shade100,
                        child: Text(
                          (data['penulis']?['nama_lengkap'] ?? 'P')[0],
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold,
                            color: Color(0xFF2D7D32)),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        data['penulis']?['nama_lengkap'] ?? '',
                        style: TextStyle(fontSize: 12, color: Colors.grey.shade700,
                          fontWeight: FontWeight.w500),
                      ),
                      const Spacer(),
                      _StatChip(icon: '❤️', count: count['likes'] ?? 0),
                      const SizedBox(width: 8),
                      _StatChip(icon: '💬', count: count['komentar'] ?? 0),
                      const SizedBox(width: 8),
                      _StatChip(icon: '👁️', count: data['view_count'] ?? 0),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
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
          color: _textColors[kategori] ?? Colors.grey.shade700,
        ),
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  final String icon;
  final int count;
  const _StatChip({required this.icon, required this.count});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(icon, style: const TextStyle(fontSize: 12)),
        const SizedBox(width: 2),
        Text('$count', style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
      ],
    );
  }
}
