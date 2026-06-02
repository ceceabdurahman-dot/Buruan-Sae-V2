# 📊 Ceklis Progres Produksi Kode — Buruan Sae 2.0

> Update: 2026-05-30 | Status: **Produksi LENGKAP — frontend mobile & web-admin selesai** ✅

---

## ✅ FASE 0 — Setup Monorepo & Konfigurasi (SELESAI)

### Backend
- [x] `backend/package.json` — semua dependencies + sharp + testcontainers
- [x] `backend/tsconfig.json` — TypeScript strict config
- [x] `backend/.env.example` — template env lengkap (35 variabel)
- [x] `backend/src/server.ts` — entry point + graceful shutdown
- [x] `backend/src/app.ts` — buildApp(opts) + semua plugin + routes
- [x] `backend/src/plugins/prisma.ts` — Prisma plugin
- [x] `backend/src/plugins/redis.ts` — Redis plugin (ioredis)
- [x] `backend/src/plugins/minio.ts` — MinIO plugin (auto-bucket)
- [x] `backend/src/plugins/jwt.ts` — JWT + authenticate + requireRole
- [x] `backend/src/routes/health.ts` — /health + /health/ready
- [x] `backend/prisma/schema.prisma` — schema lengkap semua modul
- [x] `backend/Dockerfile` — multi-stage production build
- [x] `backend/Dockerfile.dev` — development hot-reload

### Web Admin (Next.js 14)
- [x] `web-admin/package.json` — semua dependencies
- [x] `web-admin/next.config.js` — rewrites, headers, image domains
- [x] `web-admin/tsconfig.json` — TypeScript strict + paths
- [x] `web-admin/tailwind.config.ts` — tema Buruan Sae (hijau + kuning)
- [x] `web-admin/src/app/layout.tsx` — RootLayout + metadata
- [x] `web-admin/src/app/globals.css` — CSS variables + Tailwind
- [x] `web-admin/src/app/providers.tsx` — SessionProvider + QueryClientProvider
- [x] `web-admin/src/app/page.tsx` — redirect ke /dashboard
- [x] `web-admin/src/lib/api-client.ts` — axios + session bearer injection
- [x] `web-admin/src/lib/utils.ts` — cn, formatRupiah, formatTanggal, dst.
- [x] `web-admin/Dockerfile` — standalone production
- [x] `web-admin/Dockerfile.dev` — development HMR

### Mobile (Flutter 3.22)
- [x] `mobile/pubspec.yaml` — semua dependencies Flutter
- [x] `mobile/lib/main.dart` — entry point + Firebase + Crashlytics
- [x] `mobile/lib/router/app_router.dart` — GoRouter + shell routes + guard
- [x] `mobile/lib/theme/app_theme.dart` — tema Material3 Buruan Sae

### Infrastructure
- [x] `docker-compose.yml` — PostgreSQL+PostGIS, Redis, MinIO, Backend, Web, Mailhog
- [x] `docker-compose.prod.yml` — production dengan Nginx, Prometheus, Grafana
- [x] `.github/workflows/ci.yml` — CI: backend test + web build + flutter analyze
- [x] `database/migrations/V001__initial_setup.sql` — Flyway migration awal

---

## ✅ FASE 1 — Infrastruktur (SELESAI)

- [x] `infra/nginx/nginx.conf` — nginx.conf production (gzip, rate limit, JSON log)
- [x] `infra/nginx/conf.d/api.conf` — vhost API HTTPS + rate limit auth
- [x] `infra/nginx/conf.d/admin.conf` — vhost Admin HTTPS + static cache
- [x] `infra/prometheus/prometheus.yml` — scrape backend, postgres, redis, nginx
- [x] `.github/workflows/deploy.yml` — CD: build Docker → push GHCR → deploy VPS SSH

---

## ✅ FASE 2 — Autentikasi (SELESAI)

- [x] `backend/src/modules/auth/auth.schema.ts` — Zod schemas: register, login, OTP, reset password
- [x] `backend/src/modules/auth/otp.service.ts` — OTP via Fonnte WhatsApp, cooldown, attempt limit
- [x] `backend/src/modules/auth/token.service.ts` — access token + refresh token rotation + Redis blacklist
- [x] `backend/src/modules/auth/auth.service.ts` — register (NIK encrypt AES-256-GCM + SHA-256 hash), login, refresh, logout, reset
- [x] `backend/src/routes/auth.ts` — 9 endpoints: register, otp/send, otp/verify, login, refresh, logout, password/forgot, password/reset, /me
- [x] `mobile/lib/core/network/api_client.dart` — Dio + auth interceptor + auto token refresh (separate Dio instance)
- [x] `mobile/lib/features/auth/data/providers/auth_provider.dart` — Riverpod auth state notifier

---

## ✅ FASE 3 — Modul Lahan (SELESAI)

- [x] `backend/src/modules/lahan/lahan.service.ts` — CRUD lahan + PostGIS bbox + verifikasi + GeoJSON FeatureCollection
- [x] `backend/src/routes/lahan.ts` — 6 endpoints: GET list, GET peta, GET detail, POST, PATCH, POST verifikasi
- [x] `mobile/lib/features/lahan/domain/models/lahan_model.dart` — LahanSingkat, LahanDetail JSON serializable
- [x] `mobile/lib/features/lahan/data/providers/lahan_provider.dart` — Riverpod: daftarLahan, petaLahan, detailLahan
- [x] `mobile/lib/features/lahan/presentation/pages/lahan_list_page.dart` — Tab Daftar + Tab Peta (flutter_map + PolygonLayer)

---

## ✅ FASE 4 — Modul Produksi (SELESAI)

- [x] `backend/src/modules/produksi/produksi.service.ts` — catatan panen + idempotency_key + batch sync + statistik
- [x] `backend/src/routes/produksi.ts` — 6 endpoints: catatan, catatan/batch, ringkasan, statistik, komoditas
- [x] `mobile/lib/features/produksi/presentation/pages/produksi_page.dart` — BarChart fl_chart (per bulan) + daftar catatan
- [x] `mobile/lib/features/produksi/presentation/widgets/tambah_panen_dialog.dart` — form panen + UUID idempotency
- [x] `mobile/lib/features/produksi/data/providers/produksi_provider.dart` — Riverpod providers + TambahPanenNotifier

---

## ✅ FASE 5 — Marketplace & Pembayaran (SELESAI)

- [x] `backend/src/modules/marketplace/marketplace.service.ts` — produk CRUD + pesanan + stok atomik
- [x] `backend/src/routes/marketplace.ts` — 8 endpoints: produk list/detail/create/update, pesanan create/list/bayar
- [x] `backend/src/modules/marketplace/pembayaran.service.ts` — Midtrans Snap + webhook SHA-512 + stok rollback

---

## ✅ FASE 6 — Agrowisata (SELESAI)

- [x] `backend/src/modules/agrowisata/agrowisata.service.ts` — paket wisata + booking + cek kapasitas aggregate
- [x] `backend/src/routes/agrowisata.ts` — 5 endpoints: paket list/detail/create, booking create/bayar

---

## ✅ FASE 7 — Komunitas (SELESAI)

- [x] `backend/src/modules/komunitas/komunitas.service.ts` — postingan + komentar + like + view_count + poin gamifikasi
- [x] `backend/src/routes/komunitas.ts` — 5 endpoints: postingan list/detail/create, komentar, like toggle

---

## ✅ FASE 8 — Edukasi (SELESAI)

- [x] `backend/src/modules/edukasi/edukasi.service.ts` — kursus + modul + progres belajar + +50 poin selesai
- [x] `backend/src/routes/edukasi.ts` — 4 endpoints: kursus list/detail/create, modul/selesai

---

## ✅ FASE 9 — Dashboard & Analytics (SELESAI)

- [x] `backend/src/modules/dashboard/dashboard.service.ts` — KPI cache Redis 5min + DAU/MAU tracking + produksi per kecamatan
- [x] `backend/src/routes/dashboard.ts` — 6 endpoints: kpi, produksi-per-kecamatan, top-petani, distribusi-lahan, aktivitas, track
- [x] `web-admin/src/app/(dashboard)/dashboard/page.tsx` — KpiCard + BarChart Recharts + top petani table
- [x] `web-admin/src/lib/api-client.ts` — axios + getSession() bearer injection
- [x] `web-admin/src/lib/utils.ts` — formatRupiah, formatTanggal, labelStatus, formatLuas, dll.

---

## ✅ FASE 10 — Notifikasi (SELESAI)

- [x] `backend/src/modules/notifikasi/notifikasi.service.ts` — FCM v1 batch (50/grup) + WhatsApp Fonnte + DB simpan + broadcast
- [x] `backend/src/routes/notifikasi.ts` — 5 endpoints: list, baca, baca-semua, fcm-token, broadcast

---

## ✅ FASE 11 — Upload & Manajemen File (SELESAI)

- [x] `backend/src/modules/upload/upload.service.ts` — sharp resize WebP 1280px+400px thumbnail + MinIO upload parallel + presigned URL
- [x] `backend/src/routes/pengguna.ts` — 5 endpoints: list admin, detail, profil, foto-profil, status, soft-delete

---

## ✅ FASE 12 — Keamanan & Middleware (SELESAI)

- [x] `backend/src/plugins/sanitize.ts` — XSS detection + HTML entity encode + 400 on attack
- [x] `backend/src/plugins/audit.ts` — onResponse hook → AuditLog untuk endpoint sensitif non-GET

---

## ✅ FASE 13 — Testing (SELESAI)

### Backend — Unit Tests (Vitest)
- [x] `backend/vitest.config.ts` — globals, setupFiles, coverage v8 (thresholds: branches 70%, functions/lines/statements 80%)
- [x] `backend/src/__tests__/setup.ts` — env vars mock + pino mock
- [x] `backend/src/__tests__/unit/auth.service.test.ts` — RegisterSchema, LoginSchema, VerifyOtpSchema, OtpService (4 skenario)
- [x] `backend/src/__tests__/unit/token.service.test.ts` — signAccessToken, createRefreshToken, validateRefreshToken (5 skenario), revokeRefreshToken, revokeAllUserTokens
- [x] `backend/src/__tests__/unit/produksi.service.test.ts` — tambahCatatanPanen (5 skenario), daftarCatatanPanen, daftarKomoditas, tambahCatatanBatch

### Backend — Integration Tests (Testcontainers)
- [x] `backend/src/__tests__/integration/auth.test.ts` — register, login, /me, refresh rotation, logout + invalidasi (PostgreSQL + Redis containers)
- [x] `backend/src/__tests__/integration/lahan.test.ts` — tambah lahan, daftar bbox PostGIS, detail GeoJSON, peta public, verifikasi role check

### Mobile — Widget Tests (Flutter)
- [x] `mobile/test/features/auth/login_page_test.dart` — render UI, validasi form, state loading, error display, navigasi, panggil service
- [x] `mobile/test/features/lahan/lahan_list_page_test.dart` — state loading/error, render daftar, badge status, tab peta, FAB, pull-to-refresh

---

## ✅ FASE 14 — Deployment & Produksi (SELESAI)

- [x] `backend/prisma/seed-production.ts` — Super Admin + 20 komoditas + 3 kelompok tani + 3 kursus edukasi awal
- [x] `infra/scripts/setup-prod.sh` — inisialisasi server: Docker, UFW, Fail2Ban, SSL, swap, cron backup
- [x] `infra/scripts/backup-db.sh` — backup PostgreSQL gzip + upload MinIO + retensi 30 hari + notifikasi Slack
- [x] `infra/scripts/rollback.sh` — rollback ke image tag sebelumnya + health check otomatis
- [x] `backend/src/routes/webhook.ts` — Midtrans webhook POST /webhook/midtrans (terpisah dari marketplace)

---

## ✅ FASE 15 — Frontend Mobile Flutter (SELESAI)

### Auth
- [x] `mobile/lib/features/auth/data/providers/auth_provider.dart` — AuthState + register, kirimOtp, verifikasiOtp, loginWithOtp, loginWithPassword, logout (fix: dart:convert import, namaLengkap, totalPoin fields)
- [x] `mobile/lib/features/auth/presentation/pages/login_page.dart` — Form identifier/password + toggle visibility + key widget test
- [x] `mobile/lib/features/auth/presentation/pages/register_page.dart` — NIK 16-digit + WA + peran ChoiceChip + UU PDP consent
- [x] `mobile/lib/features/auth/presentation/pages/otp_page.dart` — 6 TextControllers auto-advance + backspace detection + 60s cooldown Timer

### Core Shell
- [x] `mobile/lib/features/splash/presentation/pages/splash_page.dart` — AnimationController fade+scale + initialize auth + redirect
- [x] `mobile/lib/shared/widgets/main_scaffold.dart` — NavigationBar (Material3) + GoRouter path matching + 5 destinasi
- [x] `mobile/lib/features/dashboard/presentation/pages/dashboard_page.dart` — Wrapper → HomePage

### Dashboard
- [x] `mobile/lib/features/dashboard/presentation/pages/home_page.dart` — SliverAppBar + stats cards + menu grid + lahan list

### Lahan
- [x] `mobile/lib/features/lahan/presentation/pages/lahan_list_page.dart` — Tab daftar + Tab peta (flutter_map)
- [x] `mobile/lib/features/lahan/presentation/pages/lahan_detail_page.dart` — statistik + komoditas chips + riwayat panen

### Produksi
- [x] `mobile/lib/features/produksi/presentation/pages/produksi_page.dart` — BarChart fl_chart + daftar catatan
- [x] `mobile/lib/features/produksi/presentation/widgets/tambah_panen_dialog.dart` — form panen + UUID idempotency

### Marketplace
- [x] `mobile/lib/features/marketplace/data/providers/marketplace_provider.dart` — daftarProduk, detailProduk, daftarPesananSaya, BuatPesananNotifier
- [x] `mobile/lib/features/marketplace/presentation/pages/marketplace_page.dart` — Tab produk grid + tab pesanan + sort bar
- [x] `mobile/lib/features/marketplace/presentation/pages/detail_produk_page.dart` — foto + info penjual + jumlah stepper + CTA beli

### Agrowisata
- [x] `mobile/lib/features/agrowisata/data/providers/agrowisata_provider.dart` — daftarPaketWisata, detailPaketWisata, daftarBookingSaya, BuatBookingNotifier
- [x] `mobile/lib/features/agrowisata/presentation/pages/agrowisata_page.dart` — Tab paket + Tab booking + BottomSheet booking (date picker + stepper peserta)

### Komunitas
- [x] `mobile/lib/features/komunitas/presentation/pages/komunitas_page.dart` — sort chips + RefreshIndicator + PostinganCard + FAB
- [x] `mobile/lib/features/komunitas/presentation/pages/tulis_postingan_page.dart` — form kategori+judul+konten + TulisPostinganNotifier
- [x] `mobile/lib/features/komunitas/presentation/pages/detail_postingan_page.dart` — foto + konten + komentar list + input komentar inline

### Edukasi
- [x] `mobile/lib/features/edukasi/presentation/pages/edukasi_page.dart` — filter kategori + level + KursusCard grid
- [x] `mobile/lib/features/edukasi/presentation/pages/detail_kursus_page.dart` — header + deskripsi + daftar modul + progres bar + CTA daftar

### Profil
- [x] `mobile/lib/features/profil/presentation/pages/profil_page.dart` — avatar + peran badge + menu items + logout AlertDialog
- [x] `mobile/lib/features/profil/presentation/pages/edit_profil_page.dart` — form nama/email/WA + PATCH /pengguna/profil
- [x] `mobile/lib/features/profil/presentation/pages/ganti_password_page.dart` — form 3 field password + validasi syarat
- [x] `mobile/lib/features/profil/presentation/pages/poin_page.dart` — total poin header + cara mendapat poin + riwayat list
- [x] `mobile/lib/features/profil/presentation/pages/privasi_page.dart` — consent toggle UU PDP + hak data + hapus akun soft-delete

### Router
- [x] `mobile/lib/router/app_router.dart` — GoRouter lengkap: semua sub-routes (marketplace/:id, komunitas/tulis, komunitas/:id, edukasi/:id, profil/edit, profil/ganti-password, profil/poin, profasi/privasi)

## ✅ FASE 16 — Frontend Web Admin (SELESAI)

- [x] `web-admin/src/app/auth/login/page.tsx` — signIn('credentials') + toggle password + redirect /dashboard
- [x] `web-admin/src/app/(dashboard)/layout.tsx` — sidebar collapsible + user avatar + signOut
- [x] `web-admin/src/app/(dashboard)/pengguna/page.tsx` — tabel 7 kolom + search + peran filter + toggle aktif + pagination
- [x] `web-admin/src/app/(dashboard)/lahan/page.tsx` — list/map toggle + status filter + verifikasi inline + LahanMap dynamic import
- [x] `web-admin/src/app/(dashboard)/produksi/page.tsx` — year selector + BarChart kecamatan + top petani ranking
- [x] `web-admin/src/app/(dashboard)/marketplace/page.tsx` — tab pesanan/produk + status filter + orders table
- [x] `web-admin/src/app/(dashboard)/komunitas/page.tsx` — post cards + hapus + pin/unpin
- [x] `web-admin/src/app/(dashboard)/edukasi/page.tsx` — course grid + search + publish/unpublish
- [x] `web-admin/src/app/(dashboard)/agrowisata/page.tsx` — paket grid + booking table
- [x] `web-admin/src/components/maps/LahanMap.tsx` — Leaflet SSR-safe + polygon render + popup + onSelect callback

---

## 📈 Ringkasan Akhir

| Fase | Status | File Produksi |
|------|--------|--------------|
| Fase 0 — Setup | ✅ Selesai | 30 file |
| Fase 1 — Infrastruktur | ✅ Selesai | 5 file |
| Fase 2 — Autentikasi | ✅ Selesai | 7 file |
| Fase 3 — Lahan | ✅ Selesai | 5 file |
| Fase 4 — Produksi | ✅ Selesai | 5 file |
| Fase 5 — Marketplace | ✅ Selesai | 3 file |
| Fase 6 — Agrowisata | ✅ Selesai | 2 file |
| Fase 7 — Komunitas | ✅ Selesai | 2 file |
| Fase 8 — Edukasi | ✅ Selesai | 2 file |
| Fase 9 — Dashboard | ✅ Selesai | 5 file |
| Fase 10 — Notifikasi | ✅ Selesai | 2 file |
| Fase 11 — Upload File | ✅ Selesai | 2 file |
| Fase 12 — Keamanan | ✅ Selesai | 2 file |
| Fase 13 — Testing | ✅ Selesai | 8 file |
| Fase 14 — Deployment | ✅ Selesai | 5 file |
| Fase 15 — Mobile Flutter | ✅ Selesai | 26 file |
| Fase 16 — Web Admin | ✅ Selesai | 10 file |

**Total: 121 file kode produksi** | **16/16 Fase = 100% ✅**

---

## 🗂️ Struktur File Kode Sumber

```
Kode_Sumber/
├── backend/
│   ├── prisma/
│   │   └── seed-production.ts          ← Fase 14
│   ├── src/
│   │   ├── __tests__/
│   │   │   ├── setup.ts                ← Fase 13
│   │   │   ├── unit/
│   │   │   │   ├── auth.service.test.ts
│   │   │   │   ├── token.service.test.ts
│   │   │   │   └── produksi.service.test.ts
│   │   │   └── integration/
│   │   │       ├── auth.test.ts
│   │   │       └── lahan.test.ts
│   │   ├── modules/
│   │   │   ├── auth/          (schema, otp, token, auth service)
│   │   │   ├── lahan/
│   │   │   ├── produksi/
│   │   │   ├── marketplace/   (marketplace + pembayaran)
│   │   │   ├── agrowisata/
│   │   │   ├── komunitas/
│   │   │   ├── edukasi/
│   │   │   ├── dashboard/
│   │   │   ├── notifikasi/
│   │   │   └── upload/
│   │   ├── plugins/           (prisma, redis, minio, jwt, sanitize, audit)
│   │   └── routes/            (semua 11 route + health + webhook)
│   ├── .env.example
│   ├── package.json
│   ├── vitest.config.ts
│   ├── Dockerfile
│   └── Dockerfile.dev
├── web-admin/
│   └── src/app/(dashboard)/dashboard/page.tsx
├── mobile/
│   ├── lib/
│   │   ├── core/network/api_client.dart
│   │   ├── features/auth/
│   │   ├── features/lahan/
│   │   └── features/produksi/
│   └── test/
│       ├── features/auth/login_page_test.dart
│       └── features/lahan/lahan_list_page_test.dart
├── database/migrations/V001__initial_setup.sql
├── infra/
│   ├── nginx/
│   ├── prometheus/
│   └── scripts/               ← Fase 14
│       ├── setup-prod.sh
│       ├── backup-db.sh
│       └── rollback.sh
├── docker-compose.yml
├── docker-compose.prod.yml
├── .github/workflows/
│   ├── ci.yml
│   └── deploy.yml
└── PROGRES_PRODUKSI.md
```
