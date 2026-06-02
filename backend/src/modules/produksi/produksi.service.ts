import { FastifyInstance } from 'fastify';
import { z } from 'zod';

// ============================================================
// Schema Produksi
// ============================================================

export const CatatanPanenSchema = z.object({
  lahan_id: z.string().uuid(),
  komoditas_id: z.string().uuid(),
  tgl_panen: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal: YYYY-MM-DD'),
  jumlah_panen: z.number().positive().max(99999),
  satuan: z.string().max(20).default('kg'),
  kualitas: z.enum(['A', 'B', 'C']).optional(),
  catatan: z.string().max(500).optional(),
  foto_panen_url: z.string().url().optional(),
  idempotency_key: z.string().max(64).optional(), // untuk offline sync
  is_offline: z.boolean().default(false),
});

export const UpdateCatatanPanenSchema = CatatanPanenSchema.partial().omit({
  lahan_id: true,
  idempotency_key: true,
});

export const QueryProduksiSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  lahan_id: z.string().uuid().optional(),
  komoditas_id: z.string().uuid().optional(),
  bulan: z.string().regex(/^\d{4}-\d{2}$/).optional(), // YYYY-MM
  kualitas: z.enum(['A', 'B', 'C']).optional(),
});

export const RingkasanProduksiSchema = z.object({
  lahan_id: z.string().uuid().optional(),
  komoditas_id: z.string().uuid().optional(),
  tahun: z.coerce.number().int().min(2020).max(2030).optional(),
});

export type CatatanPanenDto = z.infer<typeof CatatanPanenSchema>;
export type UpdateCatatanPanenDto = z.infer<typeof UpdateCatatanPanenSchema>;
export type QueryProduksiDto = z.infer<typeof QueryProduksiSchema>;

// ============================================================
// Produksi Service
// ============================================================

export class ProduksiService {
  constructor(private readonly app: FastifyInstance) {}

  /**
   * Tambah catatan panen — dengan idempotency check untuk offline sync
   */
  async tambahCatatanPanen(dto: CatatanPanenDto, petaniId: string) {
    const prisma = this.app.prisma;

    // Verifikasi lahan milik petani ini
    const lahan = await prisma.lahan.findUnique({
      where: { id: dto.lahan_id },
      select: { pemilik_id: true, status: true },
    });

    if (!lahan) throw { statusCode: 404, message: 'Lahan tidak ditemukan' };
    if (lahan.pemilik_id !== petaniId) {
      throw { statusCode: 403, message: 'Anda bukan pemilik lahan ini' };
    }
    if (lahan.status !== 'AKTIF') {
      throw { statusCode: 400, message: 'Lahan tidak dalam status aktif' };
    }

    // Idempotency check: cegah duplikat dari offline sync
    if (dto.idempotency_key) {
      const existing = await prisma.catatanPanen.findUnique({
        where: { idempotency_key: dto.idempotency_key },
        select: { id: true },
      });
      if (existing) {
        return { id: existing.id, pesan: 'Catatan sudah tersimpan sebelumnya (idempotent)' };
      }
    }

    // Verifikasi komoditas ada
    const komoditas = await prisma.komoditas.findUnique({
      where: { id: dto.komoditas_id, is_active: true },
      select: { id: true, satuan: true },
    });
    if (!komoditas) throw { statusCode: 404, message: 'Komoditas tidak ditemukan' };

    const catatan = await prisma.catatanPanen.create({
      data: {
        lahan_id: dto.lahan_id,
        komoditas_id: dto.komoditas_id,
        petani_id: petaniId,
        tgl_panen: new Date(dto.tgl_panen),
        jumlah_panen: dto.jumlah_panen,
        satuan: dto.satuan ?? komoditas.satuan,
        kualitas: dto.kualitas as any,
        catatan: dto.catatan,
        foto_panen_url: dto.foto_panen_url,
        idempotency_key: dto.idempotency_key,
        is_offline: dto.is_offline,
      },
      select: { id: true },
    });

    // Update poin petani (+10 per catatan)
    await this.tambahPoin(petaniId, 10, 'CATATAN_PANEN', catatan.id);

    return { id: catatan.id, pesan: 'Catatan panen berhasil disimpan' };
  }

  /**
   * Daftar catatan panen dengan filter
   */
  async daftarCatatanPanen(query: QueryProduksiDto, petaniId: string, peran: string) {
    const { page, limit, lahan_id, komoditas_id, bulan, kualitas } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Petani hanya bisa lihat miliknya
    if (peran === 'PETANI') {
      where.petani_id = petaniId;
    }

    if (lahan_id) where.lahan_id = lahan_id;
    if (komoditas_id) where.komoditas_id = komoditas_id;
    if (kualitas) where.kualitas = kualitas;

    if (bulan) {
      const [tahun, bln] = bulan.split('-').map(Number);
      const awal = new Date(tahun, bln - 1, 1);
      const akhir = new Date(tahun, bln, 0, 23, 59, 59);
      where.tgl_panen = { gte: awal, lte: akhir };
    }

    const [total, data] = await Promise.all([
      this.app.prisma.catatanPanen.count({ where }),
      this.app.prisma.catatanPanen.findMany({
        where,
        skip,
        take: limit,
        orderBy: { tgl_panen: 'desc' },
        include: {
          lahan: { select: { id: true, nama: true } },
          komoditas: { select: { id: true, nama: true, satuan: true } },
          petani: { select: { id: true, nama_lengkap: true } },
        },
      }),
    ]);

    return { data, total, page, limit, totalHalaman: Math.ceil(total / limit) };
  }

  /**
   * Ringkasan produksi bulanan per komoditas (untuk chart)
   */
  async ringkasanProduksiBulanan(lahanId?: string, tahun?: number) {
    const targetTahun = tahun ?? new Date().getFullYear();

    const result = await this.app.prisma.$queryRaw<
      {
        bulan: number;
        komoditas_nama: string;
        total_panen: number;
        satuan: string;
      }[]
    >`
      SELECT
        EXTRACT(MONTH FROM cp.tgl_panen)::int AS bulan,
        k.nama AS komoditas_nama,
        SUM(cp.jumlah_panen)::float AS total_panen,
        k.satuan
      FROM "CatatanPanen" cp
      JOIN "Komoditas" k ON k.id = cp.komoditas_id
      WHERE EXTRACT(YEAR FROM cp.tgl_panen) = ${targetTahun}
      ${lahanId ? this.app.prisma.$queryRaw`AND cp.lahan_id = ${lahanId}::uuid` : this.app.prisma.$queryRaw``}
      GROUP BY bulan, k.nama, k.satuan
      ORDER BY bulan, k.nama
    `;

    // Susun data per bulan (1-12)
    const perBulan: Record<number, { komoditas: string; total: number; satuan: string }[]> = {};
    for (let i = 1; i <= 12; i++) perBulan[i] = [];

    for (const row of result) {
      perBulan[row.bulan].push({
        komoditas: row.komoditas_nama,
        total: row.total_panen,
        satuan: row.satuan,
      });
    }

    return { tahun: targetTahun, per_bulan: perBulan };
  }

  /**
   * Statistik total produksi (dashboard)
   */
  async statistikProduksi(filters: { kecamatan?: string; bulan?: string }) {
    const where: any = {};
    if (filters.bulan) {
      const [tahun, bln] = filters.bulan.split('-').map(Number);
      where.tgl_panen = {
        gte: new Date(tahun, bln - 1, 1),
        lte: new Date(tahun, bln, 0, 23, 59, 59),
      };
    }

    const [totalPanen, totalPetani, topKomoditas] = await Promise.all([
      this.app.prisma.catatanPanen.aggregate({
        where,
        _sum: { jumlah_panen: true },
        _count: true,
      }),
      this.app.prisma.catatanPanen.groupBy({
        by: ['petani_id'],
        where,
        _count: true,
      }),
      this.app.prisma.$queryRaw<{ nama: string; total: number; satuan: string }[]>`
        SELECT k.nama, SUM(cp.jumlah_panen)::float AS total, k.satuan
        FROM "CatatanPanen" cp
        JOIN "Komoditas" k ON k.id = cp.komoditas_id
        ${filters.bulan ? this.app.prisma.$queryRaw`WHERE cp.tgl_panen >= ${new Date(filters.bulan + '-01')}` : this.app.prisma.$queryRaw``}
        GROUP BY k.nama, k.satuan
        ORDER BY total DESC
        LIMIT 5
      `,
    ]);

    return {
      total_panen_kg: totalPanen._sum.jumlah_panen ?? 0,
      total_catatan: totalPanen._count,
      total_petani_aktif: totalPetani.length,
      top_komoditas: topKomoditas,
    };
  }

  /**
   * Tambah poin gamifikasi
   */
  private async tambahPoin(penggunaId: string, poin: number, aksi: string, referensiId: string) {
    try {
      await this.app.prisma.poinPengguna.create({
        data: {
          pengguna_id: penggunaId,
          poin,
          aksi,
          referensi_id: referensiId,
        },
      });
    } catch {
      // Non-critical: tidak gagalkan operasi utama
      this.app.log.warn({ penggunaId, aksi }, 'Gagal tambah poin');
    }
  }
}
