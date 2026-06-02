import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { NotifikasiService } from '../modules/notifikasi/notifikasi.service';

export async function notifikasiRoutes(app: FastifyInstance) {
  const svc = new NotifikasiService(app);

  // GET /notifikasi — Daftar notifikasi pengguna
  app.get('/', {
    preHandler: [app.authenticate],
    schema: { tags: ['notifikasi'], summary: 'Daftar notifikasi pengguna login' },
  }, async (request: any, reply) => {
    const { page = 1, limit = 20 } = request.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [total, data] = await Promise.all([
      app.prisma.notifikasi.count({ where: { pengguna_id: request.user.sub } }),
      app.prisma.notifikasi.findMany({
        where: { pengguna_id: request.user.sub },
        skip,
        take: Number(limit),
        orderBy: { created_at: 'desc' },
      }),
    ]);

    return reply.send({ data, total, belum_dibaca: data.filter((n: any) => !n.is_read).length });
  });

  // PATCH /notifikasi/:id/baca — Tandai sudah dibaca
  app.patch('/:id/baca', {
    preHandler: [app.authenticate],
    schema: { tags: ['notifikasi'], summary: 'Tandai notifikasi sudah dibaca' },
  }, async (request: any, reply) => {
    await app.prisma.notifikasi.updateMany({
      where: { id: request.params.id, pengguna_id: request.user.sub },
      data: { is_read: true, read_at: new Date() },
    });
    return reply.send({ pesan: 'Notifikasi ditandai dibaca' });
  });

  // PATCH /notifikasi/baca-semua
  app.patch('/baca-semua', {
    preHandler: [app.authenticate],
    schema: { tags: ['notifikasi'], summary: 'Tandai semua notifikasi sudah dibaca' },
  }, async (request, reply) => {
    await app.prisma.notifikasi.updateMany({
      where: { pengguna_id: request.user.sub, is_read: false },
      data: { is_read: true, read_at: new Date() },
    });
    return reply.send({ pesan: 'Semua notifikasi ditandai dibaca' });
  });

  // PUT /notifikasi/fcm-token — Update FCM token device
  app.put('/fcm-token', {
    preHandler: [app.authenticate],
    schema: { tags: ['notifikasi'], summary: 'Update FCM token device', body: { type: 'object' } },
  }, async (request: any, reply) => {
    const { fcm_token } = request.body;
    if (!fcm_token || typeof fcm_token !== 'string') {
      return reply.status(400).send({ message: 'fcm_token wajib diisi' });
    }

    await app.prisma.pengguna.update({
      where: { id: request.user.sub },
      data: { fcm_token },
    });

    return reply.send({ pesan: 'FCM token diperbarui' });
  });

  // POST /notifikasi/broadcast — Kirim broadcast (Admin)
  app.post('/broadcast', {
    preHandler: [app.requireRole(['ADMIN_DINAS', 'SUPER_ADMIN'])],
    schema: { tags: ['notifikasi'], summary: 'Kirim broadcast notifikasi', body: { type: 'object' } },
  }, async (request: any, reply) => {
    const schema = z.object({
      judul: z.string().min(3).max(100),
      isi: z.string().min(5).max(500),
      tipe: z.enum(['SISTEM', 'PROMOSI', 'PENGUMUMAN']),
      peran: z.string().optional(),
      kecamatan: z.string().optional(),
    });

    const r = schema.safeParse(request.body);
    if (!r.success) return reply.status(400).send({ message: r.error.errors.map((e) => e.message).join('; ') });

    const { judul, isi, tipe, peran, kecamatan } = r.data;
    const result = await svc.kirimBroadcast(
      { peran, kecamatan },
      { judul, isi, tipe: tipe as any }
    );

    return reply.send(result);
  });
}
