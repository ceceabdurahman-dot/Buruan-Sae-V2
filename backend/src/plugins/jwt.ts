import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fjwt from '@fastify/jwt';

export interface JwtPayload {
  sub: string;       // user ID
  email: string;
  peran: string;
  iat?: number;
  exp?: number;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

export const jwtPlugin = fp(async (app: FastifyInstance) => {
  // Gagal startup jika JWT_SECRET tidak disetel — mencegah pakai fallback di production
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error(
      '[Security] JWT_SECRET wajib disetel dan minimal 32 karakter. ' +
      'Generate dengan: openssl rand -hex 32'
    );
  }

  await app.register(fjwt, {
    secret: jwtSecret,
    sign: { expiresIn: process.env.JWT_EXPIRES_IN ?? '24h' },
  });

  // Decorator: authenticate (wajib login)
  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Token tidak valid atau sudah kadaluarsa',
      });
    }
  });

  // Decorator: requireRole (cek peran)
  app.decorate(
    'requireRole',
    (roles: string[]) =>
      async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          await request.jwtVerify();
        } catch {
          return reply.status(401).send({
            statusCode: 401,
            error: 'Unauthorized',
            message: 'Token tidak valid',
          });
        }

        if (!roles.includes(request.user.peran)) {
          return reply.status(403).send({
            statusCode: 403,
            error: 'Forbidden',
            message: 'Anda tidak memiliki akses ke resource ini',
          });
        }
      },
  );

  app.log.info('✅ JWT plugin terdaftar');
});

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (roles: string[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
