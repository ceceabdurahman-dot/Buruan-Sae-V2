import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../../core/network/api_client.dart';

part 'edukasi_page.g.dart';

// ============================================================
// EdukasiPage — Kursus & Materi Belajar Buruan Sae 2.0
// ============================================================

@riverpod
Future<List<Map<String, dynamic>>> daftarKursus(
  DaftarKursusRef ref, {
  String? kategori,
  String? level,
}) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get('/edukasi/kursus', queryParameters: {
    if (kategori != null) 'kategori': kategori,
    if (level != null) 'level': level,
    'limit': 30,
  });
  final items = res.data['data']['items'] as List;
  return items.cast<Map<String, dynamic>>();
}

class EdukasiPage extends ConsumerStatefulWidget {
  const EdukasiPage({super.key});

  @override
  ConsumerState<EdukasiPage> createState() => _EdukasiPageState();
}

class _EdukasiPageState extends ConsumerState<EdukasiPage> {
  String? _kategori;
  String? _level;

  static const _kategoriOptions = ['DASAR', 'TEKNIK', 'BISNIS', 'KESEHATAN'];
  static const _levelOptions = ['PEMULA', 'MENENGAH', 'LANJUTAN'];

  static const _kategoriEmoji = {
    'DASAR': '🌱', 'TEKNIK': '🔧', 'BISNIS': '💼', 'KESEHATAN': '🍃',
  };

  static const _levelColor = {
    'PEMULA': Color(0xFF4CAF50),
    'MENENGAH': Color(0xFFFFC107),
    'LANJUTAN': Color(0xFFF44336),
  };

  @override
  Widget build(BuildContext context) {
    final kursusAsync = ref.watch(daftarKursusProvider(
      kategori: _kategori, level: _level));

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(title: const Text('Edukasi'), centerTitle: true),
      body: Column(
        children: [
          // ── Filter Bar ────────────────────────────────────
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Kategori
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _FilterChip(label: 'Semua', selected: _kategori == null,
                        onTap: () => setState(() => _kategori = null)),
                      ..._kategoriOptions.map((k) => Padding(
                        padding: const EdgeInsets.only(left: 6),
                        child: _FilterChip(
                          label: '${_kategoriEmoji[k]} $k',
                          selected: _kategori == k,
                          onTap: () => setState(() => _kategori = k == _kategori ? null : k),
                        ),
                      )),
                    ],
                  ),
                ),
                const SizedBox(height: 6),
                // Level
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _FilterChip(label: 'Semua Level', selected: _level == null,
                        onTap: () => setState(() => _level = null)),
                      ..._levelOptions.map((l) => Padding(
                        padding: const EdgeInsets.only(left: 6),
                        child: _FilterChip(
                          label: l,
                          selected: _level == l,
                          selectedColor: _levelColor[l],
                          onTap: () => setState(() => _level = l == _level ? null : l),
                        ),
                      )),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // ── Daftar Kursus ─────────────────────────────────
          Expanded(
            child: kursusAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('Gagal memuat: $e')),
              data: (kursus) => kursus.isEmpty
                  ? const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text('📚', style: TextStyle(fontSize: 48)),
                          SizedBox(height: 12),
                          Text('Belum ada kursus tersedia',
                            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                        ],
                      ),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: kursus.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (_, i) => _KursusCard(data: kursus[i]),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final Color? selectedColor;
  final VoidCallback onTap;
  const _FilterChip({required this.label, required this.selected,
    this.selectedColor, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final color = selectedColor ?? const Color(0xFF2D7D32);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
        decoration: BoxDecoration(
          color: selected ? color.withOpacity(0.15) : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: selected ? color : Colors.transparent),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: selected ? color : Colors.grey.shade700,
            fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
      ),
    );
  }
}

class _KursusCard extends StatelessWidget {
  final Map<String, dynamic> data;
  const _KursusCard({required this.data});

  static const _levelColors = {
    'PEMULA': Color(0xFF4CAF50),
    'MENENGAH': Color(0xFFFFC107),
    'LANJUTAN': Color(0xFFF44336),
  };

  static const _kategoriEmoji = {
    'DASAR': '🌱', 'TEKNIK': '🔧', 'BISNIS': '💼', 'KESEHATAN': '🍃',
  };

  @override
  Widget build(BuildContext context) {
    final level = data['level'] as String? ?? 'PEMULA';
    final kategori = data['kategori'] as String? ?? 'DASAR';
    final count = data['_count'] as Map<String, dynamic>? ?? {};
    final levelColor = _levelColors[level] ?? Colors.grey;

    return GestureDetector(
      onTap: () => context.push('/edukasi/${data['id']}'),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 6)],
        ),
        child: Row(
          children: [
            // Thumbnail
            Container(
              width: 90,
              height: 90,
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                borderRadius: const BorderRadius.horizontal(left: Radius.circular(14)),
              ),
              child: Center(
                child: Text(
                  _kategoriEmoji[kategori] ?? '📚',
                  style: const TextStyle(fontSize: 36),
                ),
              ),
            ),

            // Info
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: levelColor.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            level,
                            style: TextStyle(fontSize: 10, color: levelColor,
                              fontWeight: FontWeight.bold),
                          ),
                        ),
                        const Spacer(),
                        if (data['is_published'] == false)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade100,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Text('Draft', style: TextStyle(fontSize: 10, color: Colors.grey)),
                          ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      data['judul'] ?? '',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Text(
                          '📖 ${count['modul'] ?? 0} modul',
                          style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '⏱️ ${data['durasi_menit']} menit',
                          style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                        ),
                        const Spacer(),
                        Text(
                          '${count['progres'] ?? 0} peserta',
                          style: TextStyle(fontSize: 10, color: Colors.grey.shade400),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // Arrow
            Padding(
              padding: const EdgeInsets.only(right: 10),
              child: Icon(Icons.chevron_right, color: Colors.grey.shade400),
            ),
          ],
        ),
      ),
    );
  }
}
