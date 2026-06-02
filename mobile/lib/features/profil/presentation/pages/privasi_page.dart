import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../../core/network/api_client.dart';

part 'privasi_page.g.dart';

// ============================================================
// PrivasiPage — Kebijakan Privasi & Manajemen Consent
// Sesuai UU PDP No. 27/2022
// ============================================================

@riverpod
Future<Map<String, dynamic>> dataConsent(
  DataConsentRef ref,
) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get('/pengguna/consent');
  return res.data['data'] as Map<String, dynamic>;
}

@riverpod
class ConsentNotifier extends _$ConsentNotifier {
  @override
  AsyncValue<void> build() => const AsyncValue.data(null);

  Future<void> perbaruiConsent({
    required bool consentDataPribadi,
    required bool consentPublikasiData,
  }) async {
    state = const AsyncValue.loading();
    try {
      final dio = ref.read(dioProvider);
      await dio.patch('/pengguna/consent', data: {
        'consent_data_pribadi': consentDataPribadi,
        'consent_publikasi_data': consentPublikasiData,
      });
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> hapusAkun() async {
    state = const AsyncValue.loading();
    try {
      final dio = ref.read(dioProvider);
      await dio.delete('/pengguna/akun');
      state = const AsyncValue.data(null);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }
}

class PrivasiPage extends ConsumerStatefulWidget {
  const PrivasiPage({super.key});

  @override
  ConsumerState<PrivasiPage> createState() => _PrivasiPageState();
}

class _PrivasiPageState extends ConsumerState<PrivasiPage> {
  bool? _consentDataPribadi;
  bool? _consentPublikasiData;

  @override
  Widget build(BuildContext context) {
    final consentAsync = ref.watch(dataConsentProvider);
    final notifierState = ref.watch(consentNotifierProvider);

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('Privasi & Consent'),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: consentAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Gagal memuat: $e')),
        data: (consent) {
          _consentDataPribadi ??=
              consent['consent_data_pribadi'] as bool? ?? false;
          _consentPublikasiData ??=
              consent['consent_publikasi_data'] as bool? ?? false;

          return SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // UU PDP Banner
                Container(
                  margin: const EdgeInsets.all(16),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.blue.shade200),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.security,
                          color: Colors.blue.shade700, size: 28),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Data Anda dilindungi berdasarkan\n'
                          'UU Perlindungan Data Pribadi No. 27/2022',
                          style: TextStyle(
                              color: Colors.blue.shade700, fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                ),

                // Consent settings
                Container(
                  color: Colors.white,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Padding(
                        padding: EdgeInsets.fromLTRB(20, 16, 20, 8),
                        child: Text('Pengaturan Consent',
                            style: TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 15)),
                      ),
                      SwitchListTile(
                        value: _consentDataPribadi ?? false,
                        onChanged: (v) =>
                            setState(() => _consentDataPribadi = v),
                        title: const Text('Izin Penggunaan Data Pribadi'),
                        subtitle: const Text(
                          'Memungkinkan kami memproses data pribadi Anda '
                          'untuk layanan Buruan Sae',
                          style: TextStyle(fontSize: 12),
                        ),
                        activeColor: Colors.green.shade700,
                      ),
                      const Divider(height: 1, indent: 20),
                      SwitchListTile(
                        value: _consentPublikasiData ?? false,
                        onChanged: (v) =>
                            setState(() => _consentPublikasiData = v),
                        title: const Text('Izin Publikasi Data Produksi'),
                        subtitle: const Text(
                          'Mengizinkan data produksi Anda ditampilkan '
                          'di dashboard publik Kota Bandung',
                          style: TextStyle(fontSize: 12),
                        ),
                        activeColor: Colors.green.shade700,
                      ),
                      const SizedBox(height: 8),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                        child: SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: notifierState.isLoading
                                ? null
                                : () {
                                    ref
                                        .read(
                                            consentNotifierProvider.notifier)
                                        .perbaruiConsent(
                                          consentDataPribadi:
                                              _consentDataPribadi ?? false,
                                          consentPublikasiData:
                                              _consentPublikasiData ?? false,
                                        );
                                    ScaffoldMessenger.of(context)
                                        .showSnackBar(
                                      const SnackBar(
                                        content:
                                            Text('Consent berhasil diperbarui'),
                                        backgroundColor: Colors.green,
                                      ),
                                    );
                                  },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.green.shade700,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10)),
                            ),
                            child: const Text('Simpan Pengaturan'),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // Hak Data
                Container(
                  color: Colors.white,
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Hak Anda sebagai Subjek Data',
                          style: TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 15)),
                      const SizedBox(height: 12),
                      _HakRow(Icons.download_outlined, 'Hak Akses Data',
                          'Unduh semua data pribadi Anda'),
                      _HakRow(Icons.edit_outlined, 'Hak Koreksi Data',
                          'Perbarui data yang tidak akurat'),
                      _HakRow(Icons.delete_outline, 'Hak Penghapusan Data',
                          'Hapus akun dan semua data Anda'),
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // Hapus Akun
                Container(
                  color: Colors.white,
                  child: ListTile(
                    leading: Icon(Icons.warning_amber_outlined,
                        color: Colors.red.shade600),
                    title: Text('Hapus Akun',
                        style: TextStyle(
                            color: Colors.red.shade600,
                            fontWeight: FontWeight.w600)),
                    subtitle: const Text(
                        'Menghapus akun secara permanen (soft-delete 30 hari)'),
                    onTap: () => _konfirmasiHapusAkun(context),
                  ),
                ),

                const SizedBox(height: 32),
              ],
            ),
          );
        },
      ),
    );
  }

  void _konfirmasiHapusAkun(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Hapus Akun'),
        content: const Text(
          'Akun Anda akan dihapus. Data akan disimpan selama 30 hari '
          'sebelum dihapus permanen sesuai UU PDP No. 27/2022.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Batal'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await ref.read(consentNotifierProvider.notifier).hapusAkun();
            },
            style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red.shade600,
                foregroundColor: Colors.white),
            child: const Text('Hapus Akun'),
          ),
        ],
      ),
    );
  }
}

class _HakRow extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  const _HakRow(this.icon, this.title, this.subtitle);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, color: Colors.green.shade700, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: const TextStyle(
                        fontWeight: FontWeight.w500, fontSize: 14)),
                Text(subtitle,
                    style: TextStyle(
                        color: Colors.grey.shade500, fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
