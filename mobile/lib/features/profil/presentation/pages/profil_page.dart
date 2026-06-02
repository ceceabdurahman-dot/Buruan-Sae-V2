import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../auth/data/providers/auth_provider.dart';

// ============================================================
// ProfilPage — Profil Pengguna Buruan Sae 2.0
// ============================================================

class ProfilPage extends ConsumerWidget {
  const ProfilPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateNotifierProvider);
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(title: const Text('Profil Saya'), centerTitle: true),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // ── Header Profil ─────────────────────────────────
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(24, 28, 24, 28),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 6)],
              ),
              child: Column(
                children: [
                  // Avatar
                  Stack(
                    children: [
                      CircleAvatar(
                        radius: 44,
                        backgroundColor: theme.colorScheme.primary.withOpacity(0.15),
                        child: Text(
                          (authState.namaLengkap ?? 'P')[0],
                          style: TextStyle(
                            fontSize: 36,
                            fontWeight: FontWeight.bold,
                            color: theme.colorScheme.primary,
                          ),
                        ),
                      ),
                      Positioned(
                        bottom: 0, right: 0,
                        child: GestureDetector(
                          onTap: () {},
                          child: Container(
                            width: 28, height: 28,
                            decoration: BoxDecoration(
                              color: theme.colorScheme.primary,
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 2),
                            ),
                            child: const Icon(Icons.camera_alt, color: Colors.white, size: 14),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    authState.namaLengkap ?? '—',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  if (authState.peran != null)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        (authState.peran ?? '').replaceAll('_', ' '),
                        style: TextStyle(
                          fontSize: 12,
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // ── Menu Profil ───────────────────────────────────
            Container(
              color: Colors.white,
              child: Column(
                children: [
                  _ProfilMenuItem(
                    icon: Icons.person_outline,
                    label: 'Edit Profil',
                    onTap: () => context.push('/profil/edit'),
                  ),
                  _Divider(),
                  _ProfilMenuItem(
                    icon: Icons.lock_outline,
                    label: 'Ubah Password',
                    onTap: () => context.push('/profil/ganti-password'),
                  ),
                  _Divider(),
                  _ProfilMenuItem(
                    icon: Icons.notifications_outlined,
                    label: 'Pengaturan Notifikasi',
                    onTap: () {},
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            Container(
              color: Colors.white,
              child: Column(
                children: [
                  _ProfilMenuItem(
                    icon: Icons.star_outline,
                    label: 'Poin Saya',
                    trailing: _PoinBadge(poin: authState.totalPoin ?? 0),
                    onTap: () => context.push('/profil/poin'),
                  ),
                  _Divider(),
                  _ProfilMenuItem(
                    icon: Icons.history,
                    label: 'Riwayat Aktivitas',
                    onTap: () {},
                  ),
                  _Divider(),
                  _ProfilMenuItem(
                    icon: Icons.privacy_tip_outlined,
                    label: 'Kebijakan Privasi & Consent',
                    onTap: () => context.push('/profil/privasi'),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            Container(
              color: Colors.white,
              child: Column(
                children: [
                  _ProfilMenuItem(
                    icon: Icons.help_outline,
                    label: 'Bantuan & FAQ',
                    onTap: () {},
                  ),
                  _Divider(),
                  _ProfilMenuItem(
                    icon: Icons.info_outline,
                    label: 'Tentang Aplikasi',
                    trailing: const Text('v2.0.0',
                      style: TextStyle(fontSize: 12, color: Colors.grey)),
                    onTap: () {},
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // ── Tombol Logout ─────────────────────────────────
            Container(
              color: Colors.white,
              child: _ProfilMenuItem(
                icon: Icons.logout,
                label: 'Keluar',
                iconColor: Colors.red.shade600,
                textColor: Colors.red.shade600,
                showArrow: false,
                onTap: () => _konfirmasiLogout(context, ref),
              ),
            ),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  void _konfirmasiLogout(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Keluar dari Akun'),
        content: const Text('Apakah Anda yakin ingin keluar?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Batal'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await ref.read(authStateNotifierProvider.notifier).logout();
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red.shade600),
            child: const Text('Keluar', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}

class _ProfilMenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final Widget? trailing;
  final Color? iconColor;
  final Color? textColor;
  final bool showArrow;
  final VoidCallback onTap;

  const _ProfilMenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.trailing,
    this.iconColor,
    this.textColor,
    this.showArrow = true,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        child: Row(
          children: [
            Icon(icon, size: 20, color: iconColor ?? Colors.grey.shade700),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  color: textColor ?? Colors.grey.shade900,
                ),
              ),
            ),
            if (trailing != null) trailing!
            else if (showArrow)
              Icon(Icons.chevron_right, color: Colors.grey.shade400, size: 18),
          ],
        ),
      ),
    );
  }
}

class _Divider extends StatelessWidget {
  @override
  Widget build(BuildContext context) =>
    Divider(height: 1, thickness: 1, color: Colors.grey.shade100, indent: 54);
}

class _PoinBadge extends StatelessWidget {
  final int poin;
  const _PoinBadge({required this.poin});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
    decoration: BoxDecoration(
      color: const Color(0xFFF9A825).withOpacity(0.15),
      borderRadius: BorderRadius.circular(20),
    ),
    child: Text(
      '⭐ $poin poin',
      style: const TextStyle(fontSize: 12, color: Color(0xFFF9A825),
        fontWeight: FontWeight.bold),
    ),
  );
}
