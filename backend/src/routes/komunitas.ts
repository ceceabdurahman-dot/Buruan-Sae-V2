import { FastifyInstance } from 'fastify';
import { KomunitasService, PostinganSchema, KomentarSchema, QueryPostinganSchema } from '../modules/komunitas/komunitas.service';

export async function komunitasRoutes(app: FastifyInstance) {
  const svc = new KomunitasService(app);
  const v = <T>(schema: any, data: unknown): T => {
    const r = schema.safeParse(data);
    if (!r.success) throw app.httpErrors.badRequest(r.error.errors.map((e: any) => e.message).join('; '));
    return r.data;
  };

  // GET /komunitas/postingan
  app.get('/postingan', {
    schema: { tags: ['komunitas'], summary: 'Daftar postingan komunitas', security: [] },
  }, async (req: any, reply) => {
    return reply.send(await svc.daftarPostingan(v(QueryPostinganSchema, req.query)));
  });

  // GET /komunitas/postingan/:id
  app.get('/postingan/:id', {
    schema: { tags: ['komunitas'], summary: 'Detail postingan + komentar', security: [] },
  }, async (req: any, reply) => {
    return reply.send(await svc.detailPostingan(req.params.id));
  });

  // POST /komunitas/postingan
  app.post('/postingan', {
    preHandler: [app.authenticate],
    schema: { tags: ['komunitas'], summary: 'Buat postingan baru', body: { type: 'object' } },
  }, async (req, reply) => {
    const dto = v(PostinganSchema, req.body);
    return reply.status(201).send(await svc.buatPostingan(dto, req.user.sub));
  });

  // POST /komunitas/postingan/:id/komentar
  app.post('/postingan/:id/komentar', {
    preHandler: [app.authenticate],
    schema: { tags: ['komunitas'], summary: 'Tambah komentar', body: { type: 'object' } },
  }, async (req: any, reply) => {
    const dto = v(KomentarSchema, req.body);
    return reply.status(201).send(await svc.tambahKomentar(req.params.id, dto, req.user.sub));
  });

  // POST /komunitas/postingan/:id/like
  app.post('/postingan/:id/like', {
    preHandler: [app.authenticate],
    schema: { tags: ['komunitas'], summary: 'Toggle like postingan' },
  }, async (req: any, reply) => {
    return reply.send(await svc.toggleLike(req.params.id, req.user.sub));
  });
}
