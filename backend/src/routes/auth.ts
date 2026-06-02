import { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { AuthService } from '../modules/auth/auth.service';
import {
  RegisterSchema,
  LoginSchema,
  SendOtpSchema,
  VerifyOtpSchema,
  RefreshTokenSchema,
  ChangePasswordSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from '../modules/auth/auth.schema';

// ============================================================
// Auth Routes — /api/v1/auth
// ============================================================

export async function authRoutes(app: FastifyInstance) {
  const authService = new AuthService(app);

  // Helper: parse IP dari request
  const getIp = (req: any): string => req.ip ?? req.headers['x-forwarded-for'] ?? '';
  const getUserAgent = (req: any): string => req.headers['user-agent'] ?? '';

  // Helper: validasi Zod dan throw 400 jika gagal
  const validate = <T>(schema: any, body: unknown): T => {
    try {
      return schema.parse(body);
    } catch (err) {
      if (err instanceof ZodError) {
        const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
        throw app.httpErrors.badRequest(messages.join('; '));
      }
      throw err;
    }
  };

  // ----------------------------------------------------------
  // POST /auth/register
  // ----------------------------------------------------------
  app.post('/register', {
    config: { rateLimit: { max: 5, timeWindow: '10m' } },
    schema: {
      tags: ['auth'],
      summary: 'Registrasi pengguna baru',
      security: [],
      body: { type: 'object' },
      response: {
        201: {
          type: 'object',
          properties: {
            pesan: { type: 'string' },
            nomor_wa: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const dto = validate(RegisterSchema, request.body);
    const result = await authService.register(dto, {
      ip: getIp(request),
      userAgent: getUserAgent(request),
    });
    return reply.status(201).send(result);
  });

  // ----------------------------------------------------------
  // POST /auth/otp/send
  // ----------------------------------------------------------
  app.post('/otp/send', {
    config: { rateLimit: { max: 3, timeWindow: '5m' } },
    schema: {
      tags: ['auth'],
      summary: 'Kirim OTP ke WhatsApp',
      security: [],
      body: { type: 'object' },
    },
  }, async (request, reply) => {
    const dto = validate(SendOtpSchema, request.body);
    const result = await authService.otp.sendOtp(dto.nomor_wa);
    if (!result.berhasil) {
      return reply.status(429).send({ message: result.pesanError });
    }
    return reply.send({ pesan: 'OTP berhasil dikirim ke WhatsApp Anda' });
  });

  // ----------------------------------------------------------
  // POST /auth/otp/verify
  // ----------------------------------------------------------
  app.post('/otp/verify', {
    config: { rateLimit: { max: 10, timeWindow: '10m' } },
    schema: {
      tags: ['auth'],
      summary: 'Verifikasi OTP dan dapatkan token',
      security: [],
      body: { type: 'object' },
      response: {
        200: {
          type: 'object',
          properties: {
            access_token: { type: 'string' },
            refresh_token: { type: 'string' },
            peran: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const dto = validate(VerifyOtpSchema, request.body);
    const result = await authService.verifyOtp(dto.nomor_wa, dto.kode_otp, {
      ip: getIp(request),
      userAgent: getUserAgent(request),
    });
    return reply.send(result);
  });

  // ----------------------------------------------------------
  // POST /auth/login
  // ----------------------------------------------------------
  app.post('/login', {
    config: { rateLimit: { max: 10, timeWindow: '5m' } },
    schema: {
      tags: ['auth'],
      summary: 'Login dengan email/WA dan password',
      security: [],
      body: { type: 'object' },
      response: {
        200: {
          type: 'object',
          properties: {
            access_token: { type: 'string' },
            refresh_token: { type: 'string' },
            peran: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const dto = validate(LoginSchema, request.body);
    const result = await authService.login(dto, {
      ip: getIp(request),
      userAgent: getUserAgent(request),
    });
    return reply.send(result);
  });

  // ----------------------------------------------------------
  // POST /auth/refresh
  // ----------------------------------------------------------
  app.post('/refresh', {
    schema: {
      tags: ['auth'],
      summary: 'Perbarui access token dengan refresh token',
      security: [],
      body: { type: 'object' },
    },
  }, async (request, reply) => {
    const dto = validate(RefreshTokenSchema, request.body);
    const result = await authService.refreshToken(dto.refresh_token, {
      ip: getIp(request),
      userAgent: getUserAgent(request),
    });
    return reply.send(result);
  });

  // ----------------------------------------------------------
  // POST /auth/logout (perlu login)
  // ----------------------------------------------------------
  app.post('/logout', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['auth'],
      summary: 'Logout dan invalidasi refresh token',
      body: { type: 'object' },
    },
  }, async (request, reply) => {
    const dto = validate(RefreshTokenSchema, request.body);
    await authService.logout(request.user.sub, dto.refresh_token, {
      ip: getIp(request),
    });
    return reply.send({ pesan: 'Logout berhasil' });
  });

  // ----------------------------------------------------------
  // POST /auth/password/forgot
  // ----------------------------------------------------------
  app.post('/password/forgot', {
    config: { rateLimit: { max: 3, timeWindow: '10m' } },
    schema: {
      tags: ['auth'],
      summary: 'Kirim OTP untuk reset password',
      security: [],
      body: { type: 'object' },
    },
  }, async (request, reply) => {
    const dto = validate(ForgotPasswordSchema, request.body);

    // Cek apakah nomor WA terdaftar
    const exists = await app.prisma.pengguna.findUnique({
      where: { nomor_wa: dto.nomor_wa },
      select: { id: true },
    });

    // Selalu return 200 (tidak bocorkan info akun terdaftar/tidak)
    if (exists) {
      await authService.otp.sendOtp(dto.nomor_wa);
    }

    return reply.send({
      pesan: 'Jika nomor WA terdaftar, kode OTP akan dikirim',
    });
  });

  // ----------------------------------------------------------
  // POST /auth/password/reset
  // ----------------------------------------------------------
  app.post('/password/reset', {
    config: { rateLimit: { max: 5, timeWindow: '10m' } },
    schema: {
      tags: ['auth'],
      summary: 'Reset password menggunakan OTP',
      security: [],
      body: { type: 'object' },
    },
  }, async (request, reply) => {
    const dto = validate(ResetPasswordSchema, request.body);
    const result = await authService.resetPassword(dto);
    return reply.send(result);
  });

  // ----------------------------------------------------------
  // GET /auth/me (profil saya)
  // ----------------------------------------------------------
  app.get('/me', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['auth'],
      summary: 'Dapatkan profil pengguna yang sedang login',
    },
  }, async (request, reply) => {
    const pengguna = await app.prisma.pengguna.findUnique({
      where: { id: request.user.sub },
      select: {
        id: true,
        nama_lengkap: true,
        nomor_wa: true,
        email: true,
        peran: true,
        kecamatan: true,
        kelurahan: true,
        foto_profil_url: true,
        is_verified: true,
        consent_diberikan: true,
        created_at: true,
      },
    });

    if (!pengguna) {
      return reply.status(404).send({ message: 'Pengguna tidak ditemukan' });
    }

    return reply.send(pengguna);
  });
}
