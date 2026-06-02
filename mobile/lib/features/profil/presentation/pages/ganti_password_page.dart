import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../../core/network/api_client.dart';

part 'ganti_password_page.g.dart';

// ============================================================
// GantiPasswordPage — Ubah Password Pengguna
// ============================================================

@riverpod
class GantiPasswordNotifier extends _$GantiPasswordNotifier {
  @override
  AsyncValue<void> build() => const AsyncValue.data(null);

  Future<void> ganti({
    required String passwordLama,
    required String passwordBaru,
  }) async {
    state = const AsyncValue.loading();
    try {
      final dio = ref.read(dioProvider);
      await dio.patch('/pengguna/ganti-password', data: {
        'password_lama': passwordLama,
        'password_baru': passwordBaru,
      });
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

class GantiPasswordPage extends ConsumerStatefulWidget {
  const GantiPasswordPage({super.key});

  @override
  ConsumerState<GantiPasswordPage> createState() =>
      _GantiPasswordPageState();
}

class _GantiPasswordPageState extends ConsumerState<GantiPasswordPage> {
  final _formKey = GlobalKey<FormState>();
  final _lamaCtrl = TextEditingController();
  final _baruCtrl = TextEditingController();
  final _konfirmasiCtrl = TextEditingController();
  bool _showLama = false;
  bool _showBaru = false;
  bool _showKonfirmasi = false;

  @override
  void dispose() {
    _lamaCtrl.dispose();
    _baruCtrl.dispose();
    _konfirmasiCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(gantiPasswordNotifierProvider);

    ref.listen(gantiPasswordNotifierProvider, (_, next) {
      if (next.hasValue && !next.isLoading) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Password berhasil diubah'),
            backgroundColor: Colors.green,
          ),
        );
        context.pop();
      }
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text('Ubah Password'),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              _PasswordField(
                controller: _lamaCtrl,
                label: 'Password Lama',
                show: _showLama,
                onToggle: () => setState(() => _showLama = !_showLama),
                validator: (v) => (v == null || v.isEmpty)
                    ? 'Password lama wajib diisi'
                    : null,
              ),
              const SizedBox(height: 16),
              _PasswordField(
                controller: _baruCtrl,
                label: 'Password Baru',
                show: _showBaru,
                onToggle: () => setState(() => _showBaru = !_showBaru),
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Password baru wajib diisi';
                  if (v.length < 8) return 'Minimal 8 karakter';
                  if (!v.contains(RegExp(r'[A-Z]')))
                    return 'Harus ada huruf kapital';
                  if (!v.contains(RegExp(r'[0-9]'))) return 'Harus ada angka';
                  return null;
                },
              ),
              const SizedBox(height: 16),
              _PasswordField(
                controller: _konfirmasiCtrl,
                label: 'Konfirmasi Password Baru',
                show: _showKonfirmasi,
                onToggle: () =>
                    setState(() => _showKonfirmasi = !_showKonfirmasi),
                validator: (v) => v != _baruCtrl.text
                    ? 'Password tidak cocok'
                    : null,
              ),
              const SizedBox(height: 8),

              // Syarat password
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text('Syarat password:',
                        style: TextStyle(
                            fontWeight: FontWeight.w600, fontSize: 12)),
                    SizedBox(height: 4),
                    Text('• Minimal 8 karakter',
                        style: TextStyle(fontSize: 12)),
                    Text('• Minimal 1 huruf kapital',
                        style: TextStyle(fontSize: 12)),
                    Text('• Minimal 1 angka',
                        style: TextStyle(fontSize: 12)),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              if (state.hasError)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Text('${state.error}',
                      style: const TextStyle(color: Colors.red, fontSize: 13)),
                ),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: state.isLoading ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green.shade700,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                  ),
                  child: state.isLoading
                      ? const SizedBox(
                          width: 20, height: 20,
                          child: CircularProgressIndicator(
                              color: Colors.white, strokeWidth: 2))
                      : const Text('Ubah Password'),
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
    ref.read(gantiPasswordNotifierProvider.notifier).ganti(
          passwordLama: _lamaCtrl.text,
          passwordBaru: _baruCtrl.text,
        );
  }
}

class _PasswordField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final bool show;
  final VoidCallback onToggle;
  final String? Function(String?)? validator;

  const _PasswordField({
    required this.controller,
    required this.label,
    required this.show,
    required this.onToggle,
    this.validator,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      obscureText: !show,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: const Icon(Icons.lock_outline),
        suffixIcon: IconButton(
          icon: Icon(show ? Icons.visibility_off : Icons.visibility),
          onPressed: onToggle,
        ),
        border: const OutlineInputBorder(),
      ),
      validator: validator,
    );
  }
}
