import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../data/providers/agrowisata_provider.dart';

// ============================================================
// AgrowisataPage — Paket Wisata Buruan Sae 2.0
// ============================================================

class AgrowisataPage extends ConsumerStatefulWidget {
  const AgrowisataPage({super.key});

  @override
  ConsumerState<AgrowisataPage> createState() => _AgrowisataPageState();
}

class _AgrowisataPageState extends ConsumerState<AgrowisataPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final paketAsync = ref.watch(daftarPaketWisataProvider());
    final bookingAsync = ref.watch(daftarBookingSayaProvider);

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('Agrowisata'),
        centerTitle: true,
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Paket Wisata'),
            Tab(text: 'Booking Saya'),
          ],
          labelColor: Colors.green.shade700,
          unselectedLabelColor: Colors.grey,
          indicatorColor: Colors.green.shade700,
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // ── Tab Paket Wisata ──────────────────────────────
          paketAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 48, color: Colors.red),
                  const SizedBox(height: 12),
                  Text('Gagal memuat: $e', textAlign: TextAlign.center),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: () => ref.invalidate(daftarPaketWisataProvider),
                    child: const Text('Coba Lagi'),
                  ),
                ],
              ),
            ),
            data: (pakets) => pakets.isEmpty
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('🌳', style: TextStyle(fontSize: 56)),
                        SizedBox(height: 12),
                        Text('Belum ada paket wisata tersedia',
                            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                        SizedBox(height: 4),
                        Text('Pantau terus untuk update terbaru!',
                            style: TextStyle(color: Colors.grey, fontSize: 13)),
                      ],
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: () async =>
                        ref.invalidate(daftarPaketWisataProvider),
                    child: ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: pakets.length,
                      separatorBuilder: (_, __) =>
                          const SizedBox(height: 12),
                      itemBuilder: (_, i) => _PaketCard(
                        data: pakets[i],
                        onBooking: () =>
                            _showBookingDialog(context, pakets[i]),
                      ),
                    ),
                  ),
          ),

          // ── Tab Booking Saya ──────────────────────────────
          bookingAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text('Gagal memuat: $e')),
            data: (bookings) => bookings.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text('🎫', style: TextStyle(fontSize: 56)),
                        const SizedBox(height: 12),
                        const Text('Belum ada booking',
                            style: TextStyle(
                                fontWeight: FontWeight.w600, fontSize: 16)),
                        const SizedBox(height: 8),
                        Text(
                          'Pilih paket wisata dan mulai pengalaman\nurban farming Anda!',
                          style: TextStyle(
                              color: Colors.grey.shade500, fontSize: 13),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: () => _tabController.animateTo(0),
                          icon: const Icon(Icons.explore_outlined),
                          label: const Text('Lihat Paket'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green.shade700,
                            foregroundColor: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: () async =>
                        ref.invalidate(daftarBookingSayaProvider),
                    child: ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: bookings.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (_, i) => _BookingCard(data: bookings[i]),
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  void _showBookingDialog(
      BuildContext context, Map<String, dynamic> paket) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _BookingSheet(paket: paket),
    );
  }
}

// ── Kartu Paket Wisata ────────────────────────────────────────

class _PaketCard extends StatelessWidget {
  final Map<String, dynamic> data;
  final VoidCallback onBooking;
  const _PaketCard({required this.data, required this.onBooking});

  @override
  Widget build(BuildContext context) {
    final harga = data['harga_per_orang'] as num? ?? 0;
    final kapasitas = data['kapasitas'] as int? ?? 0;
    final durasi = data['durasi_jam'] as int? ?? 0;
    final status = data['status'] as String? ?? 'AKTIF';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.05), blurRadius: 8)
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Foto / Placeholder
          ClipRRect(
            borderRadius:
                const BorderRadius.vertical(top: Radius.circular(16)),
            child: Container(
              height: 160,
              width: double.infinity,
              color: Colors.green.shade50,
              child: data['foto_utama_url'] != null
                  ? Image.network(
                      data['foto_utama_url'],
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => const Center(
                        child: Text('🌿', style: TextStyle(fontSize: 56)),
                      ),
                    )
                  : const Center(
                      child: Text('🌿', style: TextStyle(fontSize: 56)),
                    ),
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Status badge
                if (status != 'AKTIF')
                  Container(
                    margin: const EdgeInsets.only(bottom: 6),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(status,
                        style: const TextStyle(
                            fontSize: 10, color: Colors.grey)),
                  ),

                // Nama Paket
                Text(
                  data['nama'] ?? '',
                  style: const TextStyle(
                      fontWeight: FontWeight.bold, fontSize: 16),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 6),

                // Deskripsi
                Text(
                  data['deskripsi'] ?? '',
                  style: TextStyle(
                      fontSize: 13, color: Colors.grey.shade600),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 12),

                // Info chips
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  children: [
                    _InfoChip(
                        icon: '⏱️',
                        label: '$durasi jam'),
                    _InfoChip(
                        icon: '👥',
                        label: 'Maks. $kapasitas orang'),
                  ],
                ),
                const SizedBox(height: 12),

                // Harga + Tombol
                Row(
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Mulai dari',
                            style: TextStyle(
                                fontSize: 11, color: Colors.grey)),
                        Text(
                          'Rp ${_formatHarga(harga)}/orang',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.green.shade700,
                          ),
                        ),
                      ],
                    ),
                    const Spacer(),
                    if (status == 'AKTIF')
                      ElevatedButton(
                        onPressed: onBooking,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green.shade700,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10)),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 20, vertical: 10),
                        ),
                        child: const Text('Pesan'),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatHarga(num harga) {
    return harga
        .toStringAsFixed(0)
        .replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
            (m) => '${m[1]}.');
  }
}

class _InfoChip extends StatelessWidget {
  final String icon;
  final String label;
  const _InfoChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.green.shade50,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        '$icon $label',
        style:
            TextStyle(fontSize: 12, color: Colors.green.shade700),
      ),
    );
  }
}

// ── Kartu Booking ─────────────────────────────────────────────

class _BookingCard extends StatelessWidget {
  final Map<String, dynamic> data;
  const _BookingCard({required this.data});

  static const _statusColor = {
    'MENUNGGU_PEMBAYARAN': Color(0xFFFFF8E1),
    'DIBAYAR': Color(0xFFE3F2FD),
    'DIKONFIRMASI': Color(0xFFE8F5E9),
    'SELESAI': Color(0xFFF1F8E9),
    'DIBATALKAN': Color(0xFFFFEBEE),
  };

  static const _statusLabel = {
    'MENUNGGU_PEMBAYARAN': 'Menunggu Pembayaran',
    'DIBAYAR': 'Dibayar',
    'DIKONFIRMASI': 'Dikonfirmasi',
    'SELESAI': 'Selesai',
    'DIBATALKAN': 'Dibatalkan',
  };

  @override
  Widget build(BuildContext context) {
    final status = data['status'] as String? ?? 'MENUNGGU_PEMBAYARAN';
    final bgColor = _statusColor[status] ?? Colors.grey.shade50;
    final paket = data['paket'] as Map<String, dynamic>? ?? {};
    final tanggal = data['tanggal_kunjungan'] as String?;
    final dt = tanggal != null ? DateTime.tryParse(tanggal) : null;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header status
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(12)),
            ),
            child: Row(
              children: [
                Text(
                  data['kode_booking'] ?? '',
                  style: const TextStyle(
                      fontSize: 12, fontWeight: FontWeight.bold),
                ),
                const Spacer(),
                Text(
                  _statusLabel[status] ?? status,
                  style: const TextStyle(
                      fontSize: 12, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  paket['nama'] ?? '',
                  style: const TextStyle(
                      fontWeight: FontWeight.bold, fontSize: 15),
                ),
                const SizedBox(height: 6),
                if (dt != null)
                  Row(
                    children: [
                      Icon(Icons.calendar_today_outlined,
                          size: 14, color: Colors.grey.shade500),
                      const SizedBox(width: 4),
                      Text(
                        DateFormat('EEEE, d MMMM yyyy', 'id').format(dt),
                        style: TextStyle(
                            fontSize: 13, color: Colors.grey.shade700),
                      ),
                    ],
                  ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(Icons.people_outline,
                        size: 14, color: Colors.grey.shade500),
                    const SizedBox(width: 4),
                    Text(
                      '${data['jumlah_peserta']} peserta',
                      style: TextStyle(
                          fontSize: 13, color: Colors.grey.shade700),
                    ),
                    const Spacer(),
                    Text(
                      'Total: Rp ${_formatHarga(data['total_harga'])}',
                      style: const TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                  ],
                ),
                if (status == 'MENUNGGU_PEMBAYARAN') ...[
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {},
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green.shade700,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8)),
                      ),
                      child: const Text('Bayar Sekarang'),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatHarga(num? harga) {
    if (harga == null) return '0';
    return harga
        .toStringAsFixed(0)
        .replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
            (m) => '${m[1]}.');
  }
}

// ── Bottom Sheet Booking ──────────────────────────────────────

class _BookingSheet extends ConsumerStatefulWidget {
  final Map<String, dynamic> paket;
  const _BookingSheet({required this.paket});

  @override
  ConsumerState<_BookingSheet> createState() => _BookingSheetState();
}

class _BookingSheetState extends ConsumerState<_BookingSheet> {
  final _formKey = GlobalKey<FormState>();
  DateTime? _tanggal;
  int _peserta = 1;
  final _catatanController = TextEditingController();

  int get _kapasitas => widget.paket['kapasitas'] as int? ?? 50;
  num get _hargaPerOrang => widget.paket['harga_per_orang'] as num? ?? 0;
  num get _totalHarga => _hargaPerOrang * _peserta;

  @override
  void dispose() {
    _catatanController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bookingState = ref.watch(buatBookingNotifierProvider);

    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle bar
              Center(
                child: Container(
                  width: 40, height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Judul
              Text(
                'Pesan: ${widget.paket['nama'] ?? ''}',
                style: const TextStyle(
                    fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const SizedBox(height: 16),

              // Tanggal Kunjungan
              InkWell(
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: DateTime.now().add(const Duration(days: 1)),
                    firstDate: DateTime.now().add(const Duration(days: 1)),
                    lastDate:
                        DateTime.now().add(const Duration(days: 90)),
                    locale: const Locale('id', 'ID'),
                  );
                  if (picked != null) setState(() => _tanggal = picked);
                },
                child: InputDecorator(
                  decoration: InputDecoration(
                    labelText: 'Tanggal Kunjungan',
                    prefixIcon: const Icon(Icons.calendar_month_outlined),
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10)),
                    filled: true,
                    fillColor: Colors.grey.shade50,
                  ),
                  child: Text(
                    _tanggal != null
                        ? DateFormat('d MMMM yyyy', 'id').format(_tanggal!)
                        : 'Pilih tanggal...',
                    style: TextStyle(
                      color: _tanggal != null
                          ? Colors.black
                          : Colors.grey.shade500,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Jumlah Peserta
              Row(
                children: [
                  const Expanded(
                    child: Text('Jumlah Peserta',
                        style: TextStyle(fontSize: 14)),
                  ),
                  IconButton(
                    icon: const Icon(Icons.remove_circle_outline),
                    onPressed: _peserta > 1
                        ? () => setState(() => _peserta--)
                        : null,
                    color: Colors.green.shade700,
                  ),
                  SizedBox(
                    width: 40,
                    child: Text(
                      '$_peserta',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.add_circle_outline),
                    onPressed: _peserta < _kapasitas
                        ? () => setState(() => _peserta++)
                        : null,
                    color: Colors.green.shade700,
                  ),
                  Text('/ $_kapasitas',
                      style: TextStyle(
                          color: Colors.grey.shade500, fontSize: 12)),
                ],
              ),
              const SizedBox(height: 12),

              // Catatan
              TextFormField(
                controller: _catatanController,
                decoration: InputDecoration(
                  labelText: 'Catatan (opsional)',
                  prefixIcon: const Icon(Icons.notes_outlined),
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10)),
                  filled: true,
                  fillColor: Colors.grey.shade50,
                ),
                maxLines: 2,
              ),
              const SizedBox(height: 16),

              // Total & Submit
              Row(
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Total Pembayaran',
                          style: TextStyle(
                              fontSize: 12, color: Colors.grey)),
                      Text(
                        'Rp ${_formatHarga(_totalHarga)}',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.green.shade700,
                        ),
                      ),
                    ],
                  ),
                  const Spacer(),
                  ElevatedButton(
                    onPressed: bookingState.isLoading
                        ? null
                        : () => _submit(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green.shade700,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 24, vertical: 12),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10)),
                    ),
                    child: bookingState.isLoading
                        ? const SizedBox(
                            width: 20, height: 20,
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 2))
                        : const Text('Booking'),
                  ),
                ],
              ),

              if (bookingState.hasError)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Text(
                    'Error: ${bookingState.error}',
                    style: const TextStyle(color: Colors.red, fontSize: 12),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submit(BuildContext context) async {
    if (_tanggal == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pilih tanggal kunjungan terlebih dahulu')),
      );
      return;
    }

    await ref.read(buatBookingNotifierProvider.notifier).buatBooking(
          paketId: widget.paket['id'] as String,
          tanggalKunjungan: _tanggal!.toIso8601String().split('T').first,
          jumlahPeserta: _peserta,
          catatan: _catatanController.text.trim().isEmpty
              ? null
              : _catatanController.text.trim(),
        );

    if (!mounted) return;
    final state = ref.read(buatBookingNotifierProvider);
    if (state.hasValue && state.value != null) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Booking berhasil! Silakan lanjutkan pembayaran.'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  String _formatHarga(num harga) {
    return harga
        .toStringAsFixed(0)
        .replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
            (m) => '${m[1]}.');
  }
}
