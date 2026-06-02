import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/providers/auth_provider.dart';

// ============================================================
// LoginPage — Halaman Login Buruan Sae 2.0
// ============================================================

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _identifierCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _showPassword = false;

  @override
  void dispose() {
    _identifierCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  // Validasi: email atau nomor WA (08xx)
  String? _validateIdentifier(String? val) {
    if (val == null || val.trim().isEmpty) return 'tidak boleh kosong';
    final isEmail = RegExp(r'^[\w.-]+@[\w.-]+\.\w+$').hasMatch(val.trim());
    final isWa = RegExp(r'^08\d{8,11}$').hasMatch(val.trim());
    if (!isEmail && !isWa) return 'Masukkan email atau nomor WhatsApp yang valid';
    return null;
  }

  String? _validatePassword(String? val) {
    if (val == null || val.trim().isEmpty) return 'Password tidak boleh kosong';
    return null;
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    await ref.read(authStateNotifierProvider.notifier).loginWithPassword(
      identifier: _identifierCtrl.text.trim(),
      password: _passwordCtrl.text,
    );

    // Navigasi ditangani oleh router redirect berdasarkan AuthState
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateNotifierProvider);
    final theme = Theme.of(context);

    // Tampil error dari state
    ref.listen(authStateNotifierProvider, (prev, next) {
      if (next.errorMessage != null && next.errorMessage != prev?.errorMessage) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.errorMessage!),
            backgroundColor: Colors.red.shade700,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    });

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 24),

              // ── Logo & Judul ──────────────────────────────
              Center(
                child: Column(
                  children: [
                    Container(
                      width: 72,
                      height: 72,
                      decoration: BoxDecoration(
                        color: theme.colorScheme.primary,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: theme.colorScheme.primary.withOpacity(0.3),
                            blurRadius: 16,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: const Center(
                        child: Text('🌿', style: TextStyle(fontSize: 36)),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Buruan Sae 2.0',
                      style: theme.textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: Colors.grey.shade900,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Urban Farming Kota Bandung',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: Colors.grey.shade500,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 40),

              // ── Error message dari state ───────────────────
              if (authState.errorMessage != null)
                Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.red.shade200),
                  ),
                  child: Text(
                    authState.errorMessage!,
                    style: TextStyle(fontSize: 13, color: Colors.red.shade800),
                  ),
                ),

              // ── Form ──────────────────────────────────────
              Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Identifier
                    TextFormField(
                      key: const Key('field_identifier'),
                      controller: _identifierCtrl,
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                      decoration: const InputDecoration(
                        labelText: 'Email / Nomor WhatsApp',
                        hintText: 'contoh@gmail.com atau 08123456789',
                        prefixIcon: Icon(Icons.person_outline),
                      ),
                      validator: _validateIdentifier,
                    ),
                    const SizedBox(height: 16),

                    // Password
                    TextFormField(
                      key: const Key('field_password'),
                      controller: _passwordCtrl,
                      obscureText: !_showPassword,
                      textInputAction: TextInputAction.done,
                      onFieldSubmitted: (_) => _submit(),
                      decoration: InputDecoration(
                        labelText: 'Password',
                        prefixIcon: const Icon(Icons.lock_outline),
                        suffixIcon: IconButton(
                          key: const Key('toggle_password_visibility'),
                          icon: Icon(
                            _showPassword ? Icons.visibility_off : Icons.visibility,
                            size: 20,
                          ),
                          onPressed: () => setState(() => _showPassword = !_showPassword),
                        ),
                      ),
                      validator: _validatePassword,
                    ),
                    const SizedBox(height: 24),

                    // Tombol Login
                    FilledButton(
                      key: const Key('btn_login'),
                      onPressed: authState.isLoading ? null : _submit,
                      style: FilledButton.styleFrom(
                        minimumSize: const Size.fromHeight(48),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: authState.isLoading
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Text('Masuk', style: TextStyle(fontSize: 15)),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // ── Lupa password ─────────────────────────────
              Center(
                child: TextButton(
                  onPressed: () => context.push('/auth/forgot-password'),
                  child: Text(
                    'Lupa password?',
                    style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                  ),
                ),
              ),

              const SizedBox(height: 32),

              // ── Link Daftar ───────────────────────────────
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Belum punya akun? ',
                    style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                  ),
                  GestureDetector(
                    key: const Key('link_daftar'),
                    onTap: () => context.push('/auth/register'),
                    child: Text(
                      'Daftar sekarang',
                      style: TextStyle(
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
