import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import Redis from 'ioredis';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}

export const redisPlugin = fp(async (app: FastifyInstance) => {
  const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    lazyConnect: false,
    enableReadyCheck: true,
  });

  redis.on('connect', () => app.log.info('✅ Redis terhubung'));
  redis.on('error', (err) => app.log.error({ err }, 'Redis error'));

  app.decorate('redis', redis);

  app.addHook('onClose', async () => {
    await redis.quit();
    app.log.info('🔌 Redis terputus');
  });
});
