import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { UploadService } from '../modules/upload/upload.service';

// ============================================================
// Pengguna Routes — /api/v1/pengguna
// ============================================================

export async function penggunaRoutes(app: FastifyInstance) {
  const uploadService = new UploadService(app);

  // GET /pengguna — Daftar pengguna (Admin)
  app.get('/', {
    preHandler: [app.requireRole(['KOORDINATOR_KECAMATAN', 'ADMIN_DINAS', 'SUPER_ADMIN'])],
    schema: { tags: ['pengguna'], summary: 'Daftar semua pengguna (admin)' },
  }, async (request: any, reply) => {
    const { page = 1, limit = 20, search, peran, kecamatan } = request.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { deleted_at: null };
    if (search) {
      where.OR = [
        { nama_lengkap: { contains: search, mode: 'insensitive' } },
        { nomor_wa: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (peran) where.peran = peran;
    if (kecamatan) where.kecamatan = kecamatan;

    const [total, data] = await Promise.all([
      app.prisma.pengguna.count({ where }),
      app.prisma.pengguna.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { created_at: 'desc' },
        select: {
          id: true, nama_lengkap: true, nomor_wa: true, email: true,
          peran: true, kecamatan: true, kelurahan: true,
          is_active: true, is_verified: true, created_at: true,
          foto_profil_url: true,
        },
      }),
    ]);

    return reply.send({ data, total, page: Number(page), limit: Number(limit) });
  });

  // GET /pengguna/:id — Detail pengguna
  app.get('/:id', {
    preHandler: [app.authenticate],
    schema: { tags: ['pengguna'], summary: 'Detail pengguna' },
  }, async (request: any, reply) => {
    const { id } = request.params;

    // Pengguna biasa hanya bisa akses profil sendiri
    const isAdmin = ['ADMIN_DINAS', 'SUPER_ADMIN', 'KOORDINATOR_KECAMATAN'].includes(request.user.peran);
    if (!isAdmin && request.user.sub !== id) {
      return reply.status(403).send({ message: 'Akses ditolak' });
    }

    const pengguna = await app.prisma.pengguna.findUnique({
      where: { id, deleted_at: null },
      select: {
        id: true, nama_lengkap: true, nomor_wa: true, email: true,
        peran: true, kecamatan: true, kelurahan: true,
        foto_profil_url: true, is_verified: true, consent_diberikan: true,
        created_at: true,
        kelompok_tani: { select: { kelompok: { select: { id: true, nama: true } } } },
        _count: { select: { lahan: true, catatan_panen: true } },
      },
    });

    if (!pengguna) return reply.status(404).send({ message: 'Pengguna tidak ditemukan' });
    return reply.send(pengguna);
  });

  // PATCH /pengguna/profil — Update profil sendiri
  app.patch('/profil', {
    preHandler: [app.authenticate],
    schema: { tags: ['pengguna'], summary: 'Update profil pengguna login', body: { type: 'object' } },
  }, async (request: any, reply) => {
    const schema = z.object({
      nama_lengkap: z.string().min(3).max(100).optional(),
      email: z.string().email().optional(),
      kecamatan: z.string().max(50).optional(),
      kelurahan: z.string().max(50).optional(),
    });

    const r = schema.safeParse(request.body);
    if (!r.success) return reply.status(400).send({ message: r.error.errors.map((e) => e.message).join('; ') });

    await app.prisma.pengguna.update({
      where: { id: request.user.sub },
      data: r.data,
    });

    return reply.send({ pesan: 'Profil berhasil diperbarui' });
  });

  // POST /pengguna/foto-profil — Upload foto profil
  app.post('/foto-profil', {
    preHandler: [app.authenticate],
    schema: { tags: ['pengguna'], summary: 'Upload foto profil ke MinIO' },
  }, async (request, reply) => {
    const { buffer, mimetype } = await uploadService.parseMultipart(request);

    const { url } = await uploadService.uploadGambar(
      buffer,
      mimetype,
      `profil/${request.user.sub}`,
      'public'
    );

    await app.prisma.pengguna.update({
      where: { id: request.user.sub },
      data: { foto_profil_url: url },
    });

    return reply.send({ foto_profil_url: url, pesan: 'Foto profil berhasil diperbarui' });
  });

  // PATCH /pengguna/:id/status — Aktifkan/nonaktifkan (Admin)
  app.patch('/:id/status', {
    preHandler: [app.requireRole(['ADMIN_DINAS', 'SUPER_ADMIN'])],
    schema: {
      tags: ['pengguna'],
      summary: 'Toggle aktif/nonaktif pengguna (Admin)',
      body: { type: 'object', properties: { is_active: { type: 'boolean' } } },
    },
  }, async (request: any, reply) => {
    const { is_active } = request.body;
    await app.prisma.pengguna.update({
      where: { id: request.params.id },
      data: { is_active },
    });

    await app.prisma.auditLog.create({
      data: {
        pengguna_id: request.user.sub,
        aksi: is_active ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
        entitas: 'Pengguna',
        entitas_id: request.params.id,
      },
    });

    return reply.send({ pesan: `Pengguna berhasil ${is_active ? 'diaktifkan' : 'dinonaktifkan'}` });
  });

  // DELETE /pengguna/:id — Soft delete + anonimisasi (UU PDP)
  app.delete('/:id', {
    preHandler: [app.requireRole(['SUPER_ADMIN'])],
    schema: { tags: ['pengguna'], summary: 'Soft delete + anonimisasi data (UU PDP)' },
  }, async (request: any, reply) => {
    const tglHapus = new Date();
    const tglAnonim = new Date(tglHapus.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 hari

    await app.prisma.pengguna.update({
      where: { id: request.params.id },
      data: {
        deleted_at: tglHapus,
        is_active: false,
        // Jadwalkan anonimisasi +30 hari via BullMQ (di sini simpan catatan)
        catatan_hapus: `Dijadwalkan anonim pada: ${tglAnonim.toISOString()}`,
      },
    });

    await app.prisma.auditLog.create({
      data: {
        pengguna_id: request.user.sub,
        aksi: 'SOFT_DELETE_USER',
        entitas: 'Pengguna',
        entitas_id: request.params.id,
        data_baru: { tgl_hapus: tglHapus, tgl_anonim: tglAnonim },
      },
    });

    return reply.send({
      pesan: 'Akun dinonaktifkan. Data akan dianonimisasi dalam 30 hari sesuai UU PDP.',
    });
  });
}
