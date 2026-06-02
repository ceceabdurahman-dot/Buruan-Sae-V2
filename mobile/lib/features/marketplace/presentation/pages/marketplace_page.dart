import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/providers/marketplace_provider.dart';

// ============================================================
// MarketplacePage — Halaman Belanja Produk Urban Farming
// ============================================================

class MarketplacePage extends ConsumerStatefulWidget {
  const MarketplacePage({super.key});

  @override
  ConsumerState<MarketplacePage> createState() => _MarketplacePageState();
}

class _MarketplacePageState extends ConsumerState<MarketplacePage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _sort = 'terbaru';

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
    final produkAsync = ref.watch(daftarProdukProvider(_sort));
    final pesananAsync = ref.watch(daftarPesananSayaProvider);
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('Marketplace'),
        centerTitle: true,
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Produk'),
            Tab(text: 'Pesanan Saya'),
          ],
          labelColor: Colors.green.shade700,
          unselectedLabelColor: Colors.grey,
          indicatorColor: Colors.green.shade700,
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.shopping_bag_outlined),
            onPressed: () {},
            tooltip: 'Keranjang',
          ),
        ],
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // ── Tab Produk ────────────────────────────────────
          Column(
            children: [
              // Sort bar
              Container(
                color: Colors.white,
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                child: Row(
                  children: [
                    const Text('Urutkan: ', style: TextStyle(fontSize: 13, color: Colors.grey)),
                    const SizedBox(width: 8),
                    ...['terbaru', 'terpopuler', 'harga_asc', 'harga_desc'].map((s) {
                      final labels = {
                        'terbaru': 'Terbaru',
                        'terpopuler': 'Terpopuler',
                        'harga_asc': 'Harga ↑',
                        'harga_desc': 'Harga ↓',
                      };
                      final active = _sort == s;
                      return GestureDetector(
                        onTap: () => setState(() => _sort = s),
                        child: Container(
                          margin: const EdgeInsets.only(right: 6),
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: active ? Colors.green.shade700 : Colors.grey.shade100,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            labels[s]!,
                            style: TextStyle(
                              fontSize: 11,
                              color: active ? Colors.white : Colors.grey.shade700,
                              fontWeight: active ? FontWeight.w600 : FontWeight.normal,
                            ),
                          ),
                        ),
                      );
                    }),
                  ],
                ),
              ),

              // Grid produk
              Expanded(
                child: produkAsync.when(
                  loading: () => const Center(child: CircularProgressIndicator()),
                  error: (e, _) => Center(child: Text('Gagal memuat: $e')),
                  data: (produk) => produk.isEmpty
                      ? const Center(child: Text('Belum ada produk'))
                      : GridView.builder(
                          padding: const EdgeInsets.all(16),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12,
                            childAspectRatio: 0.72,
                          ),
                          itemCount: produk.length,
                          itemBuilder: (_, i) => _ProdukCard(produk: produk[i]),
                        ),
                ),
              ),
            ],
          ),

          // ── Tab Pesanan ───────────────────────────────────
          pesananAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text('Gagal memuat pesanan: $e')),
            data: (pesanan) => pesanan.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text('📦', style: TextStyle(fontSize: 48)),
                        const SizedBox(height: 16),
                        const Text('Belum ada pesanan',
                          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                        const SizedBox(height: 8),
                        Text('Mulai belanja produk segar dari petani lokal!',
                          style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
                          textAlign: TextAlign.center),
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: pesanan.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) => _PesananCard(pesanan: pesanan[i]),
                  ),
          ),
        ],
      ),
    );
  }
}

// ── Kartu Produk ─────────────────────────────────────────────

class _ProdukCard extends StatelessWidget {
  final Map<String, dynamic> produk;
  const _ProdukCard({required this.produk});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/marketplace/${produk['id']}'),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 6)],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Foto
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
              child: Container(
                height: 130,
                color: Colors.green.shade50,
                child: produk['foto_url'] != null
                    ? Image.network(produk['foto_url'], fit: BoxFit.cover,
                        width: double.infinity)
                    : const Center(child: Text('🌿', style: TextStyle(fontSize: 40))),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    produk['nama'] ?? '',
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    produk['penjual']?['nama_lengkap'] ?? '',
                    style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Rp ${_formatHarga(produk['harga'])}',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                          color: Color(0xFF2D7D32),
                        ),
                      ),
                      Text(
                        '/${produk['satuan'] ?? 'kg'}',
                        style: TextStyle(fontSize: 11, color: Colors.grey.shade500),
                      ),
                    ],
                  ),
                  Text(
                    'Stok: ${produk['stok']} ${produk['satuan'] ?? 'kg'}',
                    style: TextStyle(fontSize: 10, color: Colors.grey.shade400),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatHarga(num? harga) {
    if (harga == null) return '0';
    return harga.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.');
  }
}

// ── Kartu Pesanan ─────────────────────────────────────────────

class _PesananCard extends StatelessWidget {
  final Map<String, dynamic> pesanan;
  const _PesananCard({required this.pesanan});

  static const _statusColor = {
    'MENUNGGU_PEMBAYARAN': Color(0xFFFFF8E1),
    'DIBAYAR': Color(0xFFE3F2FD),
    'DIPROSES': Color(0xFFF3E5F5),
    'SELESAI': Color(0xFFE8F5E9),
    'DIBATALKAN': Color(0xFFFFEBEE),
  };

  static const _statusLabel = {
    'MENUNGGU_PEMBAYARAN': 'Menunggu Pembayaran',
    'DIBAYAR': 'Dibayar',
    'DIPROSES': 'Diproses',
    'DIKIRIM': 'Dalam Pengiriman',
    'SELESAI': 'Selesai',
    'DIBATALKAN': 'Dibatalkan',
  };

  @override
  Widget build(BuildContext context) {
    final status = pesanan['status'] as String? ?? 'MENUNGGU_PEMBAYARAN';
    final bgColor = _statusColor[status] ?? Colors.grey.shade50;
    final detail = (pesanan['detail_pesanan'] as List?) ?? [];

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
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
            ),
            child: Row(
              children: [
                Text(
                  pesanan['kode_pesanan'] ?? '',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
                const Spacer(),
                Text(
                  _statusLabel[status] ?? status,
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),

          // Daftar item
          ...detail.take(2).map((d) => Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            child: Row(
              children: [
                Text('${d['produk']?['nama'] ?? ''} ×${d['jumlah']}',
                  style: const TextStyle(fontSize: 13)),
                const Spacer(),
                Text('Rp ${_formatHarga(d['harga_satuan'])}',
                  style: const TextStyle(fontSize: 13, color: Color(0xFF2D7D32))),
              ],
            ),
          )),

          if (detail.length > 2)
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 0, 14, 6),
              child: Text('+${detail.length - 2} produk lainnya',
                style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
            ),

          // Total & Tombol
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 4, 14, 12),
            child: Row(
              children: [
                Text('Total: Rp ${_formatHarga(pesanan['total_harga'])}',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                const Spacer(),
                if (status == 'MENUNGGU_PEMBAYARAN')
                  ElevatedButton(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2D7D32),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      minimumSize: Size.zero,
                    ),
                    child: const Text('Bayar', style: TextStyle(fontSize: 12)),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatHarga(num? harga) {
    if (harga == null) return '0';
    return harga.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.');
  }
}
