-- ============================================================
-- Migrasi Awal: Buruan Sae 2.0
-- Di-generate dari: schema.prisma
-- Tanggal: 2026-05-30
-- ============================================================

-- CreateExtension (aman dijalankan berulang karena IF NOT EXISTS)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE "PeranPengguna" AS ENUM (
    'PETANI',
    'KADER_KELURAHAN',
    'KOORDINATOR_KECAMATAN',
    'PENGELOLA_WISATA',
    'UMKM',
    'KONSUMEN',
    'ADMIN_DINAS',
    'SUPER_ADMIN'
);

CREATE TYPE "StatusLahan" AS ENUM (
    'TERSEDIA',
    'PENGAJUAN',
    'AKTIF',
    'TIDAK_AKTIF',
    'DITOLAK'
);

CREATE TYPE "StatusPesanan" AS ENUM (
    'PENDING',
    'DIKONFIRMASI',
    'DIPROSES',
    'DIKIRIM',
    'SELESAI',
    'DIBATALKAN'
);

CREATE TYPE "StatusPembayaran" AS ENUM (
    'PENDING',
    'SUKSES',
    'GAGAL',
    'EXPIRE',
    'REFUND'
);

CREATE TYPE "StatusBooking" AS ENUM (
    'PENDING',
    'DIKONFIRMASI',
    'CHECKIN',
    'SELESAI',
    'DIBATALKAN'
);

CREATE TYPE "KategoriKomoditas" AS ENUM (
    'SAYURAN',
    'BUAH',
    'HERBAL',
    'MICROGREEN',
    'REMPAH',
    'LAINNYA'
);

CREATE TYPE "TipeNotifikasi" AS ENUM (
    'PUSH_FCM',
    'WHATSAPP',
    'EMAIL',
    'IN_APP'
);

-- ============================================================
-- TABEL UTAMA
-- ============================================================

-- CreateTable: pengguna
CREATE TABLE "pengguna" (
    "id"               UUID           NOT NULL DEFAULT uuid_generate_v4(),
    "nama"             VARCHAR(100)   NOT NULL,
    "email"            VARCHAR(150)   UNIQUE,
    "nomor_wa"         VARCHAR(20)    UNIQUE,
    "nik_encrypted"    TEXT,
    "nik_hash"         CHAR(64)       UNIQUE,
    "password_hash"    TEXT           NOT NULL,
    "peran"            "PeranPengguna" NOT NULL DEFAULT 'PETANI',
    "kecamatan"        VARCHAR(50),
    "kelurahan"        VARCHAR(50),
    "foto_url"         TEXT,
    "is_aktif"         BOOLEAN        NOT NULL DEFAULT true,
    "is_terverifikasi" BOOLEAN        NOT NULL DEFAULT false,
    "fcm_token"        TEXT,
    "created_at"       TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"       TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pengguna_pkey" PRIMARY KEY ("id")
);

-- CreateTable: refresh_token
CREATE TABLE "refresh_token" (
    "id"          UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "pengguna_id" UUID         NOT NULL,
    "token_hash"  CHAR(64)     NOT NULL,
    "expires_at"  TIMESTAMP(3) NOT NULL,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_revoked"  BOOLEAN      NOT NULL DEFAULT false,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable: audit_log
CREATE TABLE "audit_log" (
    "id"          UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "pengguna_id" UUID,
    "aksi"        VARCHAR(50)  NOT NULL,
    "resource"    VARCHAR(50)  NOT NULL,
    "resource_id" VARCHAR(50),
    "detail"      JSONB,
    "ip_address"  VARCHAR(45),
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable: kelompok_tani
CREATE TABLE "kelompok_tani" (
    "id"             UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "nama"           VARCHAR(150) NOT NULL,
    "kecamatan"      VARCHAR(50)  NOT NULL,
    "kelurahan"      VARCHAR(50)  NOT NULL,
    "deskripsi"      TEXT,
    "foto_url"       TEXT,
    "qr_static_code" VARCHAR(50),
    "qr_static_url"  TEXT,
    "is_aktif"       BOOLEAN      NOT NULL DEFAULT true,
    "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kelompok_tani_pkey" PRIMARY KEY ("id")
);

-- CreateTable: anggota_kelompok
CREATE TABLE "anggota_kelompok" (
    "id"               UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "kelompok_id"      UUID         NOT NULL,
    "pengguna_id"      UUID         NOT NULL,
    "peran_kelompok"   VARCHAR(30)  NOT NULL DEFAULT 'ANGGOTA',
    "tanggal_bergabung" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_aktif"         BOOLEAN      NOT NULL DEFAULT true,

    CONSTRAINT "anggota_kelompok_pkey" PRIMARY KEY ("id")
);

-- CreateTable: komoditas
CREATE TABLE "komoditas" (
    "id"        UUID                NOT NULL DEFAULT uuid_generate_v4(),
    "nama"      VARCHAR(80)         NOT NULL,
    "nama_latin" VARCHAR(100),
    "satuan"    VARCHAR(20)         NOT NULL,
    "kategori"  "KategoriKomoditas" NOT NULL DEFAULT 'SAYURAN',
    "is_aktif"  BOOLEAN             NOT NULL DEFAULT true,

    CONSTRAINT "komoditas_pkey" PRIMARY KEY ("id")
);

-- CreateTable: lahan
CREATE TABLE "lahan" (
    "id"         UUID          NOT NULL DEFAULT uuid_generate_v4(),
    "nama"       VARCHAR(100)  NOT NULL,
    "pemilik_id" UUID          NOT NULL,
    "kelompok_id" UUID,
    "status"     "StatusLahan" NOT NULL DEFAULT 'PENGAJUAN',
    "jenis"      VARCHAR(30)   NOT NULL,
    "luas_m2"    DECIMAL(10,2),
    "alamat"     TEXT,
    "kecamatan"  VARCHAR(50)   NOT NULL,
    "kelurahan"  VARCHAR(50)   NOT NULL,
    "catatan"    TEXT,
    "created_at" TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lahan_pkey" PRIMARY KEY ("id")
);

-- CreateTable: foto_lahan
CREATE TABLE "foto_lahan" (
    "id"         UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "lahan_id"   UUID         NOT NULL,
    "url"        TEXT         NOT NULL,
    "urutan"     INTEGER      NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "foto_lahan_pkey" PRIMARY KEY ("id")
);

-- CreateTable: catatan_panen
CREATE TABLE "catatan_panen" (
    "id"              UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "lahan_id"        UUID         NOT NULL,
    "pengguna_id"     UUID         NOT NULL,
    "komoditas_id"    UUID         NOT NULL,
    "jumlah"          DECIMAL(10,3) NOT NULL,
    "satuan"          VARCHAR(20)  NOT NULL,
    "tanggal_panen"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "catatan"         TEXT,
    "foto_url"        TEXT,
    "is_offline"      BOOLEAN      NOT NULL DEFAULT false,
    "idempotency_key" VARCHAR(100) UNIQUE,
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "synced_at"       TIMESTAMP(3),

    CONSTRAINT "catatan_panen_pkey" PRIMARY KEY ("id")
);

-- CreateTable: produk_marketplace
CREATE TABLE "produk_marketplace" (
    "id"         UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "penjual_id" UUID         NOT NULL,
    "nama"       VARCHAR(100) NOT NULL,
    "deskripsi"  TEXT,
    "kategori"   VARCHAR(30)  NOT NULL,
    "harga"      DECIMAL(12,0) NOT NULL,
    "stok"       INTEGER      NOT NULL DEFAULT 0,
    "satuan"     VARCHAR(20)  NOT NULL,
    "foto_url"   TEXT,
    "is_aktif"   BOOLEAN      NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "produk_marketplace_pkey" PRIMARY KEY ("id")
);

-- CreateTable: pesanan
CREATE TABLE "pesanan" (
    "id"          UUID           NOT NULL DEFAULT uuid_generate_v4(),
    "pembeli_id"  UUID           NOT NULL,
    "penjual_id"  UUID           NOT NULL,
    "status"      "StatusPesanan" NOT NULL DEFAULT 'PENDING',
    "total"       DECIMAL(14,0)  NOT NULL,
    "catatan"     TEXT,
    "created_at"  TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pesanan_pkey" PRIMARY KEY ("id")
);

-- CreateTable: detail_pesanan
CREATE TABLE "detail_pesanan" (
    "id"           UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "pesanan_id"   UUID         NOT NULL,
    "produk_id"    UUID         NOT NULL,
    "qty"          INTEGER      NOT NULL,
    "harga_satuan" DECIMAL(12,0) NOT NULL,

    CONSTRAINT "detail_pesanan_pkey" PRIMARY KEY ("id")
);

-- CreateTable: paket_wisata
CREATE TABLE "paket_wisata" (
    "id"          UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "nama"        VARCHAR(100) NOT NULL,
    "deskripsi"   TEXT,
    "harga"       DECIMAL(12,0) NOT NULL,
    "durasi_jam"  INTEGER      NOT NULL DEFAULT 2,
    "kapasitas"   INTEGER      NOT NULL DEFAULT 20,
    "foto_url"    TEXT,
    "is_aktif"    BOOLEAN      NOT NULL DEFAULT true,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paket_wisata_pkey" PRIMARY KEY ("id")
);

-- CreateTable: booking_wisata
CREATE TABLE "booking_wisata" (
    "id"             UUID           NOT NULL DEFAULT uuid_generate_v4(),
    "paket_id"       UUID           NOT NULL,
    "pengguna_id"    UUID           NOT NULL,
    "tanggal"        DATE           NOT NULL,
    "jumlah_peserta" INTEGER        NOT NULL,
    "status"         "StatusBooking" NOT NULL DEFAULT 'PENDING',
    "qr_code"        VARCHAR(100),
    "catatan"        TEXT,
    "checkin_at"     TIMESTAMP(3),
    "created_at"     TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_wisata_pkey" PRIMARY KEY ("id")
);

-- CreateTable: transaksi_pembayaran
CREATE TABLE "transaksi_pembayaran" (
    "id"          UUID              NOT NULL DEFAULT uuid_generate_v4(),
    "pesanan_id"  UUID              UNIQUE,
    "booking_id"  UUID              UNIQUE,
    "order_id"    VARCHAR(100)      NOT NULL,
    "metode"      VARCHAR(30),
    "status"      "StatusPembayaran" NOT NULL DEFAULT 'PENDING',
    "nominal"     DECIMAL(14,0)     NOT NULL,
    "snap_token"  TEXT,
    "qris_url"    TEXT,
    "midtrans_id" VARCHAR(100),
    "expired_at"  TIMESTAMP(3),
    "paid_at"     TIMESTAMP(3),
    "created_at"  TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3)      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaksi_pembayaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable: kursus
CREATE TABLE "kursus" (
    "id"           UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "judul"        VARCHAR(150) NOT NULL,
    "deskripsi"    TEXT,
    "level"        VARCHAR(20)  NOT NULL,
    "kategori"     VARCHAR(50)  NOT NULL,
    "foto_cover"   TEXT,
    "durasi_menit" INTEGER      NOT NULL DEFAULT 60,
    "is_aktif"     BOOLEAN      NOT NULL DEFAULT true,
    "pembuat_id"   UUID,
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kursus_pkey" PRIMARY KEY ("id")
);

-- CreateTable: modul_kursus
CREATE TABLE "modul_kursus" (
    "id"           UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "kursus_id"    UUID         NOT NULL,
    "judul"        VARCHAR(150) NOT NULL,
    "urutan"       INTEGER      NOT NULL,
    "tipe"         VARCHAR(20)  NOT NULL,
    "konten"       JSONB,
    "durasi_menit" INTEGER      NOT NULL DEFAULT 10,

    CONSTRAINT "modul_kursus_pkey" PRIMARY KEY ("id")
);

-- CreateTable: progres_belajar
CREATE TABLE "progres_belajar" (
    "id"          UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "pengguna_id" UUID         NOT NULL,
    "kursus_id"   UUID         NOT NULL,
    "persen"      INTEGER      NOT NULL DEFAULT 0,
    "selesai_at"  TIMESTAMP(3),
    "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progres_belajar_pkey" PRIMARY KEY ("id")
);

-- CreateTable: poin_pengguna
CREATE TABLE "poin_pengguna" (
    "id"          UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "pengguna_id" UUID         NOT NULL,
    "total_poin"  INTEGER      NOT NULL DEFAULT 0,
    "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "poin_pengguna_pkey" PRIMARY KEY ("id")
);

-- CreateTable: consent_pengguna
CREATE TABLE "consent_pengguna" (
    "id"           UUID         NOT NULL DEFAULT uuid_generate_v4(),
    "pengguna_id"  UUID         NOT NULL,
    "tipe_dokumen" VARCHAR(30)  NOT NULL,
    "versi"        VARCHAR(10)  NOT NULL,
    "disetujui"    BOOLEAN      NOT NULL DEFAULT false,
    "ip_address"   VARCHAR(45),
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_pengguna_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- INDEX
-- ============================================================

CREATE UNIQUE INDEX "refresh_token_token_hash_key"   ON "refresh_token"("token_hash");
CREATE        INDEX "refresh_token_pengguna_id_idx"  ON "refresh_token"("pengguna_id");

CREATE        INDEX "audit_log_pengguna_id_idx"      ON "audit_log"("pengguna_id");
CREATE        INDEX "audit_log_created_at_idx"       ON "audit_log"("created_at");

CREATE UNIQUE INDEX "kelompok_tani_nama_key"         ON "kelompok_tani"("nama");

CREATE UNIQUE INDEX "anggota_kelompok_kelompok_id_pengguna_id_key"
    ON "anggota_kelompok"("kelompok_id", "pengguna_id");

CREATE UNIQUE INDEX "komoditas_nama_key"             ON "komoditas"("nama");

CREATE        INDEX "lahan_pemilik_id_idx"           ON "lahan"("pemilik_id");
CREATE        INDEX "lahan_kecamatan_idx"            ON "lahan"("kecamatan");

CREATE        INDEX "catatan_panen_lahan_id_idx"     ON "catatan_panen"("lahan_id");
CREATE        INDEX "catatan_panen_pengguna_id_idx"  ON "catatan_panen"("pengguna_id");
CREATE        INDEX "catatan_panen_tanggal_panen_idx" ON "catatan_panen"("tanggal_panen");

CREATE        INDEX "produk_marketplace_penjual_id_idx" ON "produk_marketplace"("penjual_id");

CREATE        INDEX "pesanan_pembeli_id_idx"         ON "pesanan"("pembeli_id");
CREATE        INDEX "pesanan_penjual_id_idx"         ON "pesanan"("penjual_id");

CREATE UNIQUE INDEX "transaksi_pembayaran_order_id_key" ON "transaksi_pembayaran"("order_id");
CREATE        INDEX "transaksi_pembayaran_order_id_idx" ON "transaksi_pembayaran"("order_id");
CREATE        INDEX "transaksi_pembayaran_status_idx"   ON "transaksi_pembayaran"("status");

CREATE        INDEX "booking_wisata_tanggal_idx"     ON "booking_wisata"("tanggal");

CREATE UNIQUE INDEX "progres_belajar_pengguna_id_kursus_id_key"
    ON "progres_belajar"("pengguna_id", "kursus_id");

CREATE UNIQUE INDEX "poin_pengguna_pengguna_id_key"  ON "poin_pengguna"("pengguna_id");

CREATE UNIQUE INDEX "consent_pengguna_pengguna_id_tipe_dokumen_versi_key"
    ON "consent_pengguna"("pengguna_id", "tipe_dokumen", "versi");

-- ============================================================
-- FOREIGN KEYS
-- ============================================================

ALTER TABLE "refresh_token"
    ADD CONSTRAINT "refresh_token_pengguna_id_fkey"
    FOREIGN KEY ("pengguna_id") REFERENCES "pengguna"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "audit_log"
    ADD CONSTRAINT "audit_log_pengguna_id_fkey"
    FOREIGN KEY ("pengguna_id") REFERENCES "pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "anggota_kelompok"
    ADD CONSTRAINT "anggota_kelompok_kelompok_id_fkey"
    FOREIGN KEY ("kelompok_id") REFERENCES "kelompok_tani"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "anggota_kelompok"
    ADD CONSTRAINT "anggota_kelompok_pengguna_id_fkey"
    FOREIGN KEY ("pengguna_id") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "lahan"
    ADD CONSTRAINT "lahan_pemilik_id_fkey"
    FOREIGN KEY ("pemilik_id") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "lahan"
    ADD CONSTRAINT "lahan_kelompok_id_fkey"
    FOREIGN KEY ("kelompok_id") REFERENCES "kelompok_tani"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "foto_lahan"
    ADD CONSTRAINT "foto_lahan_lahan_id_fkey"
    FOREIGN KEY ("lahan_id") REFERENCES "lahan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "catatan_panen"
    ADD CONSTRAINT "catatan_panen_lahan_id_fkey"
    FOREIGN KEY ("lahan_id") REFERENCES "lahan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "catatan_panen"
    ADD CONSTRAINT "catatan_panen_pengguna_id_fkey"
    FOREIGN KEY ("pengguna_id") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "catatan_panen"
    ADD CONSTRAINT "catatan_panen_komoditas_id_fkey"
    FOREIGN KEY ("komoditas_id") REFERENCES "komoditas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "pesanan"
    ADD CONSTRAINT "pesanan_pembeli_id_fkey"
    FOREIGN KEY ("pembeli_id") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "pesanan"
    ADD CONSTRAINT "pesanan_penjual_id_fkey"
    FOREIGN KEY ("penjual_id") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "detail_pesanan"
    ADD CONSTRAINT "detail_pesanan_pesanan_id_fkey"
    FOREIGN KEY ("pesanan_id") REFERENCES "pesanan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "detail_pesanan"
    ADD CONSTRAINT "detail_pesanan_produk_id_fkey"
    FOREIGN KEY ("produk_id") REFERENCES "produk_marketplace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "booking_wisata"
    ADD CONSTRAINT "booking_wisata_paket_id_fkey"
    FOREIGN KEY ("paket_id") REFERENCES "paket_wisata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "booking_wisata"
    ADD CONSTRAINT "booking_wisata_pengguna_id_fkey"
    FOREIGN KEY ("pengguna_id") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "transaksi_pembayaran"
    ADD CONSTRAINT "transaksi_pembayaran_pesanan_id_fkey"
    FOREIGN KEY ("pesanan_id") REFERENCES "pesanan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "transaksi_pembayaran"
    ADD CONSTRAINT "transaksi_pembayaran_booking_id_fkey"
    FOREIGN KEY ("booking_id") REFERENCES "booking_wisata"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "kursus"
    ADD CONSTRAINT "kursus_pembuat_id_fkey"
    FOREIGN KEY ("pembuat_id") REFERENCES "pengguna"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "modul_kursus"
    ADD CONSTRAINT "modul_kursus_kursus_id_fkey"
    FOREIGN KEY ("kursus_id") REFERENCES "kursus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "progres_belajar"
    ADD CONSTRAINT "progres_belajar_pengguna_id_fkey"
    FOREIGN KEY ("pengguna_id") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "progres_belajar"
    ADD CONSTRAINT "progres_belajar_kursus_id_fkey"
    FOREIGN KEY ("kursus_id") REFERENCES "kursus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "poin_pengguna"
    ADD CONSTRAINT "poin_pengguna_pengguna_id_fkey"
    FOREIGN KEY ("pengguna_id") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "consent_pengguna"
    ADD CONSTRAINT "consent_pengguna_pengguna_id_fkey"
    FOREIGN KEY ("pengguna_id") REFERENCES "pengguna"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
