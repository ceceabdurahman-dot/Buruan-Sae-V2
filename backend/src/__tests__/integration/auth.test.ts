import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { buildApp } from '../../app';
import { FastifyInstance } from 'fastify';

// ============================================================
// Integration Test: Auth Endpoints
// Menggunakan testcontainers PostgreSQL + Redis
// ============================================================

let app: FastifyInstance;
let pgContainer: StartedTestContainer;
let redisContainer: StartedTestContainer;

const VALID_USER = {
  nik: '3273020202900002',
  nama_lengkap: 'Siti Integration Test',
  nomor_wa: '08234567890',
  password: 'Password123!',
  peran: 'PETANI',
  consent_diberikan: true,
};

beforeAll(async () => {
  // Jalankan PostgreSQL + PostGIS
  pgContainer = await new GenericContainer('postgis/postgis:15-3.4-alpine')
    .withEnvironment({
      POSTGRES_USER: 'test',
      POSTGRES_PASSWORD: 'testpass',
      POSTGRES_DB: 'buruan_sae_auth_test',
    })
    .withExposedPorts(5432)
    .withWaitStrategy(Wait.forLogMessage('database system is ready to accept connections'))
    .start();

  // Jalankan Redis
  redisContainer = await new GenericContainer('redis:7-alpine')
    .withExposedPorts(6379)
    .withWaitStrategy(Wait.forLogMessage('Ready to accept connections'))
    .start();

  const pgPort = pgContainer.getMappedPort(5432);
  const pgHost = pgContainer.getHost();
  const redisPort = redisContainer.getMappedPort(6379);
  const redisHost = redisContainer.getHost();

  process.env.DATABASE_URL = `postgresql://test:testpass@${pgHost}:${pgPort}/buruan_sae_auth_test`;
  process.env.REDIS_URL = `redis://${redisHost}:${redisPort}`;

  app = await buildApp({ logger: false });

  const { execSync } = await import('child_process');
  execSync('npx prisma migrate deploy', {
    env: { ...process.env },
    stdio: 'pipe',
  });

  await app.prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS postgis`;
  await app.ready();
}, 120_000);

afterAll(async () => {
  await app?.close();
  await pgContainer?.stop();
  await redisContainer?.stop();
});

// ============================================================
// Test Suite: POST /api/v1/auth/register
// ============================================================

describe('POST /auth/register', () => {
  it('harus berhasil mendaftarkan user baru', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: VALID_USER,
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.data).toMatchObject({
      nomor_wa: VALID_USER.nomor_wa,
      peran: VALID_USER.peran,
    });
    // NIK tidak dikembalikan ke response
    expect(body.data).not.toHaveProperty('nik_encrypted');
    expect(body.data).not.toHaveProperty('password_hash');
  });

  it('harus gagal jika NIK sudah terdaftar', async () => {
    // Daftar dengan NIK yang sama
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: VALID_USER,
    });

    expect(res.statusCode).toBe(409);
    const body = JSON.parse(res.body);
    expect(body.message).toContain('sudah terdaftar');
  });

  it('harus gagal jika NIK bukan 16 digit', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { ...VALID_USER, nik: '12345', nomor_wa: '08999999999' },
    });

    expect(res.statusCode).toBe(400);
  });

  it('harus gagal jika consent_diberikan = false', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        ...VALID_USER,
        nik: '3273030303900003',
        nomor_wa: '08111111111',
        consent_diberikan: false,
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it('harus menyimpan consent record di database', async () => {
    const consent = await app.prisma.consentPengguna.findFirst({
      where: { pengguna: { nomor_wa: VALID_USER.nomor_wa } },
    });

    expect(consent).not.toBeNull();
    expect(consent?.disetujui).toBe(true);
  });
});

// ============================================================
// Test Suite: POST /auth/login
// ============================================================

describe('POST /auth/login', () => {
  beforeAll(async () => {
    // Aktifkan user untuk bisa login
    await app.prisma.pengguna.updateMany({
      where: { nomor_wa: VALID_USER.nomor_wa },
      data: { is_verified: true, is_active: true },
    });
  });

  it('harus berhasil login dengan nomor WA & password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        identifier: VALID_USER.nomor_wa,
        password: VALID_USER.password,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data).toHaveProperty('access_token');
    expect(body.data).toHaveProperty('refresh_token');
    expect(typeof body.data.access_token).toBe('string');
  });

  it('harus gagal dengan password salah', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        identifier: VALID_USER.nomor_wa,
        password: 'WrongPassword999',
      },
    });

    expect(res.statusCode).toBe(401);
  });

  it('harus gagal jika user tidak terdaftar', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        identifier: '08000000000',
        password: 'Password123',
      },
    });

    expect(res.statusCode).toBe(401);
  });
});

// ============================================================
// Test Suite: GET /auth/me
// ============================================================

describe('GET /auth/me', () => {
  let accessToken: string;

  beforeAll(async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        identifier: VALID_USER.nomor_wa,
        password: VALID_USER.password,
      },
    });
    const body = JSON.parse(res.body);
    accessToken = body.data.access_token;
  });

  it('harus mengembalikan profil user yang sedang login', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data).toMatchObject({
      nomor_wa: VALID_USER.nomor_wa,
      peran: VALID_USER.peran,
    });
  });

  it('harus 401 tanpa token', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/auth/me',
    });

    expect(res.statusCode).toBe(401);
  });
});

// ============================================================
// Test Suite: POST /auth/refresh
// ============================================================

describe('POST /auth/refresh', () => {
  let refreshToken: string;

  beforeAll(async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        identifier: VALID_USER.nomor_wa,
        password: VALID_USER.password,
      },
    });
    const body = JSON.parse(res.body);
    refreshToken = body.data.refresh_token;
  });

  it('harus menghasilkan access token baru dari refresh token valid', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      payload: { refresh_token: refreshToken },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data).toHaveProperty('access_token');
    expect(body.data).toHaveProperty('refresh_token');
  });

  it('harus menolak refresh token yang sudah dipakai (rotation)', async () => {
    // Gunakan token lama setelah rotation
    const res = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      payload: { refresh_token: refreshToken },
    });

    expect(res.statusCode).toBe(401);
  });

  it('harus menolak refresh token palsu', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      payload: { refresh_token: 'totally-fake-token-xyz' },
    });

    expect(res.statusCode).toBe(401);
  });
});

// ============================================================
// Test Suite: POST /auth/logout
// ============================================================

describe('POST /auth/logout', () => {
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        identifier: VALID_USER.nomor_wa,
        password: VALID_USER.password,
      },
    });
    const body = JSON.parse(res.body);
    accessToken = body.data.access_token;
    refreshToken = body.data.refresh_token;
  });

  it('harus berhasil logout dan invalidasi refresh token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: { Authorization: `Bearer ${accessToken}` },
      payload: { refresh_token: refreshToken },
    });

    expect(res.statusCode).toBe(200);
  });

  it('refresh token tidak bisa dipakai setelah logout', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      payload: { refresh_token: refreshToken },
    });

    expect(res.statusCode).toBe(401);
  });
});
