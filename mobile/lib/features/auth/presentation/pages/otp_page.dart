import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/providers/auth_provider.dart';

// ============================================================
// OtpPage — Verifikasi OTP via WhatsApp
// ============================================================

class OtpPage extends ConsumerStatefulWidget {
  final String nomorWa;

  const OtpPage({super.key, required this.nomorWa});

  @override
  ConsumerState<OtpPage> createState() => _OtpPageState();
}

class _OtpPageState extends ConsumerState<OtpPage> {
  final List<TextEditingController> _controllers =
      List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());

  int _cooldown = 0;
  Timer? _timer;
  bool _otpSent = false;

  @override
  void initState() {
    super.initState();
    _kirimOtp();
  }

  @override
  void dispose() {
    for (final c in _controllers) c.dispose();
    for (final f in _focusNodes) f.dispose();
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _kirimOtp() async {
    await ref.read(authStateNotifierProvider.notifier).kirimOtp(widget.nomorWa);
    setState(() {
      _otpSent = true;
      _cooldown = 60;
    });
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_cooldown <= 0) {
        t.cancel();
      } else {
        setState(() => _cooldown--);
      }
    });
  }

  String get _otpValue => _controllers.map((c) => c.text).join();

  Future<void> _verifikasi() async {
    if (_otpValue.length < 6) return;

    await ref.read(authStateNotifierProvider.notifier).verifikasiOtp(
      nomorWa: widget.nomorWa,
      kodeOtp: _otpValue,
    );
  }

  void _onDigitInput(String val, int index) {
    if (val.isNotEmpty && index < 5) {
      _focusNodes[index + 1].requestFocus();
    }
    if (_otpValue.length == 6) _verifikasi();
  }

  void _onKeyDown(RawKeyEvent event, int index) {
    if (event is RawKeyDownEvent &&
        event.logicalKey == LogicalKeyboardKey.backspace &&
        _controllers[index].text.isEmpty &&
        index > 0) {
      _focusNodes[index - 1].requestFocus();
    }
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
        // Reset kotak OTP
        for (final c in _controllers) c.clear();
        _focusNodes.first.requestFocus();
      }
    });

    return Scaffold(
      appBar: AppBar(title: const Text('Verifikasi OTP'), centerTitle: true),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 16),

            // Ilustrasi
            Center(
              child: Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: Colors.green.shade50,
                  shape: BoxShape.circle,
                ),
                child: const Center(child: Text('💬', style: TextStyle(fontSize: 36))),
              ),
            ),
            const SizedBox(height: 20),

            Text(
              'Kode OTP dikirim ke',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey.shade600, fontSize: 14),
            ),
            const SizedBox(height: 4),
            Text(
              widget.nomorWa,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            Text(
              'via WhatsApp',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
            ),
            const SizedBox(height: 32),

            // Kotak OTP
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(6, (i) {
                return Container(
                  width: 46,
                  height: 54,
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  child: RawKeyboardListener(
                    focusNode: FocusNode(),
                    onKey: (e) => _onKeyDown(e, i),
                    child: TextField(
                      controller: _controllers[i],
                      focusNode: _focusNodes[i],
                      textAlign: TextAlign.center,
                      keyboardType: TextInputType.number,
                      maxLength: 1,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                      decoration: InputDecoration(
                        counterText: '',
                        contentPadding: EdgeInsets.zero,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide(color: Colors.grey.shade300),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide(color: theme.colorScheme.primary, width: 2),
                        ),
                      ),
                      onChanged: (val) => _onDigitInput(val, i),
                    ),
                  ),
                );
              }),
            ),
            const SizedBox(height: 28),

            // Tombol Verifikasi
            FilledButton(
              onPressed: authState.isLoading || _otpValue.length < 6 ? null : _verifikasi,
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(48),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: authState.isLoading
                  ? const SizedBox(
                      width: 20, height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Verifikasi', style: TextStyle(fontSize: 15)),
            ),
            const SizedBox(height: 20),

            // Kirim Ulang
            Center(
              child: _cooldown > 0
                  ? Text(
                      'Kirim ulang dalam ${_cooldown}s',
                      style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
                    )
                  : TextButton(
                      onPressed: _kirimOtp,
                      child: Text(
                        'Kirim Ulang OTP',
                        style: TextStyle(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
