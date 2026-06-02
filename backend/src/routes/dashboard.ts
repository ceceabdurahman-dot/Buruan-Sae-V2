import { FastifyInstance } from 'fastify';
import { DashboardService } from '../modules/dashboard/dashboard.service';

export async function dashboardRoutes(app: FastifyInstance) {
  const svc = new DashboardService(app);

  // GET /dashboard/kpi — KPI utama (Admin)
  app.get('/kpi', {
    preHandler: [app.requireRole(['KOORDINATOR_KECAMATAN', 'ADMIN_DINAS', 'SUPER_ADMIN'])],
    schema: { tags: ['dashboard'], summary: 'KPI utama dashboard admin' },
  }, async (req: any, reply) => {
    const { kecamatan, bulan } = req.query;
    return reply.send(await svc.kpiUtama({ kecamatan, bulan }));
  });

  // GET /dashboard/produksi-per-kecamatan
  app.get('/produksi-per-kecamatan', {
    preHandler: [app.requireRole(['KOORDINATOR_KECAMATAN', 'ADMIN_DINAS', 'SUPER_ADMIN'])],
    schema: { tags: ['dashboard'], summary: 'Grafik produksi per kecamatan per bulan' },
  }, async (req: any, reply) => {
    const tahun = parseInt(req.query.tahun ?? String(new Date().getFullYear()));
    return reply.send(await svc.produksiPerKecamatan(tahun));
  });

  // GET /dashboard/top-petani
  app.get('/top-petani', {
    preHandler: [app.requireRole(['KOORDINATOR_KECAMATAN', 'ADMIN_DINAS', 'SUPER_ADMIN'])],
    schema: { tags: ['dashboard'], summary: 'Top 10 petani berdasarkan total panen' },
  }, async (req: any, reply) => {
    return reply.send(await svc.topPetani(req.query.bulan));
  });

  // GET /dashboard/distribusi-lahan
  app.get('/distribusi-lahan', {
    preHandler: [app.requireRole(['KOORDINATOR_KECAMATAN', 'ADMIN_DINAS', 'SUPER_ADMIN'])],
    schema: { tags: ['dashboard'], summary: 'Distribusi lahan per kecamatan' },
  }, async (_req, reply) => {
    return reply.send(await svc.distribusiLahanPerKecamatan());
  });

  // GET /dashboard/aktivitas
  app.get('/aktivitas', {
    preHandler: [app.requireRole(['ADMIN_DINAS', 'SUPER_ADMIN'])],
    schema: { tags: ['dashboard'], summary: 'Aktivitas terbaru (audit log)' },
  }, async (_req, reply) => {
    return reply.send(await svc.aktivitasTerbaru(20));
  });

  // POST /dashboard/track — Track pengguna aktif (DAU/MAU)
  app.post('/track', {
    preHandler: [app.authenticate],
    schema: { tags: ['dashboard'], summary: 'Track pengguna aktif ke Redis' },
  }, async (req, reply) => {
    await svc.trackActiveUser(req.user.sub);
    return reply.send({ ok: true });
  });
}
