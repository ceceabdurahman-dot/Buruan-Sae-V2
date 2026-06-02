import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { buildApp } from '../../app';
import { FastifyInstance } from 'fastify';

// ============================================================
// Integration Test: Lahan Endpoints
// Menggunakan testcontainers (PostgreSQL + PostGIS)
// ============================================================

let app: FastifyInstance;
let pgContainer: StartedTestContainer;
let accessToken: string;
let lahanId: string;

const TEST_USER = {
  nik: '3273010101900001',
  nama_lengkap: 'Petani Test Integration',
  nomor_wa: '08123456789',
  password: 'Password123!',
  peran: 'PETANI',
  consent_diberikan: true,
};

beforeAll(async () => {
  // Jalankan PostgreSQL dengan PostGIS via testcontainer
  pgContainer = await new GenericContainer('postgis/postgis:15-3.4-alpine')
    .withEnvironment({
      POSTGRES_USER: 'test',
      POSTGRES_PASSWORD: 'testpass',
      POSTGRES_DB: 'buruan_sae_test',
    })
    .withExposedPorts(5432)
    .withWaitStrategy(Wait.forLogMessage('database system is ready to accept connections'))
    .start();

  const pgPort = pgContainer.getMappedPort(5432);
  const pgHost = pgContainer.getHost();

  // Set DATABASE_URL ke container yang baru dijalankan
  process.env.DATABASE_URL = `postgresql://test:testpass@${pgHost}:${pgPort}/buruan_sae_test`;

  // Build aplikasi Fastify
  app = await buildApp({ logger: false });

  // Jalankan migrasi Prisma
  const { execSync } = await import('child_process');
  execSync('npx prisma migrate deploy', {
    env: { ...process.env },
    stdio: 'pipe',
  });

  // Aktifkan PostGIS extension
  await app.prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS postgis`;

  await app.ready();

  // Daftarkan user test untuk mendapatkan token
  await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: TEST_USER,
  });

  // Simulasikan OTP terverifikasi langsung via DB untuk test
  await app.prisma.pengguna.updateMany({
    where: { nomor_wa: TEST_USER.nomor_wa },
    data: { is_verified: true, is_active: true },
  });

  // Login untuk dapatkan token
  const loginRes = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: {
      identifier: TEST_USER.nomor_wa,
      password: TEST_USER.password,
    },
  });

  const loginData = JSON.parse(loginRes.body);
  accessToken = loginData.data?.access_token;
}, 120_000); // timeout 2 menit untuk container startup

afterAll(async () => {
  await app?.close();
  await pgContainer?.stop();
});

// ============================================================
// Test Suite: POST /api/v1/lahan
// ============================================================

describe('POST /api/v1/lahan — Tambah Lahan', () => {
  it('harus berhasil menambah lahan dengan polygon valid', async () => {
    const payload = {
      nama: 'Lahan Kebun Sayur RT 01',
      alamat: 'Jl. Ciumbuleuit No. 1, Bandung',
      kecamatan: 'Cidadap',
      kelurahan: 'Hegarmanah',
      luas_m2: 250,
      komoditas_utama: ['Bayam', 'Kangkung'],
      polygon_geojson: {
        type: 'Polygon',
        coordinates: [
          [
            [107.5919, -6.8824],
            [107.5929, -6.8824],
            [107.5929, -6.8834],
            [107.5919, -6.8834],
            [107.5919, -6.8824],
          ],
        ],
      },
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/lahan',
      headers: { Authorization: `Bearer ${accessToken}` },
      payload,
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.data).toMatchObject({
      nama: payload.nama,
      kecamatan: payload.kecamatan,
      status: 'DALAM_REVIEW',
    });

    // Simpan ID untuk test berikutnya
    lahanId = body.data.id;
  });

  it('harus gagal jika tidak ada token auth', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/lahan',
      payload: { nama: 'Lahan Tanpa Auth' },
    });

    expect(res.statusCode).toBe(401);
  });

  it('harus gagal jika polygon_geojson tidak valid', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/lahan',
      headers: { Authorization: `Bearer ${accessToken}` },
      payload: {
        nama: 'Lahan Polygon Invalid',
        alamat: 'Jl. Test',
        kecamatan: 'Cidadap',
        kelurahan: 'Hegarmanah',
        luas_m2: 100,
        polygon_geojson: { type: 'Point', coordinates: [107.59, -6.88] }, // bukan Polygon
      },
    });

    expect(res.statusCode).toBe(400);
  });
});

// ============================================================
// Test Suite: GET /api/v1/lahan
// ============================================================

describe('GET /api/v1/lahan — Daftar Lahan', () => {
  it('harus mengembalikan daftar lahan milik pengguna', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/lahan',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data).toBeInstanceOf(Array);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0]).toHaveProperty('id');
    expect(body.data[0]).toHaveProperty('nama');
    expect(body.data[0]).toHaveProperty('status');
  });

  it('harus filter lahan berdasarkan bbox PostGIS', async () => {
    // Bbox mencakup koordinat polygon yang ditambahkan sebelumnya
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/lahan?bbox=107.590,-6.885,107.595,-6.880',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data).toBeInstanceOf(Array);
    // Setidaknya lahan yang baru ditambahkan ada dalam bbox ini
    expect(body.data.length).toBeGreaterThan(0);
  });

  it('harus mengembalikan daftar kosong jika bbox di luar area', async () => {
    // Bbox di luar Bandung (di Jakarta)
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/lahan?bbox=106.8,-6.2,106.9,-6.1',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data).toBeInstanceOf(Array);
    expect(body.data.length).toBe(0);
  });
});

// ============================================================
// Test Suite: GET /api/v1/lahan/:id
// ============================================================

describe('GET /api/v1/lahan/:id — Detail Lahan', () => {
  it('harus mengembalikan detail lahan dengan GeoJSON', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/lahan/${lahanId}`,
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data).toMatchObject({
      id: lahanId,
      nama: 'Lahan Kebun Sayur RT 01',
      kecamatan: 'Cidadap',
    });
    // PostGIS GeoJSON harus ada
    expect(body.data.polygon_geojson).toBeDefined();
    expect(body.data.polygon_geojson.type).toBe('Polygon');
  });

  it('harus 404 jika lahan tidak ditemukan', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/lahan/00000000-0000-0000-0000-000000000000',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    expect(res.statusCode).toBe(404);
  });
});

// ============================================================
// Test Suite: GET /api/v1/lahan/peta
// ============================================================

describe('GET /api/v1/lahan/peta — Peta GeoJSON (Public)', () => {
  it('harus mengembalikan FeatureCollection tanpa auth', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/lahan/peta',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.type).toBe('FeatureCollection');
    expect(body.data.features).toBeInstanceOf(Array);
  });
});

// ============================================================
// Test Suite: POST /api/v1/lahan/:id/verifikasi
// ============================================================

describe('POST /api/v1/lahan/:id/verifikasi — Verifikasi Lahan', () => {
  it('harus gagal jika user biasa mencoba verifikasi (bukan KOORDINATOR)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/lahan/${lahanId}/verifikasi`,
      headers: { Authorization: `Bearer ${accessToken}` },
      payload: { status: 'AKTIF', catatan: 'Disetujui' },
    });

    // Petani tidak boleh verifikasi — harus 403
    expect(res.statusCode).toBe(403);
  });
});
