import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../../data/providers/produksi_provider.dart';

// ============================================================
// Dialog / Bottom Sheet Tambah Catatan Panen
// Mendukung offline mode via idempotency key
// ============================================================

class TambahPanenDialog extends ConsumerStatefulWidget {
  const TambahPanenDialog({super.key});

  @override
  ConsumerState<TambahPanenDialog> createState() => _TambahPanenDialogState();
}

class _TambahPanenDialogState extends ConsumerState<TambahPanenDialog> {
  final _formKey = GlobalKey<FormState>();
  final _jumlahController = TextEditingController();
  final _catatanController = TextEditingController();

  String? _lahanId;
  String? _komoditasId;
  String _kualitas = 'A';
  DateTime _tglPanen = DateTime.now();
  bool _isLoading = false;

  // Idempotency key untuk offline safety
  final String _idempotencyKey = const Uuid().v4();

  @override
  void dispose() {
    _jumlahController.dispose();
    _catatanController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final lahanAsync = ref.watch(lahanSingkatProvider);
    final komoditasAsync = ref.watch(komoditasProvider);

    return Padding(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              const Text(
                'Catat Hasil Panen',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),

              // Pilih Lahan
              lahanAsync.when(
                loading: () => const CircularProgressIndicator(),
                error: (_, __) => const Text('Gagal memuat lahan'),
                data: (daftar) => DropdownButtonFormField<String>(
                  decoration: const InputDecoration(
                    labelText: 'Pilih Lahan *',
                    prefixIcon: Icon(Icons.landscape),
                  ),
                  items: daftar
                      .map((l) => DropdownMenuItem(
                            value: l['id'] as String,
                            child: Text(l['nama'] as String),
                          ))
                      .toList(),
                  onChanged: (val) => setState(() => _lahanId = val),
                  validator: (val) => val == null ? 'Pilih lahan' : null,
                ),
              ),
              const SizedBox(height: 12),

              // Pilih Komoditas
              komoditasAsync.when(
                loading: () => const CircularProgressIndicator(),
                error: (_, __) => const Text('Gagal memuat komoditas'),
                data: (daftar) => DropdownButtonFormField<String>(
                  decoration: const InputDecoration(
                    labelText: 'Pilih Komoditas *',
                    prefixIcon: Icon(Icons.eco),
                  ),
                  items: daftar
                      .map((k) => DropdownMenuItem(
                            value: k['id'] as String,
                            child: Text('${k['nama']} (${k['satuan']})'),
                          ))
                      .toList(),
                  onChanged: (val) => setState(() => _komoditasId = val),
                  validator: (val) => val == null ? 'Pilih komoditas' : null,
                ),
              ),
              const SizedBox(height: 12),

              // Tanggal Panen
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.calendar_today, color: Color(0xFF2D7D32)),
                title: Text(
                  'Tanggal: ${_tglPanen.day}/${_tglPanen.month}/${_tglPanen.year}',
                ),
                onTap: _pilihTanggal,
              ),
              const SizedBox(height: 12),

              // Jumlah Panen
              TextFormField(
                controller: _jumlahController,
                decoration: const InputDecoration(
                  labelText: 'Jumlah Panen (kg) *',
                  prefixIcon: Icon(Icons.scale),
                ),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                validator: (val) {
                  if (val == null || val.isEmpty) return 'Isi jumlah panen';
                  if (double.tryParse(val) == null) return 'Masukkan angka valid';
                  if (double.parse(val) <= 0) return 'Jumlah harus lebih dari 0';
                  return null;
                },
              ),
              const SizedBox(height: 12),

              // Kualitas
              Row(
                children: ['A', 'B', 'C'].map((k) {
                  return Expanded(
                    child: RadioListTile<String>(
                      contentPadding: EdgeInsets.zero,
                      title: Text('Kelas $k'),
                      value: k,
                      groupValue: _kualitas,
                      onChanged: (val) => setState(() => _kualitas = val!),
                      activeColor: const Color(0xFF2D7D32),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 12),

              // Catatan
              TextFormField(
                controller: _catatanController,
                decoration: const InputDecoration(
                  labelText: 'Catatan (opsional)',
                  prefixIcon: Icon(Icons.notes),
                  hintText: 'Kondisi panen, kendala, dll.',
                ),
                maxLines: 2,
                maxLength: 500,
              ),
              const SizedBox(height: 16),

              // Tombol Simpan
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _isLoading ? null : _simpan,
                  icon: _isLoading
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Icon(Icons.save),
                  label: Text(_isLoading ? 'Menyimpan...' : 'Simpan Catatan'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _pilihTanggal() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _tglPanen,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
    );
    if (picked != null) setState(() => _tglPanen = picked);
  }

  Future<void> _simpan() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final notifier = ref.read(tambahPanenNotifierProvider.notifier);
      await notifier.tambah({
        'lahan_id': _lahanId,
        'komoditas_id': _komoditasId,
        'tgl_panen':
            '${_tglPanen.year}-${_tglPanen.month.toString().padLeft(2, '0')}-${_tglPanen.day.toString().padLeft(2, '0')}',
        'jumlah_panen': double.parse(_jumlahController.text),
        'kualitas': _kualitas,
        'catatan': _catatanController.text.isEmpty ? null : _catatanController.text,
        'idempotency_key': _idempotencyKey,
        'is_offline': false,
      });

      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Catatan panen berhasil disimpan! +10 poin'),
            backgroundColor: Color(0xFF2D7D32),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal menyimpan: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }
}
