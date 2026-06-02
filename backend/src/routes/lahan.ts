import { FastifyInstance } from 'fastify';
import {
  LahanService,
  TambahLahanSchema,
  UpdateLahanSchema,
  VerifikasiLahanSchema,
  QueryLahanSchema,
} from '../modules/lahan/lahan.service';

// ============================================================
// Lahan Routes — /api/v1/lahan
// ============================================================

export async function lahanRoutes(app: FastifyInstance) {
  const lahanService = new LahanService(app);

  const validate = <T>(schema: any, data: unknown): T => {
    const result = schema.safeParse(data);
    if (!result.success) {
      const messages = result.error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`);
      throw app.httpErrors.badRequest(messages.join('; '));
    }
    return result.data;
  };

  // ----------------------------------------------------------
  // GET /lahan — Daftar lahan
  // ----------------------------------------------------------
  app.get('/', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['lahan'],
      summary: 'Daftar lahan dengan pagination dan filter',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 20 },
          kecamatan: { type: 'string' },
          status: { type: 'string' },
          search: { type: 'string' },
          bbox: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const query = validate(QueryLahanSchema, request.query);
    const result = await lahanService.daftarLahan(
      query,
      request.user.sub,
      request.user.peran
    );
    return reply.send(result);
  });

  // ----------------------------------------------------------
  // GET /lahan/peta — GeoJSON untuk peta (publik)
  // ----------------------------------------------------------
  app.get('/peta', {
    schema: {
      tags: ['lahan'],
      summary: 'GeoJSON semua lahan aktif untuk tampilan peta',
      security: [],
      querystring: {
        type: 'object',
        properties: {
          kecamatan: { type: 'string' },
        },
      },
    },
  }, async (request: any, reply) => {
    const { kecamatan } = request.query;
    const result = await lahanService.getPetaLahan(kecamatan);
    return reply.send(result);
  });

  // ----------------------------------------------------------
  // GET /lahan/:id — Detail lahan
  // ----------------------------------------------------------
  app.get('/:id', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['lahan'],
      summary: 'Detail lahan termasuk koordinat GeoJSON',
    },
  }, async (request: any, reply) => {
    const result = await lahanService.detailLahan(
      request.params.id,
      request.user.sub,
      request.user.peran
    );
    return reply.send(result);
  });

  // ----------------------------------------------------------
  // POST /lahan — Tambah lahan baru
  // ----------------------------------------------------------
  app.post('/', {
    preHandler: [app.requireRole(['PETANI', 'KADER_KELURAHAN', 'KOORDINATOR_KECAMATAN', 'ADMIN_DINAS', 'SUPER_ADMIN'])],
    schema: {
      tags: ['lahan'],
      summary: 'Tambah lahan baru (petani)',
      body: { type: 'object' },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            pesan: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const dto = validate(TambahLahanSchema, request.body);
    const result = await lahanService.tambahLahan(dto, request.user.sub);
    return reply.status(201).send(result);
  });

  // ----------------------------------------------------------
  // PATCH /lahan/:id — Update lahan
  // ----------------------------------------------------------
  app.patch('/:id', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['lahan'],
      summary: 'Update data lahan',
      body: { type: 'object' },
    },
  }, async (request: any, reply) => {
    const dto = validate(UpdateLahanSchema, request.body);
    const result = await lahanService.updateLahan(
      request.params.id,
      dto,
      request.user.sub,
      request.user.peran
    );
    return reply.send(result);
  });

  // ----------------------------------------------------------
  // POST /lahan/:id/verifikasi — Verifikasi lahan (admin)
  // ----------------------------------------------------------
  app.post('/:id/verifikasi', {
    preHandler: [app.requireRole(['KOORDINATOR_KECAMATAN', 'ADMIN_DINAS', 'SUPER_ADMIN'])],
    schema: {
      tags: ['lahan'],
      summary: 'Verifikasi atau tolak lahan (Koordinator/Admin)',
      body: { type: 'object' },
    },
  }, async (request: any, reply) => {
    const dto = validate(VerifikasiLahanSchema, request.body);
    const result = await lahanService.verifikasiLahan(
      request.params.id,
      dto,
      request.user.sub
    );
    return reply.send(result);
  });
}
