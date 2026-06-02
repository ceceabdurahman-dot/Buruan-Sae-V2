import { FastifyInstance } from 'fastify';
import { AgrowisataService, TambahPaketSchema, BookingSchema } from '../modules/agrowisata/agrowisata.service';
import { PembayaranService } from '../modules/marketplace/pembayaran.service';

export async function agrowisataRoutes(app: FastifyInstance) {
  const agrowisataService = new AgrowisataService(app);
  const pembayaranService = new PembayaranService(app);

  const validate = <T>(schema: any, data: unknown): T => {
    const r = schema.safeParse(data);
    if (!r.success) throw app.httpErrors.badRequest(r.error.errors.map((e: any) => e.message).join('; '));
    return r.data;
  };

  // GET /agrowisata/paket — Daftar paket (publik)
  app.get('/paket', {
    schema: { tags: ['agrowisata'], summary: 'Daftar paket agrowisata', security: [] },
  }, async (request: any, reply) => {
    return reply.send(await agrowisataService.daftarPaket(request.query));
  });

  // GET /agrowisata/paket/:id
  app.get('/paket/:id', {
    schema: { tags: ['agrowisata'], summary: 'Detail paket + kalender booking', security: [] },
  }, async (request: any, reply) => {
    return reply.send(await agrowisataService.detailPaket(request.params.id));
  });

  // POST /agrowisata/paket — Tambah paket (Pengelola Wisata)
  app.post('/paket', {
    preHandler: [app.requireRole(['PENGELOLA_WISATA', 'ADMIN_DINAS', 'SUPER_ADMIN'])],
    schema: { tags: ['agrowisata'], summary: 'Tambah paket wisata', body: { type: 'object' } },
  }, async (request, reply) => {
    const dto = validate(TambahPaketSchema, request.body);
    return reply.status(201).send(await agrowisataService.tambahPaket(dto, request.user.sub));
  });

  // POST /agrowisata/booking — Buat booking
  app.post('/booking', {
    preHandler: [app.authenticate],
    schema: { tags: ['agrowisata'], summary: 'Buat booking agrowisata', body: { type: 'object' } },
  }, async (request, reply) => {
    const dto = validate(BookingSchema, request.body);
    return reply.status(201).send(await agrowisataService.buatBooking(dto, request.user.sub));
  });

  // POST /agrowisata/booking/:id/bayar
  app.post('/booking/:id/bayar', {
    preHandler: [app.authenticate],
    schema: { tags: ['agrowisata'], summary: 'Dapatkan Snap token untuk booking' },
  }, async (request: any, reply) => {
    const snapToken = await pembayaranService.buatSnapTokenBooking(request.params.id);
    return reply.send({ snap_token: snapToken });
  });
}
