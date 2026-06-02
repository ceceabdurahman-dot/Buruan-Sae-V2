import { FastifyInstance } from 'fastify';
import { EdukasiService, TambahKursusSchema } from '../modules/edukasi/edukasi.service';

export async function edukasiRoutes(app: FastifyInstance) {
  const svc = new EdukasiService(app);
  const v = <T>(schema: any, data: unknown): T => {
    const r = schema.safeParse(data);
    if (!r.success) throw app.httpErrors.badRequest(r.error.errors.map((e: any) => e.message).join('; '));
    return r.data;
  };

  // GET /edukasi/kursus — Daftar kursus (publik)
  app.get('/kursus', {
    schema: { tags: ['edukasi'], summary: 'Daftar kursus edukasi', security: [] },
  }, async (req: any, reply) => {
    return reply.send(await svc.daftarKursus(req.query));
  });

  // GET /edukasi/kursus/:id — Detail kursus + progres
  app.get('/kursus/:id', {
    schema: { tags: ['edukasi'], summary: 'Detail kursus + progres belajar', security: [] },
  }, async (req: any, reply) => {
    const penggunaId = req.headers.authorization
      ? (await req.jwtVerify().then(() => req.user?.sub).catch(() => undefined))
      : undefined;
    return reply.send(await svc.detailKursus(req.params.id, penggunaId));
  });

  // POST /edukasi/kursus — Tambah kursus (Admin)
  app.post('/kursus', {
    preHandler: [app.requireRole(['KADER_KELURAHAN', 'KOORDINATOR_KECAMATAN', 'ADMIN_DINAS', 'SUPER_ADMIN'])],
    schema: { tags: ['edukasi'], summary: 'Tambah kursus baru', body: { type: 'object' } },
  }, async (req, reply) => {
    const dto = v(TambahKursusSchema, req.body);
    return reply.status(201).send(await svc.tambahKursus(dto, req.user.sub));
  });

  // POST /edukasi/modul/:id/selesai — Tandai modul selesai
  app.post('/modul/:id/selesai', {
    preHandler: [app.authenticate],
    schema: { tags: ['edukasi'], summary: 'Tandai modul sebagai selesai' },
  }, async (req: any, reply) => {
    return reply.send(await svc.tandaiModulSelesai(req.params.id, req.user.sub));
  });
}
