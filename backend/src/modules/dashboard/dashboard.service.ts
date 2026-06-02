import { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';

// ============================================================
// Dashboard Service — KPI + Ringkasan + Export
// ============================================================

export class DashboardService {
  constructor(private readonly app: FastifyInstance) {}

  /**
   * KPI Utama (untuk header dashboard admin)
   */
  async kpiUtama(filters: { kecamatan?: string; bulan?: string }) {
    const redis = this.app.redis;
    const cacheKey = `dashboard:kpi:${filters.kecamatan ?? 'all'}:${filters.bulan ?? 'all'}`;

    // Cache 5 menit
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const now = new Date();
    const bulanIni = filters.bulan
      ? new Date(filters.bulan + '-01')
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const bulanDepan = new Date(bulanIni.getFullYear(), bulanIni.getMonth() + 1, 1);

    const kecamatanFilter = filters.kecamatan
      ? { kecamatan: filters.kecamatan }
      : {};

    const [
      totalPetani,
      totalLahan,
      totalLahanM2,
      totalProduksiKg,
      totalPesanan,
      totalPendapatan,
      totalBooking,
      mau,
    ] = await Promise.all([
      // Total petani aktif
      this.app.prisma.pengguna.count({ where: { peran: 'PETANI', is_aktif: true, ...kecamatanFilter } }),

      // Total lahan aktif
      this.app.prisma.lahan.count({ where: { status: 'AKTIF', ...kecamatanFilter } }),

      // Total luas lahan (m²)
      this.app.prisma.lahan.aggregate({ where: { status: 'AKTIF', ...kecamatanFilter }, _sum: { luas_m2: true } }),

      // Total produksi bulan ini (kg)
      this.app.prisma.catatanPanen.aggregate({
        where: { tanggal_panen: { gte: bulanIni, lt: bulanDepan }, satuan: 'kg' },
        _sum: { jumlah: true },
      }),

      // Total pesanan bulan ini
      this.app.prisma.pesanan.count({ where: { created_at: { gte: bulanIni, lt: bulanDepan }, status: 'SELESAI' } }),

      // Total pendapatan (pesanan selesai)
      this.app.prisma.pesanan.aggregate({
        where: { created_at: { gte: bulanIni, lt: bulanDepan }, status: 'SELESAI' },
        _sum: { total: true },
      }),

      // Total booking agrowisata
      this.app.prisma.bookingWisata.count({ where: { tanggal: { gte: bulanIni, lt: bulanDepan }, status: 'SELESAI' } }),

      // MAU dari Redis
      redis.scard(`mau:${bulanIni.getFullYear()}${String(bulanIni.getMonth() + 1).padStart(2, '0')}`),
    ]);

    const result = {
      total_petani: totalPetani,
      total_lahan: totalLahan,
      total_lahan_m2: Number(totalLahanM2._sum.luas_m2 ?? 0),
      total_produksi_kg: Number(totalProduksiKg._sum.jumlah ?? 0),
      total_pesanan: totalPesanan,
      total_pendapatan: Number(totalPendapatan._sum.total ?? 0),
      total_booking: totalBooking,
      mau,
      bulan: bulanIni.toISOString().slice(0, 7),
    };

    await redis.set(cacheKey, JSON.stringify(result), 'EX', 300);
    return result;
  }

  /**
   * Grafik produksi per kecamatan
   */
  async produksiPerKecamatan(tahun: number) {
    const result = await this.app.prisma.$queryRaw<
      { kecamatan: string; bulan: number; total_kg: number }[]
    >`
      SELECT
        l.kecamatan,
        EXTRACT(MONTH FROM cp.tanggal_panen)::int AS bulan,
        SUM(cp.jumlah)::float AS total_kg
      FROM catatan_panen cp
      JOIN lahan l ON l.id = cp.lahan_id
      WHERE EXTRACT(YEAR FROM cp.tanggal_panen) = ${tahun}
      AND cp.satuan = 'kg'
      GROUP BY l.kecamatan, bulan
      ORDER BY l.kecamatan, bulan
    `;

    return { tahun, data: result };
  }

  /**
   * Top 10 petani berdasarkan total panen
   */
  async topPetani(bulan?: string) {
    const where: any = {};
    let dateFilter = Prisma.empty;
    if (bulan) {
      const [tahun, bln] = bulan.split('-').map(Number);
      const start = new Date(tahun, bln - 1, 1);
      const end = new Date(tahun, bln, 1);
      where.tanggal_panen = { gte: start, lt: end };
      dateFilter = Prisma.sql`WHERE cp.tanggal_panen >= ${start} AND cp.tanggal_panen < ${end}`;
    }

    return this.app.prisma.$queryRaw<
      { nama: string; kecamatan: string; total_panen: number; total_catatan: number }[]
    >`
      SELECT
        p.nama AS nama,
        p.kecamatan,
        SUM(cp.jumlah)::float AS total_panen,
        COUNT(cp.id)::int AS total_catatan
      FROM catatan_panen cp
      JOIN pengguna p ON p.id = cp.pengguna_id
      ${dateFilter}
      GROUP BY p.nama, p.kecamatan
      ORDER BY total_panen DESC
      LIMIT 10
    `;
  }

  /**
   * Peta distribusi lahan (GeoJSON summary per kecamatan)
   */
  async distribusiLahanPerKecamatan() {
    return this.app.prisma.$queryRaw<
      { kecamatan: string; total_lahan: number; total_m2: number; total_petani: number }[]
    >`
      SELECT
        kecamatan,
        COUNT(*)::int AS total_lahan,
        SUM(luas_m2)::float AS total_m2,
        COUNT(DISTINCT pemilik_id)::int AS total_petani
      FROM lahan
      WHERE status = 'AKTIF'
      GROUP BY kecamatan
      ORDER BY total_lahan DESC
    `;
  }

  /**
   * Aktivitas terbaru (audit log ringkas)
   */
  async aktivitasTerbaru(limit: number = 20) {
    return this.app.prisma.auditLog.findMany({
      take: limit,
      orderBy: { created_at: 'desc' },
      select: {
        id: true, aksi: true, resource: true, created_at: true,
        pengguna: { select: { nama: true, peran: true } },
      },
    });
  }

  /**
   * Tracking pengguna aktif (DAU) ke Redis
   */
  async trackActiveUser(penggunaId: string) {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const monthKey = new Date().toISOString().slice(0, 7).replace('-', '');

    await Promise.all([
      this.app.redis.sadd(`dau:${today}`, penggunaId),
      this.app.redis.expire(`dau:${today}`, 48 * 60 * 60), // 48 jam TTL
      this.app.redis.sadd(`mau:${monthKey}`, penggunaId),
      this.app.redis.expire(`mau:${monthKey}`, 35 * 24 * 60 * 60), // 35 hari TTL
    ]);
  }
}
