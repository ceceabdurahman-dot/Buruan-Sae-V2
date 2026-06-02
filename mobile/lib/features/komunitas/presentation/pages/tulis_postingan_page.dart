import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../../core/network/api_client.dart';

part 'tulis_postingan_page.g.dart';

// ============================================================
// TulisPostinganPage — Buat Postingan Komunitas Baru
// ============================================================

@riverpod
class TulisPostinganNotifier extends _$TulisPostinganNotifier {
  @override
  AsyncValue<Map<String, dynamic>?> build() => const AsyncValue.data(null);

  Future<void> simpan({
    required String judul,
    required String konten,
    required String kategori,
  }) async {
    state = const AsyncValue.loading();
    try {
      final dio = ref.read(dioProvider);
      final res = await dio.post('/komunitas/postingan', data: {
        'judul': judul,
        'konten': konten,
        'kategori': kategori,
      });
      state = AsyncValue.data(res.data['data'] as Map<String, dynamic>);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

class TulisPostinganPage extends ConsumerStatefulWidget {
  const TulisPostinganPage({super.key});

  @override
  ConsumerState<TulisPostinganPage> createState() =>
      _TulisPostinganPageState();
}

class _TulisPostinganPageState extends ConsumerState<TulisPostinganPage> {
  final _formKey = GlobalKey<FormState>();
  final _judulCtrl = TextEditingController();
  final _kontenCtrl = TextEditingController();
  String _kategori = 'UMUM';

  static const _kategoriOptions = ['UMUM', 'TIPS', 'CERITA', 'PERTANYAAN'];
  static const _kategoriEmoji = {
    'UMUM': '💬',
    'TIPS': '💡',
    'CERITA': '📖',
    'PERTANYAAN': '❓',
  };

  @override
  void dispose() {
    _judulCtrl.dispose();
    _kontenCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(tulisPostinganNotifierProvider);

    ref.listen(tulisPostinganNotifierProvider, (_, next) {
      if (next.hasValue && next.value != null) {
        context.pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Postingan berhasil diterbitkan!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    });

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Tulis Postingan'),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.pop(),
        ),
        actions: [
          TextButton(
            onPressed: state.isLoading ? null : _submit,
            child: state.isLoading
                ? const SizedBox(
                    width: 18, height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Terbitkan',
                    style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Kategori
              const Text('Kategori',
                  style: TextStyle(
                      fontWeight: FontWeight.w600, fontSize: 13)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: _kategoriOptions.map((k) {
                  final selected = _kategori == k;
                  return ChoiceChip(
                    label: Text(
                        '${_kategoriEmoji[k]} $k',
                        style: TextStyle(
                          fontSize: 12,
                          color: selected ? Colors.white : null,
                        )),
                    selected: selected,
                    selectedColor: const Color(0xFF2D7D32),
                    onSelected: (_) => setState(() => _kategori = k),
                  );
                }).toList(),
              ),
              const SizedBox(height: 20),

              // Judul
              TextFormField(
                controller: _judulCtrl,
                decoration: const InputDecoration(
                  labelText: 'Judul Postingan',
                  hintText: 'Tulis judul yang menarik...',
                  border: OutlineInputBorder(),
                ),
                maxLength: 150,
                validator: (v) =>
                    (v == null || v.trim().isEmpty)
                        ? 'Judul wajib diisi'
                        : null,
              ),
              const SizedBox(height: 16),

              // Konten
              TextFormField(
                controller: _kontenCtrl,
                decoration: const InputDecoration(
                  labelText: 'Isi Postingan',
                  hintText: 'Bagikan pengalaman, tips, atau pertanyaan Anda...',
                  border: OutlineInputBorder(),
                  alignLabelWithHint: true,
                ),
                maxLines: 12,
                minLines: 6,
                validator: (v) =>
                    (v == null || v.trim().length < 10)
                        ? 'Konten minimal 10 karakter'
                        : null,
              ),

              if (state.hasError)
                Padding(
                  padding: const EdgeInsets.only(top: 12),
                  child: Text(
                    'Gagal: ${state.error}',
                    style: const TextStyle(color: Colors.red, fontSize: 13),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    ref.read(tulisPostinganNotifierProvider.notifier).simpan(
          judul: _judulCtrl.text.trim(),
          konten: _kontenCtrl.text.trim(),
          kategori: _kategori,
        );
  }
}
