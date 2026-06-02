import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/providers/marketplace_provider.dart';

// ============================================================
// DetailProdukPage — Halaman Detail Produk Marketplace
// ============================================================

class DetailProdukPage extends ConsumerStatefulWidget {
  final String produkId;
  const DetailProdukPage({super.key, required this.produkId});

  @override
  ConsumerState<DetailProdukPage> createState() => _DetailProdukPageState();
}

class _DetailProdukPageState extends ConsumerState<DetailProdukPage> {
  int _jumlah = 1;

  @override
  Widget build(BuildContext context) {
    final produkAsync = ref.watch(detailProdukProvider(widget.produkId));

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('Detail Produk'),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: produkAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Gagal memuat: $e')),
        data: (produk) => Stack(
          children: [
            SingleChildScrollView(
              padding: const EdgeInsets.only(bottom: 100),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Foto
                  Container(
                    height: 240,
                    width: double.infinity,
                    color: Colors.green.shade50,
                    child: produk['foto_url'] != null
                        ? Image.network(produk['foto_url'],
                            fit: BoxFit.cover)
                        : const Center(
                            child: Text('🌿',
                                style: TextStyle(fontSize: 72))),
                  ),

                  // Info
                  Container(
                    color: Colors.white,
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          produk['nama'] ?? '',
                          style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            Text(
                              'Rp ${_fmt(produk['harga'])}',
                              style: TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                                color: Colors.green.shade700,
                              ),
                            ),
                            Text(
                              '/${produk['satuan'] ?? 'kg'}',
                              style: TextStyle(
                                  color: Colors.grey.shade500,
                                  fontSize: 14),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Stok: ${produk['stok']} ${produk['satuan'] ?? 'kg'}',
                          style: TextStyle(
                              color: Colors.grey.shade500, fontSize: 13),
                        ),
                        const Divider(height: 24),
                        Row(
                          children: [
                            CircleAvatar(
                              radius: 16,
                              backgroundColor: Colors.green.shade100,
                              child: Text(
                                (produk['penjual']?['nama_lengkap'] ??
                                    'P')[0],
                                style: TextStyle(
                                    color: Colors.green.shade700,
                                    fontWeight: FontWeight.bold),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Penjual',
                                    style: TextStyle(
                                        fontSize: 11,
                                        color: Colors.grey)),
                                Text(
                                  produk['penjual']?['nama_lengkap'] ?? '',
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 13),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 8),

                  // Deskripsi
                  if (produk['deskripsi'] != null)
                    Container(
                      color: Colors.white,
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Deskripsi',
                              style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15)),
                          const SizedBox(height: 8),
                          Text(produk['deskripsi'],
                              style: TextStyle(
                                  color: Colors.grey.shade700,
                                  fontSize: 14,
                                  height: 1.5)),
                        ],
                      ),
                    ),
                ],
              ),
            ),

            // ── Bottom Bar ───────────────────────────────
            Positioned(
              bottom: 0, left: 0, right: 0,
              child: Container(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                        color: Colors.black.withOpacity(0.08),
                        blurRadius: 8,
                        offset: const Offset(0, -2))
                  ],
                ),
                child: Row(
                  children: [
                    // Jumlah
                    Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.remove_circle_outline),
                          onPressed: _jumlah > 1
                              ? () => setState(() => _jumlah--)
                              : null,
                          color: Colors.green.shade700,
                        ),
                        Text('$_jumlah',
                            style: const TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 16)),
                        IconButton(
                          icon: const Icon(Icons.add_circle_outline),
                          onPressed: _jumlah < (produk['stok'] as num? ?? 99)
                              ? () => setState(() => _jumlah++)
                              : null,
                          color: Colors.green.shade700,
                        ),
                      ],
                    ),
                    const Spacer(),
                    ElevatedButton(
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                              content: Text('Ditambahkan ke keranjang')),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green.shade700,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 24, vertical: 12),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10)),
                      ),
                      child: Text(
                          'Rp ${_fmt((produk['harga'] as num? ?? 0) * _jumlah)}'),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _fmt(num? n) {
    if (n == null) return '0';
    return n.toStringAsFixed(0).replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.');
  }
}
