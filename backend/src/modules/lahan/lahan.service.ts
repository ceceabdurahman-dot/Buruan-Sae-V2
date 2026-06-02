import { FastifyInstance } from 'fastify';
import { z } from 'zod';

// ============================================================
// Schema Lahan
// ============================================================

export const TambahLahanSchema = z.object({
  nama: z.string().min(3).max(100).trim(),
  alamat: z.string().min(5).max(500).trim(),
  kecamatan: z.string().max(50).trim(),
  kelurahan: z.string().max(50).trim(),
  luas_m2: z.number().positive().max(100000),
  // GeoJSON Polygon untuk PostGIS
  geojson: z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))).min(1),
  }).optional(),
  titik_pusat: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
  kelompok_id: z.string().uuid().optional(),
});

export const UpdateLahanSchema = TambahLahanSchema.partial();

export const VerifikasiLahanSchema = z.object({
  status: z.enum(['AKTIF', 'DITOLAK']),
  catatan_verifikasi: z.string().max(500).optional(),
});

export const QueryLahanSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  kecamatan: z.string().optional(),
  status: z.enum(['AKTIF', 'TIDAK_AKTIF', 'DALAM_REVIEW', 'DITOLAK']).optional(),
  search: z.string().optional(),
  bbox: z.string().optional(), // "minLng,minLat,maxLng,maxLat" untuk filter area peta
});

export type TambahLahanDto = z.infer<typeof TambahLahanSchema>;
export type UpdateLahanDto = z.infer<typeof UpdateLahanSchema>;
export type VerifikasiLahanDto = z.infer<typeof VerifikasiLahanSchema>;
export type QueryLahanDto = z.infer<typeof QueryLahanSchema>;

// ============================================================
// Lahan Service
// ============================================================

export class LahanService {
  constructor(private readonly app: FastifyInstance) {}

  /**
   * Daftar lahan dengan pagination + filter
   */
  async daftarLahan(query: QueryLahanDto, penggunaId?: string, peran?: string) {
    const { page, limit, kecamatan, status, search, bbox } = query;
    const skip = (page - 1) * limit;

    // Build WHERE clause
    const where: any = { deleted_at: null };

    // Petani hanya bisa lihat lahannya sendiri
    if (peran === 'PETANI') {
      where.pemilik_id = penggunaId;
    }

    if (kecamatan) where.kecamatan = kecamatan;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { alamat: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter bbox (bounding box) via raw query PostGIS
    let lahanIds: string[] | undefined;
    if (bbox) {
      const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
      const result = await this.app.prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Lahan"
        WHERE ST_Intersects(
          titik_pusat,
          ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)
        )
        AND deleted_at IS NULL
      `;
      lahanIds = result.map((r) => r.id);
      if (lahanIds.length === 0) return { data: [], total: 0, page, limit };
      where.id = { in: lahanIds };
    }

    const [total, data] = await Promise.all([
      this.app.prisma.lahan.count({ where }),
      this.app.prisma.lahan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          nama: true,
          alamat: true,
          kecamatan: true,
          kelurahan: true,
          luas_m2: true,
          status: true,
          created_at: true,
          pemilik: {
            select: { id: true, nama_lengkap: true, nomor_wa: true },
          },
          kelompok: {
            select: { id: true, nama: true },
          },
        },
      }),
    ]);

    return { data, total, page, limit, totalHalaman: Math.ceil(total / limit) };
  }

  /**
   * Detail lahan + koordinat GeoJSON
   */
  async detailLahan(lahanId: string, penggunaId: string, peran: string) {
    const lahan = await this.app.prisma.lahan.findUnique({
      where: { id: lahanId },
      include: {
        pemilik: { select: { id: true, nama_lengkap: true, nomor_wa: true } },
        kelompok: { select: { id: true, nama: true, kecamatan: true } },
        foto_lahan: { select: { id: true, url: true, keterangan: true }, orderBy: { created_at: 'asc' } },
        _count: { select: { catatan_panen: true } },
      },
    });

    if (!lahan) throw { statusCode: 404, message: 'Lahan tidak ditemukan' };

    // Petani hanya bisa lihat lahannya sendiri
    if (peran === 'PETANI' && lahan.pemilik_id !== penggunaId) {
      throw { statusCode: 403, message: 'Anda tidak memiliki akses ke lahan ini' };
    }

    // Ambil koordinat GeoJSON dari PostGIS
    const geoData = await this.app.prisma.$queryRaw<
      { geom_json: string; titik_json: string }[]
    >`
      SELECT
        ST_AsGeoJSON(geom) as geom_json,
        ST_AsGeoJSON(titik_pusat) as titik_json
      FROM "Lahan" WHERE id = ${lahanId}::uuid
    `;

    return {
      ...lahan,
      geojson: geoData[0]?.geom_json ? JSON.parse(geoData[0].geom_json) : null,
      titik_pusat_geojson: geoData[0]?.titik_json ? JSON.parse(geoData[0].titik_json) : null,
    };
  }

  /**
   * Tambah lahan baru
   */
  async tambahLahan(dto: TambahLahanDto, penggunaId: string) {
    const lahan = await this.app.prisma.$transaction(async (tx) => {
      // Buat record lahan
      const newLahan = await tx.lahan.create({
        data: {
          pemilik_id: penggunaId,
          kelompok_id: dto.kelompok_id,
          nama: dto.nama,
          alamat: dto.alamat,
          kecamatan: dto.kecamatan,
          kelurahan: dto.kelurahan,
          luas_m2: dto.luas_m2,
          status: 'DALAM_REVIEW',
        },
        select: { id: true },
      });

      // Update koordinat PostGIS jika ada
      if (dto.titik_pusat) {
        await tx.$executeRaw`
          UPDATE "Lahan"
          SET titik_pusat = ST_SetSRID(ST_MakePoint(${dto.titik_pusat.lng}, ${dto.titik_pusat.lat}), 4326)
          WHERE id = ${newLahan.id}::uuid
        `;
      }

      if (dto.geojson) {
        const geojsonStr = JSON.stringify(dto.geojson);
        await tx.$executeRaw`
          UPDATE "Lahan"
          SET geom = ST_SetSRID(ST_GeomFromGeoJSON(${geojsonStr}), 4326)
          WHERE id = ${newLahan.id}::uuid
        `;
      }

      return newLahan;
    });

    await this.app.prisma.auditLog.create({
      data: {
        pengguna_id: penggunaId,
        aksi: 'CREATE',
        entitas: 'Lahan',
        entitas_id: lahan.id,
      },
    });

    return { id: lahan.id, pesan: 'Lahan berhasil ditambahkan dan sedang diverifikasi' };
  }

  /**
   * Update lahan (hanya pemilik atau admin)
   */
  async updateLahan(lahanId: string, dto: UpdateLahanDto, penggunaId: string, peran: string) {
    const existing = await this.app.prisma.lahan.findUnique({
      where: { id: lahanId },
      select: { pemilik_id: true, status: true },
    });

    if (!existing) throw { statusCode: 404, message: 'Lahan tidak ditemukan' };

    const isAdmin = ['ADMIN_DINAS', 'SUPER_ADMIN', 'KOORDINATOR_KECAMATAN'].includes(peran);
    if (!isAdmin && existing.pemilik_id !== penggunaId) {
      throw { statusCode: 403, message: 'Anda tidak memiliki akses untuk mengubah lahan ini' };
    }

    const { geojson, titik_pusat, ...updateData } = dto;

    await this.app.prisma.$transaction(async (tx) => {
      await tx.lahan.update({
        where: { id: lahanId },
        data: {
          ...updateData,
          // Reset ke DALAM_REVIEW jika petani mengubah data
          ...(peran === 'PETANI' && { status: 'DALAM_REVIEW' }),
        },
      });

      if (titik_pusat) {
        await tx.$executeRaw`
          UPDATE "Lahan"
          SET titik_pusat = ST_SetSRID(ST_MakePoint(${titik_pusat.lng}, ${titik_pusat.lat}), 4326)
          WHERE id = ${lahanId}::uuid
        `;
      }

      if (geojson) {
        const geojsonStr = JSON.stringify(geojson);
        await tx.$executeRaw`
          UPDATE "Lahan"
          SET geom = ST_SetSRID(ST_GeomFromGeoJSON(${geojsonStr}), 4326)
          WHERE id = ${lahanId}::uuid
        `;
      }
    });

    await this.app.prisma.auditLog.create({
      data: {
        pengguna_id: penggunaId,
        aksi: 'UPDATE',
        entitas: 'Lahan',
        entitas_id: lahanId,
      },
    });

    return { pesan: 'Lahan berhasil diperbarui' };
  }

  /**
   * Verifikasi lahan (Koordinator Kecamatan / Admin)
   */
  async verifikasiLahan(lahanId: string, dto: VerifikasiLahanDto, verifikatorId: string) {
    const existing = await this.app.prisma.lahan.findUnique({
      where: { id: lahanId },
      select: { id: true, status: true },
    });

    if (!existing) throw { statusCode: 404, message: 'Lahan tidak ditemukan' };
    if (existing.status !== 'DALAM_REVIEW') {
      throw { statusCode: 400, message: 'Lahan tidak dalam status review' };
    }

    await this.app.prisma.lahan.update({
      where: { id: lahanId },
      data: {
        status: dto.status as any,
        catatan_verifikasi: dto.catatan_verifikasi,
        verifikator_id: verifikatorId,
        tgl_verifikasi: new Date(),
      },
    });

    await this.app.prisma.auditLog.create({
      data: {
        pengguna_id: verifikatorId,
        aksi: dto.status === 'AKTIF' ? 'VERIFY_APPROVE' : 'VERIFY_REJECT',
        entitas: 'Lahan',
        entitas_id: lahanId,
      },
    });

    return { pesan: `Lahan berhasil ${dto.status === 'AKTIF' ? 'disetujui' : 'ditolak'}` };
  }

  /**
   * GeoJSON semua lahan aktif untuk peta
   */
  async getPetaLahan(kecamatan?: string) {
    const whereClause = kecamatan
      ? `AND kecamatan = '${kecamatan.replace(/'/g, "''")}'`
      : '';

    const result = await this.app.prisma.$queryRaw<
      { id: string; nama: string; kecamatan: string; luas_m2: number; feature: string }[]
    >`
      SELECT
        id::text,
        nama,
        kecamatan,
        luas_m2::float,
        json_build_object(
          'type', 'Feature',
          'geometry', ST_AsGeoJSON(geom)::json,
          'properties', json_build_object(
            'id', id::text,
            'nama', nama,
            'kecamatan', kecamatan,
            'kelurahan', kelurahan,
            'luas_m2', luas_m2,
            'status', status
          )
        )::text as feature
      FROM "Lahan"
      WHERE status = 'AKTIF'
      AND geom IS NOT NULL
      ${this.app.prisma.$queryRaw`${whereClause}`}
    `;

    return {
      type: 'FeatureCollection',
      features: result.map((r) => JSON.parse(r.feature)),
    };
  }
}
