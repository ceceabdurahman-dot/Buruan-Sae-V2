import { FastifyInstance } from 'fastify';
import { randomBytes } from 'crypto';
import { JwtPayload } from '../../plugins/jwt';

const REFRESH_TTL_DAYS = 30;
const REFRESH_BLACKLIST_PREFIX = 'rt_blacklist:';

// ============================================================
// Token Service — Access Token + Refresh Token
// ============================================================

export class TokenService {
  constructor(private readonly app: FastifyInstance) {}

  /**
   * Buat access token JWT (24h)
   */
  signAccessToken(payload: JwtPayload): string {
    return this.app.jwt.sign(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN ?? '24h',
    });
  }

  /**
   * Buat refresh token opaque (random 64 bytes hex) — simpan di DB + Redis blacklist
   */
  async createRefreshToken(penggunaId: string, meta: { ip?: string; userAgent?: string }): Promise<string> {
    const token = randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TTL_DAYS);

    await this.app.prisma.refreshToken.create({
      data: {
        token,
        pengguna_id: penggunaId,
        expires_at: expiresAt,
        ip_address: meta.ip,
        user_agent: meta.userAgent,
      },
    });

    return token;
  }

  /**
   * Validasi refresh token — cek DB, expiry, blacklist
   */
  async validateRefreshToken(token: string) {
    // Cek blacklist Redis (lebih cepat)
    const blacklisted = await this.app.redis.get(
      `${REFRESH_BLACKLIST_PREFIX}${token}`
    );
    if (blacklisted) return null;

    const record = await this.app.prisma.refreshToken.findUnique({
      where: { token },
      include: {
        pengguna: {
          select: {
            id: true,
            email: true,
            peran: true,
            is_active: true,
            deleted_at: true,
          },
        },
      },
    });

    if (!record) return null;
    if (record.revoked_at) return null;
    if (record.expires_at < new Date()) return null;
    if (!record.pengguna.is_active || record.pengguna.deleted_at) return null;

    return record;
  }

  /**
   * Revoke refresh token (logout)
   */
  async revokeRefreshToken(token: string): Promise<void> {
    // Tandai di DB
    await this.app.prisma.refreshToken.updateMany({
      where: { token, revoked_at: null },
      data: { revoked_at: new Date() },
    });

    // Tambahkan ke blacklist Redis selama 30 hari
    await this.app.redis.set(
      `${REFRESH_BLACKLIST_PREFIX}${token}`,
      '1',
      'EX',
      REFRESH_TTL_DAYS * 24 * 60 * 60
    );
  }

  /**
   * Revoke semua refresh token pengguna (logout dari semua device)
   */
  async revokeAllUserTokens(penggunaId: string): Promise<void> {
    const tokens = await this.app.prisma.refreshToken.findMany({
      where: { pengguna_id: penggunaId, revoked_at: null },
      select: { token: true },
    });

    await this.app.prisma.refreshToken.updateMany({
      where: { pengguna_id: penggunaId, revoked_at: null },
      data: { revoked_at: new Date() },
    });

    // Blacklist semua token di Redis
    if (tokens.length > 0) {
      const pipeline = this.app.redis.pipeline();
      for (const { token } of tokens) {
        pipeline.set(
          `${REFRESH_BLACKLIST_PREFIX}${token}`,
          '1',
          'EX',
          REFRESH_TTL_DAYS * 24 * 60 * 60
        );
      }
      await pipeline.exec();
    }
  }
}
