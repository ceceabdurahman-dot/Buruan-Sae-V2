-- ============================================================
-- V001__initial_setup.sql
-- PostgreSQL Extensions Setup — Buruan Sae 2.0
--
-- File ini HANYA mengaktifkan extensions yang dibutuhkan.
-- SEMUA tabel dibuat oleh Prisma Migrate (schema.prisma).
--
-- Dijalankan otomatis oleh Docker saat container postgres
-- pertama kali dibuat (docker-entrypoint-initdb.d).
-- ============================================================

-- UUID generator (dipakai sebagai default PK)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PostGIS untuk data geospasial (koordinat lahan)
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Trigram index untuk full-text search (nama pengguna, produk, dll)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- Catatan:
-- Tabel dibuat oleh: npx prisma migrate dev --name init
-- Jangan buat tabel manual di sini — akan konflik dengan Prisma
-- ============================================================
