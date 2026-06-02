import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProduksiService } from '../../modules/produksi/produksi.service';

// ============================================================
// Unit Test: Produksi Service
// ============================================================

describe('ProduksiService', () => {
  let mockApp: any;
  let mockPrisma: any;
  let mockRedis: any;
  let produksiService: ProduksiService;

  const MOCK_USER_ID = 'petani-uuid-1234';
  const MOCK_LAHAN_ID = 'lahan-uuid-5678';
  const MOCK_KOMODITAS_ID = 'komoditas-uuid-9012';
  const MOCK_IDEMPOTENCY_KEY = 'idem-key-unique-abc123';

  const mockLahanAktif = {
    id: MOCK_LAHAN_ID,
    pemilik_id: MOCK_USER_ID,
    status: 'AKTIF',
    nama: 'Lahan Test',
  };

  beforeEach(() => {
    mockRedis = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue('OK'),
    };

    mockPrisma = {
      lahan: {
        findFirst: vi.fn(),
      },
      catatanPanen: {
        findUnique: vi.fn().mockResolvedValue(null), // Tidak ada duplikat
        create: vi.fn(),
        findMany: vi.fn(),
        groupBy: vi.fn(),
        aggregate: vi.fn(),
      },
      poinPengguna: {
        upsert: vi.fn().mockResolvedValue({}),
      },
      komoditas: {
        findMany: vi.fn().mockResolvedValue([
          { id: MOCK_KOMODITAS_ID, nama: 'Bayam', satuan: 'kg', is_aktif: true },
          { id: 'k2', nama: 'Kangkung', satuan: 'kg', is_aktif: true },
        ]),
      },
      $queryRaw: vi.fn(),
    };

    mockApp = {
      prisma: mockPrisma,
      redis: mockRedis,
      log: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
    };

    produksiService = new ProduksiService(mockApp);
  });

  // ============================================================
  // tambahCatatanPanen()
  // ============================================================

  describe('tambahCatatanPanen()', () => {
    const validPayload = {
      lahan_id: MOCK_LAHAN_ID,
      komoditas_id: MOCK_KOMODITAS_ID,
      jumlah_kg: 15.5,
      tanggal_panen: new Date('2026-05-01'),
      kualitas: 'A' as const,
      catatan: 'Panen perdana musim ini',
      idempotency_key: MOCK_IDEMPOTENCY_KEY,
    };

    it('harus berhasil mencatat panen dengan data valid', async () => {
      mockPrisma.lahan.findFirst.mockResolvedValue(mockLahanAktif);
      mockPrisma.catatanPanen.create.mockResolvedValue({
        id: 'catatan-uuid-001',
        ...validPayload,
        pengguna_id: MOCK_USER_ID,
      });

      const result = await produksiService.tambahCatatanPanen(MOCK_USER_ID, validPayload);

      expect(mockPrisma.lahan.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: MOCK_LAHAN_ID,
            pemilik_id: MOCK_USER_ID,
          }),
        }),
      );
      expect(mockPrisma.catatanPanen.create).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
    });

    it('harus throw 404 jika lahan tidak ditemukan atau bukan milik petani', async () => {
      mockPrisma.lahan.findFirst.mockResolvedValue(null);

      await expect(
        produksiService.tambahCatatanPanen(MOCK_USER_ID, validPayload),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('harus throw 422 jika status lahan bukan AKTIF', async () => {
      mockPrisma.lahan.findFirst.mockResolvedValue({
        ...mockLahanAktif,
        status: 'DALAM_REVIEW',
      });

      await expect(
        produksiService.tambahCatatanPanen(MOCK_USER_ID, validPayload),
      ).rejects.toMatchObject({ statusCode: 422 });
    });

    it('harus mengembalikan catatan yang sudah ada jika idempotency_key duplikat', async () => {
      const existing = {
        id: 'catatan-existing',
        ...validPayload,
        pengguna_id: MOCK_USER_ID,
      };
      mockPrisma.lahan.findFirst.mockResolvedValue(mockLahanAktif);
      mockPrisma.catatanPanen.findUnique.mockResolvedValue(existing);

      const result = await produksiService.tambahCatatanPanen(MOCK_USER_ID, validPayload);

      // Tidak boleh buat catatan baru
      expect(mockPrisma.catatanPanen.create).not.toHaveBeenCalled();
      // Mengembalikan yang sudah ada
      expect(result.id).toBe('catatan-existing');
    });

    it('harus tambah poin +10 setelah catat panen berhasil', async () => {
      mockPrisma.lahan.findFirst.mockResolvedValue(mockLahanAktif);
      mockPrisma.catatanPanen.create.mockResolvedValue({
        id: 'catatan-new',
        ...validPayload,
        pengguna_id: MOCK_USER_ID,
      });

      await produksiService.tambahCatatanPanen(MOCK_USER_ID, validPayload);

      expect(mockPrisma.poinPengguna.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { pengguna_id: MOCK_USER_ID },
          update: expect.objectContaining({
            total_poin: expect.objectContaining({ increment: 10 }),
          }),
        }),
      );
    });
  });

  // ============================================================
  // daftarCatatanPanen()
  // ============================================================

  describe('daftarCatatanPanen()', () => {
    it('harus mengembalikan daftar catatan panen milik petani', async () => {
      const mockCatatan = [
        {
          id: 'c1',
          lahan_id: MOCK_LAHAN_ID,
          jumlah_kg: 10,
          tanggal_panen: new Date('2026-05-01'),
          kualitas: 'A',
          komoditas: { nama: 'Bayam', satuan: 'kg' },
          lahan: { nama: 'Lahan Test', kecamatan: 'Cidadap' },
        },
      ];

      mockPrisma.catatanPanen.findMany.mockResolvedValue(mockCatatan);

      const result = await produksiService.daftarCatatanPanen(MOCK_USER_ID, {});

      expect(mockPrisma.catatanPanen.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ pengguna_id: MOCK_USER_ID }),
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].komoditas.nama).toBe('Bayam');
    });

    it('harus filter berdasarkan bulan jika parameter bulan diberikan', async () => {
      mockPrisma.catatanPanen.findMany.mockResolvedValue([]);

      await produksiService.daftarCatatanPanen(MOCK_USER_ID, {
        bulan: '2026-05',
      });

      expect(mockPrisma.catatanPanen.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tanggal_panen: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });
  });

  // ============================================================
  // daftarKomoditas()
  // ============================================================

  describe('daftarKomoditas()', () => {
    it('harus mengembalikan semua komoditas aktif', async () => {
      const result = await produksiService.daftarKomoditas();

      expect(mockPrisma.komoditas.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { is_aktif: true },
          orderBy: { nama: 'asc' },
        }),
      );
      expect(result).toHaveLength(2);
      expect(result[0].nama).toBe('Bayam');
    });
  });

  // ============================================================
  // tambahCatatanBatch()
  // ============================================================

  describe('tambahCatatanBatch()', () => {
    it('harus memproses setiap item batch secara idempoten', async () => {
      mockPrisma.lahan.findFirst.mockResolvedValue(mockLahanAktif);
      mockPrisma.catatanPanen.create.mockResolvedValue({
        id: 'c-batch',
        pengguna_id: MOCK_USER_ID,
      });

      const batchItems = [
        {
          lahan_id: MOCK_LAHAN_ID,
          komoditas_id: MOCK_KOMODITAS_ID,
          jumlah_kg: 5,
          tanggal_panen: new Date(),
          kualitas: 'B' as const,
          idempotency_key: 'key-1',
        },
        {
          lahan_id: MOCK_LAHAN_ID,
          komoditas_id: MOCK_KOMODITAS_ID,
          jumlah_kg: 8,
          tanggal_panen: new Date(),
          kualitas: 'A' as const,
          idempotency_key: 'key-2',
        },
      ];

      const result = await produksiService.tambahCatatanBatch(MOCK_USER_ID, batchItems);

      expect(result).toHaveLength(2);
      expect(result.every(r => r.berhasil)).toBe(true);
    });

    it('harus melaporkan item gagal tanpa menghentikan seluruh batch', async () => {
      // Item pertama: lahan tidak ditemukan
      mockPrisma.lahan.findFirst
        .mockResolvedValueOnce(null) // item 1 gagal
        .mockResolvedValueOnce(mockLahanAktif); // item 2 berhasil

      mockPrisma.catatanPanen.create.mockResolvedValue({ id: 'c-ok' });

      const batchItems = [
        {
          lahan_id: 'lahan-salah',
          komoditas_id: MOCK_KOMODITAS_ID,
          jumlah_kg: 5,
          tanggal_panen: new Date(),
          kualitas: 'A' as const,
          idempotency_key: 'key-fail',
        },
        {
          lahan_id: MOCK_LAHAN_ID,
          komoditas_id: MOCK_KOMODITAS_ID,
          jumlah_kg: 10,
          tanggal_panen: new Date(),
          kualitas: 'A' as const,
          idempotency_key: 'key-ok',
        },
      ];

      const result = await produksiService.tambahCatatanBatch(MOCK_USER_ID, batchItems);

      expect(result).toHaveLength(2);
      expect(result[0].berhasil).toBe(false);
      expect(result[1].berhasil).toBe(true);
    });
  });
});
