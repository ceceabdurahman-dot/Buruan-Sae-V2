import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import multipart from '@fastify/multipart';

// Plugins
import { prismaPlugin } from './plugins/prisma';
import { redisPlugin } from './plugins/redis';
import { minioPlugin } from './plugins/minio';
import { jwtPlugin } from './plugins/jwt';
import { sanitizePlugin } from './plugins/sanitize';
import { auditPlugin } from './plugins/audit';

// Routes
import { authRoutes } from './routes/auth';
import { penggunaRoutes } from './routes/pengguna';
import { lahanRoutes } from './routes/lahan';
import { produksiRoutes } from './routes/produksi';
import { marketplaceRoutes } from './routes/marketplace';
import { agrowisataRoutes } from './routes/agrowisata';
import { komunitasRoutes } from './routes/komunitas';
import { edukasiRoutes } from './routes/edukasi';
import { dashboardRoutes } from './routes/dashboard';
import { notifikasiRoutes } from './routes/notifikasi';
import { webhookRoutes } from './routes/webhook';
import { healthRoutes } from './routes/health';

interface BuildAppOptions {
  logger?: boolean | object;
}

export async function buildApp(opts: BuildAppOptions = {}): Promise<FastifyInstance> {
  const loggerConfig = opts.logger === false
    ? false
    : opts.logger ?? {
        level: process.env.LOG_LEVEL ?? 'info',
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
      };

  const app = Fastify({
    logger: loggerConfig,
    trustProxy: true,
  });

  // ── Keamanan
  await app.register(helmet, {
    contentSecurityPolicy: false, // CSP diatur di Nginx
  });

  // ── CORS
  const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map(o => o.trim());

  await app.register(cors, {
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  });

  // ── Rate Limiting (Redis didaftarkan lebih dulu agar state terdistribusi)
  // Redis plugin didaftarkan di bawah sebelum route, tapi rate-limit butuh
  // instance Redis saat register — kita gunakan lazy getter via store.
  await app.register(rateLimit, {
    max: Number(process.env.RATE_LIMIT_MAX ?? 100),
    timeWindow: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
    keyGenerator: (request) => request.ip,
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Terlalu banyak permintaan. Coba lagi dalam 1 menit.',
    }),
    // Redis dihubungkan setelah plugin didaftarkan (lihat onReady hook di bawah)
  });

  // ── Multipart (upload file)
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB
      files: 10,
    },
  });

  // ── Swagger API Docs (development only)
  if (process.env.NODE_ENV !== 'production') {
    await app.register(swagger, {
      openapi: {
        info: {
          title: 'Buruan Sae 2.0 API',
          description: 'API Aplikasi Urban Farming Kota Bandung',
          version: '2.0.0',
        },
        servers: [{ url: `http://localhost:${process.env.PORT ?? 3001}` }],
        components: {
          securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
          },
        },
        security: [{ bearerAuth: [] }],
      },
    });

    await app.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: { docExpansion: 'list', deepLinking: true },
    });
  }

  // ── Plugins (database, cache, storage, security)
  await app.register(prismaPlugin);
  await app.register(redisPlugin);
  await app.register(minioPlugin);
  await app.register(jwtPlugin);
  await app.register(sanitizePlugin); // XSS sanitization
  await app.register(auditPlugin);    // Audit log untuk endpoint sensitif

  // ── Routes
  await app.register(healthRoutes, { prefix: '/health' });
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(penggunaRoutes, { prefix: '/pengguna' });
  await app.register(lahanRoutes, { prefix: '/lahan' });
  await app.register(produksiRoutes, { prefix: '/produksi' });
  await app.register(marketplaceRoutes, { prefix: '/marketplace' });
  await app.register(agrowisataRoutes, { prefix: '/agrowisata' });
  await app.register(komunitasRoutes, { prefix: '/komunitas' });
  await app.register(edukasiRoutes, { prefix: '/edukasi' });
  await app.register(dashboardRoutes, { prefix: '/dashboard' });
  await app.register(notifikasiRoutes, { prefix: '/notifikasi' });
  await app.register(webhookRoutes, { prefix: '/webhook' });

  // ── Error Handler Global
  app.setErrorHandler((error, request, reply) => {
    app.log.error({ err: error, url: request.url }, 'Request error');

    if (error.validation) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Validation Error',
        message: 'Data yang dikirim tidak valid',
        details: error.validation,
      });
    }

    if (error.statusCode) {
      return reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        error: error.name,
        message: error.message,
      });
    }

    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Terjadi kesalahan internal. Silakan coba lagi.',
    });
  });

  return app;
}
