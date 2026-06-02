import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:uuid/uuid.dart';

import '../../data/providers/produksi_provider.dart';
import '../widgets/tambah_panen_dialog.dart';

// ============================================================
// Halaman Produksi — Chart + Catatan Panen
// ============================================================

class ProduksiPage extends ConsumerStatefulWidget {
  const ProduksiPage({super.key});

  @override
  ConsumerState<ProduksiPage> createState() => _ProduksiPageState();
}

class _ProduksiPageState extends ConsumerState<ProduksiPage> {
  int _tahunDipilih = DateTime.now().year;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Produksi'),
        actions: [
          // Filter tahun
          DropdownButton<int>(
            value: _tahunDipilih,
            dropdownColor: const Color(0xFF2D7D32),
            style: const TextStyle(color: Colors.white),
            underline: const SizedBox.shrink(),
            items: List.generate(5, (i) => DateTime.now().year - i)
                .map((y) => DropdownMenuItem(value: y, child: Text('$y')))
                .toList(),
            onChanged: (val) {
              if (val != null) setState(() => _tahunDipilih = val);
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(ringkasanProduksiProvider);
          ref.invalidate(catatanPanenProvider);
        },
        child: CustomScrollView(
          slivers: [
            // Chart ringkasan bulanan
            SliverToBoxAdapter(
              child: _RingkasanChart(tahun: _tahunDipilih),
            ),

            // Divider + judul
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.fromLTRB(16, 24, 16, 8),
                child: Text(
                  'Catatan Panen Terbaru',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
            ),

            // Daftar catatan panen
            _CatatanPanenList(),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showTambahPanenDialog(context),
        icon: const Icon(Icons.add),
        label: const Text('Catat Panen'),
        backgroundColor: const Color(0xFF2D7D32),
      ),
    );
  }

  void _showTambahPanenDialog(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => const TambahPanenDialog(),
    );
  }
}

// ============================================================
// Chart Ringkasan Produksi Bulanan (BarChart fl_chart)
// ============================================================

class _RingkasanChart extends ConsumerWidget {
  final int tahun;

  const _RingkasanChart({required this.tahun});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ringkasanAsync = ref.watch(ringkasanProduksiProvider(tahun));

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Total Panen per Bulan ($tahun)',
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 200,
            child: ringkasanAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, _) => Center(child: Text('Gagal memuat: $err')),
              data: (ringkasan) => _buildBarChart(ringkasan),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBarChart(Map<String, dynamic> ringkasan) {
    final perBulan = ringkasan['per_bulan'] as Map<String, dynamic>;

    // Hitung total per bulan (semua komoditas dijumlah)
    final totals = List.generate(12, (i) {
      final bulan = (i + 1).toString();
      final items = (perBulan[bulan] as List?) ?? [];
      return items.fold<double>(
        0.0,
        (sum, item) => sum + ((item['total'] as num?)?.toDouble() ?? 0),
      );
    });

    final maxY = totals.isEmpty ? 10.0 : (totals.reduce((a, b) => a > b ? a : b) * 1.2);

    return BarChart(
      BarChartData(
        alignment: BarChartAlignment.spaceAround,
        maxY: maxY < 1 ? 10 : maxY,
        barGroups: List.generate(12, (i) {
          return BarChartGroupData(
            x: i,
            barRods: [
              BarChartRodData(
                toY: totals[i],
                color: const Color(0xFF4CAF50),
                width: 14,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
              ),
            ],
          );
        }),
        titlesData: FlTitlesData(
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (val, meta) {
                const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
                               'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                return Text(bulan[val.toInt()],
                    style: const TextStyle(fontSize: 10));
              },
            ),
          ),
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 40,
              getTitlesWidget: (val, meta) => Text(
                _formatAngka(val),
                style: const TextStyle(fontSize: 10),
              ),
            ),
          ),
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        gridData: const FlGridData(show: true, drawVerticalLine: false),
        borderData: FlBorderData(show: false),
      ),
    );
  }

  String _formatAngka(double val) {
    if (val >= 1000) return '${(val / 1000).toStringAsFixed(1)}t';
    return val.toStringAsFixed(0);
  }
}

// ============================================================
// Daftar Catatan Panen
// ============================================================

class _CatatanPanenList extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final catatanAsync = ref.watch(catatanPanenProvider);

    return catatanAsync.when(
      loading: () => const SliverFillRemaining(
        child: Center(child: CircularProgressIndicator()),
      ),
      error: (err, _) => SliverFillRemaining(
        child: Center(child: Text('Gagal memuat: $err')),
      ),
      data: (response) {
        final catatan = response['data'] as List? ?? [];
        if (catatan.isEmpty) {
          return const SliverFillRemaining(
            child: Center(child: Text('Belum ada catatan panen')),
          );
        }

        return SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 80),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) {
                final item = catatan[index] as Map<String, dynamic>;
                return _CatatanPanenCard(item: item);
              },
              childCount: catatan.length,
            ),
          ),
        );
      },
    );
  }
}

class _CatatanPanenCard extends StatelessWidget {
  final Map<String, dynamic> item;

  const _CatatanPanenCard({required this.item});

  @override
  Widget build(BuildContext context) {
    final komoditas = item['komoditas'] as Map<String, dynamic>? ?? {};
    final lahan = item['lahan'] as Map<String, dynamic>? ?? {};
    final tglPanen = DateTime.tryParse(item['tgl_panen'] as String? ?? '');
    final fmt = DateFormat('d MMM yyyy', 'id_ID');

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: const Color(0xFFE8F5E9),
          child: Text(
            komoditas['nama']?.toString().substring(0, 1) ?? 'K',
            style: const TextStyle(
              color: Color(0xFF2D7D32),
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        title: Text(
          komoditas['nama']?.toString() ?? '-',
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(lahan['nama']?.toString() ?? '-'),
            Text(
              tglPanen != null ? fmt.format(tglPanen) : '-',
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              '${item['jumlah_panen']} ${komoditas['satuan'] ?? 'kg'}',
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                color: Color(0xFF2D7D32),
                fontSize: 14,
              ),
            ),
            if (item['kualitas'] != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF9C4),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Kualitas ${item['kualitas']}',
                  style: const TextStyle(fontSize: 10),
                ),
              ),
          ],
        ),
        isThreeLine: true,
      ),
    );
  }
}
