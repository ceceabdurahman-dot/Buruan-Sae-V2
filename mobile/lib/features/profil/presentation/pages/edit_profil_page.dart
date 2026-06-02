import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../../core/network/api_client.dart';
import '../../../auth/data/providers/auth_provider.dart';

part 'edit_profil_page.g.dart';

// ============================================================
// EditProfilPage — Edit Data Profil Pengguna
// ============================================================

@riverpod
class EditProfilNotifier extends _$EditProfilNotifier {
  @override
  AsyncValue<void> build() => const AsyncValue.data(null);

  Future<void> simpan({
    required String namaLengkap,
    required String email,
    required String nomorWa,
  }) async {
    state = const AsyncValue.loading();
    try {
      final dio = ref.read(dioProvider);
      await dio.patch('/pengguna/profil', data: {
        'nama_lengkap': namaLengkap,
        'email': email,
        'nomor_wa': nomorWa,
      });
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

class EditProfilPage extends ConsumerStatefulWidget {
  const EditProfilPage({super.key});

  @override
  ConsumerState<EditProfilPage> createState() => _EditProfilPageState();
}

class _EditProfilPageState extends ConsumerState<EditProfilPage> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _namaCtrl;
  late final TextEditingController _emailCtrl;
  late final TextEditingController _waCtrl;

  @override
  void initState() {
    super.initState();
    final auth = ref.read(authStateNotifierProvider);
    _namaCtrl = TextEditingController(text: auth.namaLengkap ?? '');
    _emailCtrl = TextEditingController();
    _waCtrl = TextEditingController();
  }

  @override
  void dispose() {
    _namaCtrl.dispose();
    _emailCtrl.dispose();
    _waCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(editProfilNotifierProvider);

    ref.listen(editProfilNotifierProvider, (_, next) {
      if (next.hasValue && !next.isLoading) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profil berhasil diperbarui'),
            backgroundColor: Colors.green,
          ),
        );
        context.pop();
      }
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Profil'),
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
              TextFormField(
                controller: _namaCtrl,
                decoration: const InputDecoration(
                  labelText: 'Nama Lengkap',
                  prefixIcon: Icon(Icons.person_outline),
                  border: OutlineInputBorder(),
                ),
                validator: (v) =>
                    (v == null || v.trim().isEmpty) ? 'Nama wajib diisi' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _emailCtrl,
                decoration: const InputDecoration(
                  labelText: 'Email',
                  prefixIcon: Icon(Icons.email_outlined),
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _waCtrl,
                decoration: const InputDecoration(
                  labelText: 'Nomor WhatsApp',
                  prefixIcon: Icon(Icons.phone_outlined),
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.phone,
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
                      : const Text('Simpan Perubahan'),
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
    ref.read(editProfilNotifierProvider.notifier).simpan(
          namaLengkap: _namaCtrl.text.trim(),
          email: _emailCtrl.text.trim(),
          nomorWa: _waCtrl.text.trim(),
        );
  }
}
