import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../auth/data/providers/auth_provider.dart';
import '../../../lahan/data/providers/lahan_provider.dart';
import '../../../produksi/data/providers/produksi_provider.dart';

// ============================================================
// HomePage — Dashboard Utama Petani Buruan Sae 2.0
// ============================================================

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateNotifierProvider);
    final daftarLahan = ref.watch(daftarLahanProvider);
    final tahunIni = DateTime.now().year;
    final ringkasan = ref.watch(ringkasanProduksiProvider(tahunIni));
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      body: CustomScrollView(
        slivers: [
          // ── App Bar ──────────────────────────────────────
          SliverAppBar(
            expandedHeight: 140,
            floating: false,
            pinned: true,
            backgroundColor: theme.colorScheme.primary,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      theme.colorScheme.primary,
                      theme.colorScheme.primary.withOpacity(0.75),
                    ],
                  ),
                ),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _salam(),
                                    style: const TextStyle(
                                      color: Colors.white70, fontSize: 13),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    authState.namaLengkap ?? 'Petani',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                            // Avatar
                            CircleAvatar(
                              radius: 22,
                              backgroundColor: Colors.white.withOpacity(0.2),
                              child: Text(
                                (authState.namaLengkap ?? 'P')[0],
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 18,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              collapseMode: CollapseMode.pin,
            ),
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Kartu Ringkasan ───────────────────────
                  _SectionTitle(title: 'Ringkasan Saya'),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _StatCard(
                          icon: '🗺️',
                          label: 'Lahan',
                          value: daftarLahan.when(
                            data: (list) => '${list.length}',
                            loading: () => '...',
                            error: (_, __) => '-',
                          ),
                          color: Colors.green.shade50,
                          onTap: () => context.go('/lahan'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _StatCard(
                          icon: '🌾',
                          label: 'Panen ${tahunIni}',
                          value: ringkasan.when(
                            data: (data) {
                              final total = data.fold<double>(
                                0, (sum, r) => sum + (r['total_kg'] as num).toDouble());
                              return '${total.toStringAsFixed(0)} kg';
                            },
                            loading: () => '...',
                            error: (_, __) => '-',
                          ),
                          color: Colors.amber.shade50,
                          onTap: () => context.go('/produksi'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // ── Menu Cepat ────────────────────────────
                  _SectionTitle(title: 'Menu Utama'),
                  const SizedBox(height: 12),
                  GridView.count(
                    crossAxisCount: 4,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 0.85,
                    children: [
                      _MenuIcon(emoji: '🗺️', label: 'Lahan', onTap: () => context.go('/lahan')),
                      _MenuIcon(emoji: '🌾', label: 'Produksi', onTap: () => context.go('/produksi')),
                      _MenuIcon(emoji: '🛒', label: 'Pasar', onTap: () => context.go('/marketplace')),
                      _MenuIcon(emoji: '🌿', label: 'Wisata', onTap: () => context.go('/agrowisata')),
                      _MenuIcon(emoji: '👥', label: 'Komunitas', onTap: () => context.go('/komunitas')),
                      _MenuIcon(emoji: '📚', label: 'Edukasi', onTap: () => context.go('/edukasi')),
                      _MenuIcon(emoji: '🔔', label: 'Notifikasi', onTap: () => context.go('/notifikasi')),
                      _MenuIcon(emoji: '👤', label: 'Profil', onTap: () => context.go('/profil')),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // ── Lahan Terdekat ────────────────────────
                  _SectionTitle(
                    title: 'Lahan Saya',
                    action: TextButton(
                      onPressed: () => context.go('/lahan'),
                      child: const Text('Lihat semua →', style: TextStyle(fontSize: 12)),
                    ),
                  ),
                  const SizedBox(height: 8),
                  daftarLahan.when(
                    loading: () => const _LahanSkeleton(),
                    error: (e, _) => _ErrorCard(message: e.toString()),
                    data: (list) => list.isEmpty
                        ? _EmptyLahan(onTap: () => context.go('/lahan'))
                        : Column(
                            children: list.take(3).map((l) => _LahanCard(
                              nama: l.nama,
                              lokasi: '${l.kelurahan}, ${l.kecamatan}',
                              luas: l.luasM2,
                              status: l.status,
                              onTap: () => context.go('/lahan/${l.id}'),
                            )).toList(),
                          ),
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _salam() {
    final jam = DateTime.now().hour;
    if (jam < 11) return 'Selamat Pagi 🌅';
    if (jam < 15) return 'Selamat Siang ☀️';
    if (jam < 18) return 'Selamat Sore 🌤️';
    return 'Selamat Malam 🌙';
  }
}

// ── Widget Helpers ────────────────────────────────────────────

class _SectionTitle extends StatelessWidget {
  final String title;
  final Widget? action;
  const _SectionTitle({required this.title, this.action});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
        const Spacer(),
        if (action != null) action!,
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final String icon, label, value;
  final Color color;
  final VoidCallback onTap;
  const _StatCard({required this.icon, required this.label, required this.value,
    required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(icon, style: const TextStyle(fontSize: 24)),
            const SizedBox(height: 8),
            Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            Text(label, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
          ],
        ),
      ),
    );
  }
}

class _MenuIcon extends StatelessWidget {
  final String emoji, label;
  final VoidCallback onTap;
  const _MenuIcon({required this.emoji, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 52, height: 52,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 6, offset: const Offset(0, 2)),
              ],
            ),
            child: Center(child: Text(emoji, style: const TextStyle(fontSize: 24))),
          ),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(fontSize: 11), textAlign: TextAlign.center),
        ],
      ),
    );
  }
}

class _LahanCard extends StatelessWidget {
  final String nama, lokasi, status;
  final double luas;
  final VoidCallback onTap;
  const _LahanCard({required this.nama, required this.lokasi, required this.luas,
    required this.status, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isAktif = status == 'AKTIF';
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Row(
          children: [
            Container(
              width: 40, height: 40,
              decoration: BoxDecoration(
                color: isAktif ? Colors.green.shade50 : Colors.orange.shade50,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Center(child: Text('🗺️', style: const TextStyle(fontSize: 20))),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(nama, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  Text(lokasi, style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: isAktif ? Colors.green.shade50 : Colors.orange.shade50,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    isAktif ? 'Aktif' : 'Review',
                    style: TextStyle(
                      fontSize: 11,
                      color: isAktif ? Colors.green.shade700 : Colors.orange.shade700,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                const SizedBox(height: 2),
                Text('${luas.toStringAsFixed(0)} m²',
                  style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyLahan extends StatelessWidget {
  final VoidCallback onTap;
  const _EmptyLahan({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.green.shade50,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.green.shade100, style: BorderStyle.solid),
        ),
        child: Column(
          children: [
            const Text('🌱', style: TextStyle(fontSize: 32)),
            const SizedBox(height: 8),
            const Text('Belum ada lahan terdaftar',
              style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            Text('Tap untuk mendaftarkan lahan pertama Anda',
              style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
              textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

class _LahanSkeleton extends StatelessWidget {
  const _LahanSkeleton();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(2, (_) => Container(
        height: 68,
        margin: const EdgeInsets.only(bottom: 8),
        decoration: BoxDecoration(
          color: Colors.grey.shade100,
          borderRadius: BorderRadius.circular(12),
        ),
      )),
    );
  }
}

class _ErrorCard extends StatelessWidget {
  final String message;
  const _ErrorCard({required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text('Gagal memuat: $message',
        style: TextStyle(color: Colors.red.shade700, fontSize: 13)),
    );
  }
}
