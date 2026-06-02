import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/providers/auth_provider.dart';

// ============================================================
// RegisterPage — Halaman Pendaftaran Akun Buruan Sae 2.0
// ============================================================

class RegisterPage extends ConsumerStatefulWidget {
  const RegisterPage({super.key});

  @override
  ConsumerState<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends ConsumerState<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _nikCtrl = TextEditingController();
  final _namaCtrl = TextEditingController();
  final _waCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _showPassword = false;
  bool _consentDiberikan = false;
  String _peran = 'PETANI';

  static const _peranOptions = [
    ('PETANI', 'Petani / Berkebun'),
    ('KONSUMEN', 'Konsumen'),
    ('UMKM', 'UMKM / Pedagang'),
    ('PENGELOLA_WISATA', 'Pengelola Wisata'),
  ];

  @override
  void dispose() {
    _nikCtrl.dispose();
    _namaCtrl.dispose();
    _waCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (!_consentDiberikan) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Anda harus menyetujui kebijakan privasi untuk mendaftar'),
        backgroundColor: Colors.orange,
      ));
      return;
    }

    await ref.read(authStateNotifierProvider.notifier).register(
      nik: _nikCtrl.text.trim(),
      namaLengkap: _namaCtrl.text.trim(),
      nomorWa: _waCtrl.text.trim(),
      password: _passwordCtrl.text,
      peran: _peran,
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateNotifierProvider);
    final theme = Theme.of(context);

    ref.listen(authStateNotifierProvider, (prev, next) {
      if (next.errorMessage != null && next.errorMessage != prev?.errorMessage) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(next.errorMessage!),
          backgroundColor: Colors.red.shade700,
          behavior: SnackBarBehavior.floating,
        ));
      }
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text('Daftar Akun'),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ── NIK ──────────────────────────────────────
              TextFormField(
                controller: _nikCtrl,
                keyboardType: TextInputType.number,
                maxLength: 16,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(
                  labelText: 'NIK (16 digit)',
                  hintText: 'Nomor Induk Kependudukan',
                  prefixIcon: Icon(Icons.badge_outlined),
                  counterText: '',
                ),
                validator: (val) {
                  if (val == null || val.isEmpty) return 'NIK wajib diisi';
                  if (!RegExp(r'^\d{16}$').hasMatch(val)) return 'NIK harus 16 digit angka';
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // ── Nama ──────────────────────────────────────
              TextFormField(
                controller: _namaCtrl,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(
                  labelText: 'Nama Lengkap',
                  prefixIcon: Icon(Icons.person_outline),
                ),
                validator: (val) {
                  if (val == null || val.trim().length < 3) return 'Nama minimal 3 karakter';
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // ── Nomor WA ──────────────────────────────────
              TextFormField(
                controller: _waCtrl,
                keyboardType: TextInputType.phone,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(
                  labelText: 'Nomor WhatsApp',
                  hintText: '08xxxxxxxxxx',
                  prefixIcon: Icon(Icons.phone_outlined),
                ),
                validator: (val) {
                  if (val == null || val.isEmpty) return 'Nomor WA wajib diisi';
                  if (!RegExp(r'^08\d{8,11}$').hasMatch(val.trim())) {
                    return 'Format: 08xxxxxxxxxx (10-13 digit)';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // ── Password ──────────────────────────────────
              TextFormField(
                controller: _passwordCtrl,
                obscureText: !_showPassword,
                textInputAction: TextInputAction.done,
                decoration: InputDecoration(
                  labelText: 'Password',
                  hintText: 'Min 8 karakter, huruf besar & angka',
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    icon: Icon(_showPassword ? Icons.visibility_off : Icons.visibility, size: 20),
                    onPressed: () => setState(() => _showPassword = !_showPassword),
                  ),
                ),
                validator: (val) {
                  if (val == null || val.length < 8) return 'Password minimal 8 karakter';
                  if (!val.contains(RegExp(r'[A-Z]'))) return 'Harus ada huruf kapital';
                  if (!val.contains(RegExp(r'[0-9]'))) return 'Harus ada angka';
                  return null;
                },
              ),
              const SizedBox(height: 20),

              // ── Peran ─────────────────────────────────────
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Saya adalah:', style: Theme.of(context).textTheme.labelLarge),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _peranOptions.map((opt) {
                      final selected = _peran == opt.$1;
                      return ChoiceChip(
                        label: Text(opt.$2),
                        selected: selected,
                        onSelected: (_) => setState(() => _peran = opt.$1),
                        selectedColor: theme.colorScheme.primary.withOpacity(0.15),
                        labelStyle: TextStyle(
                          color: selected ? theme.colorScheme.primary : Colors.grey.shade700,
                          fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                          fontSize: 13,
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // ── Consent ───────────────────────────────────
              InkWell(
                onTap: () => setState(() => _consentDiberikan = !_consentDiberikan),
                borderRadius: BorderRadius.circular(8),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Checkbox(
                        value: _consentDiberikan,
                        onChanged: (v) => setState(() => _consentDiberikan = v ?? false),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(top: 12),
                          child: RichText(
                            text: TextSpan(
                              style: TextStyle(fontSize: 13, color: Colors.grey.shade700),
                              children: [
                                const TextSpan(text: 'Saya menyetujui '),
                                TextSpan(
                                  text: 'Kebijakan Privasi',
                                  style: TextStyle(
                                    color: theme.colorScheme.primary,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const TextSpan(text: ' dan penggunaan data sesuai UU PDP No. 27/2022'),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // ── Tombol Daftar ─────────────────────────────
              FilledButton(
                onPressed: authState.isLoading ? null : _submit,
                style: FilledButton.styleFrom(
                  minimumSize: const Size.fromHeight(48),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: authState.isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Daftar', style: TextStyle(fontSize: 15)),
              ),
              const SizedBox(height: 16),

              Center(
                child: TextButton(
                  onPressed: () => context.pop(),
                  child: Text(
                    'Sudah punya akun? Masuk',
                    style: TextStyle(fontSize: 13, color: theme.colorScheme.primary),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
