import { FastifyInstance } from 'fastify';
import {
  ProduksiService,
  CatatanPanenSchema,
  UpdateCatatanPanenSchema,
  QueryProduksiSchema,
  RingkasanProduksiSchema,
} from '../modules/produksi/produksi.service';

// ============================================================
// Produksi Routes — /api/v1/produksi
// ============================================================

export async function produksiRoutes(app: FastifyInstance) {
  const produksiService = new ProduksiService(app);

  const validate = <T>(schema: any, data: unknown): T => {
    const result = schema.safeParse(data);
    if (!result.success) {
      const msgs = result.error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`);
      throw app.httpErrors.badRequest(msgs.join('; '));
    }
    return result.data;
  };

  // ----------------------------------------------------------
  // GET /produksi/catatan — Daftar catatan panen
  // ----------------------------------------------------------
  app.get('/catatan', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['produksi'],
      summary: 'Daftar catatan panen dengan filter',
    },
  }, async (request, reply) => {
    const query = validate(QueryProduksiSchema, request.query);
    const result = await produksiService.daftarCatatanPanen(
      query,
      request.user.sub,
      request.user.peran
    );
    return reply.send(result);
  });

  // ----------------------------------------------------------
  // POST /produksi/catatan — Tambah catatan panen
  // ----------------------------------------------------------
  app.post('/catatan', {
    preHandler: [app.requireRole(['PETANI', 'KADER_KELURAHAN'])],
    schema: {
      tags: ['produksi'],
      summary: 'Tambah catatan panen (mendukung offline sync)',
      body: { type: 'object' },
    },
  }, async (request, reply) => {
    const dto = validate(CatatanPanenSchema, request.body);
    const result = await produksiService.tambahCatatanPanen(dto, request.user.sub);
    return reply.status(201).send(result);
  });

  // ----------------------------------------------------------
  // POST /produksi/catatan/batch — Sync offline batch
  // ----------------------------------------------------------
  app.post('/catatan/batch', {
    preHandler: [app.requireRole(['PETANI', 'KADER_KELURAHAN'])],
    schema: {
      tags: ['produksi'],
      summary: 'Upload batch catatan panen dari mode offline',
      body: {
        type: 'object',
        properties: {
          catatan: { type: 'array' },
        },
      },
    },
  }, async (request: any, reply) => {
    const { catatan } = request.body;
    if (!Array.isArray(catatan) || catatan.length === 0) {
      return reply.status(400).send({ message: 'Array catatan tidak boleh kosong' });
    }
    if (catatan.length > 100) {
      return reply.status(400).send({ message: 'Maksimal 100 catatan per batch' });
    }

    const results = [];
    for (const item of catatan) {
      try {
        const dto = validate(CatatanPanenSchema, item);
        const result = await produksiService.tambahCatatanPanen(dto, request.user.sub);
        results.push({ berhasil: true, idempotency_key: item.idempotency_key, id: result.id });
      } catch (err: any) {
        results.push({
          berhasil: false,
          idempotency_key: item.idempotency_key,
          error: err.message ?? 'Error tidak diketahui',
        });
      }
    }

    return reply.send({
      total: catatan.length,
      berhasil: results.filter((r) => r.berhasil).length,
      gagal: results.filter((r) => !r.berhasil).length,
      detail: results,
    });
  });

  // ----------------------------------------------------------
  // GET /produksi/ringkasan — Ringkasan bulanan
  // ----------------------------------------------------------
  app.get('/ringkasan', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['produksi'],
      summary: 'Ringkasan produksi bulanan per komoditas (data chart)',
    },
  }, async (request: any, reply) => {
    const { lahan_id, tahun } = request.query;
    const result = await produksiService.ringkasanProduksiBulanan(
      lahan_id,
      tahun ? parseInt(tahun) : undefined
    );
    return reply.send(result);
  });

  // ----------------------------------------------------------
  // GET /produksi/statistik — Statistik total (dashboard)
  // ----------------------------------------------------------
  app.get('/statistik', {
    preHandler: [app.requireRole(['KOORDINATOR_KECAMATAN', 'ADMIN_DINAS', 'SUPER_ADMIN'])],
    schema: {
      tags: ['produksi'],
      summary: 'Statistik produksi (untuk dashboard admin)',
    },
  }, async (request: any, reply) => {
    const { kecamatan, bulan } = request.query;
    const result = await produksiService.statistikProduksi({ kecamatan, bulan });
    return reply.send(result);
  });

  // ----------------------------------------------------------
  // GET /produksi/komoditas — Daftar komoditas
  // ----------------------------------------------------------
  app.get('/komoditas', {
    schema: {
      tags: ['produksi'],
      summary: 'Daftar komoditas yang tersedia',
      security: [],
    },
  }, async (request: any, reply) => {
    const { kategori, search } = request.query;
    const where: any = { is_active: true };
    if (kategori) where.kategori = kategori;
    if (search) where.nama = { contains: search, mode: 'insensitive' };

    const komoditas = await app.prisma.komoditas.findMany({
      where,
      orderBy: { nama: 'asc' },
      select: {
        id: true,
        nama: true,
        nama_latin: true,
        kategori: true,
        satuan: true,
        harga_acuan: true,
        foto_url: true,
      },
    });

    return reply.send(komoditas);
  });
}
