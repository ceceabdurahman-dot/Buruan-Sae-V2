import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

// ============================================================
// Audit Middleware Plugin — Log semua request ke sensitive endpoints
// ============================================================

const SENSITIVE_PATHS = [
  '/api/v1/pengguna',
  '/api/v1/auth',
  '/api/v1/lahan',
  '/api/v1/produksi',
  '/api/v1/marketplace/pesanan',
  '/api/v1/dashboard',
];

const SKIP_METHODS = ['GET', 'HEAD', 'OPTIONS'];

export const auditPlugin = fp(async (app: FastifyInstance) => {
  app.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip metode read-only dan endpoint tidak sensitif
    if (SKIP_METHODS.includes(request.method)) return;
    if (!SENSITIVE_PATHS.some((p) => request.url.startsWith(p))) return;

    // Hanya log response sukses (2xx)
    if (reply.statusCode < 200 || reply.statusCode >= 300) return;

    try {
      const user = (request as any).user;
      await app.prisma.auditLog.create({
        data: {
          pengguna_id: user?.sub ?? null,
          aksi: `${request.method} ${request.url.split('?')[0]}`,
          entitas: 'Request',
          ip_address: request.ip,
          user_agent: request.headers['user-agent']?.slice(0, 200),
          data_baru: {
            status_code: reply.statusCode,
            method: request.method,
            url: request.url,
          },
        },
      });
    } catch {
      // Non-critical: jangan gagalkan request
    }
  });

  app.log.info('✅ Audit middleware aktif');
});
