import { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance) {
  // GET /health
  app.get(
    '/',
    {
      schema: {
        tags: ['system'],
        summary: 'Health check',
        security: [],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
              version: { type: 'string' },
              services: { type: 'object' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      // Cek koneksi database
      let dbOk = false;
      try {
        await app.prisma.$queryRaw`SELECT 1`;
        dbOk = true;
      } catch {}

      // Cek Redis
      let redisOk = false;
      try {
        await app.redis.ping();
        redisOk = true;
      } catch {}

      const allOk = dbOk && redisOk;

      return reply.status(allOk ? 200 : 503).send({
        status: allOk ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        services: {
          database: dbOk ? 'ok' : 'error',
          redis: redisOk ? 'ok' : 'error',
        },
      });
    },
  );

  // GET /health/ready (Kubernetes readiness probe)
  app.get('/ready', { schema: { security: [] } }, async (request, reply) => {
    return reply.send({ ready: true });
  });
}
