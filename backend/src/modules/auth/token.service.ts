import { FastifyInstance } from 'fastify';
import { createHash, randomBytes } from 'crypto';
import { JwtPayload } from '../../plugins/jwt';

const REFRESH_TTL_DAYS = 30;
const REFRESH_BLACKLIST_PREFIX = 'rt_blacklist:';

// ============================================================
// Token Service — Access Token + Refresh Token
// ============================================================

export class TokenService {
  constructor(private readonly app: FastifyInstance) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

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
        token_hash: this.hashToken(token),
        pengguna_id: penggunaId,
        expires_at: expiresAt,
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
      where: { token_hash: this.hashToken(token) },
      include: {
        pengguna: {
          select: {
            id: true,
            email: true,
            peran: true,
            is_aktif: true,
          },
        },
      },
    });

    if (!record) return null;
    if (record.is_revoked) return null;
    if (record.expires_at < new Date()) return null;
    if (!record.pengguna.is_aktif) return null;

    return record;
  }

  /**
   * Revoke refresh token (logout)
   */
  async revokeRefreshToken(token: string): Promise<void> {
    // Tandai di DB
    await this.app.prisma.refreshToken.updateMany({
      where: { token_hash: this.hashToken(token), is_revoked: false },
      data: { is_revoked: true },
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
      where: { pengguna_id: penggunaId, is_revoked: false },
      select: { token_hash: true },
    });

    await this.app.prisma.refreshToken.updateMany({
      where: { pengguna_id: penggunaId, is_revoked: false },
      data: { is_revoked: true },
    });

    // Blacklist semua token di Redis
    if (tokens.length > 0) {
      const pipeline = this.app.redis.pipeline();
      for (const { token_hash } of tokens) {
        pipeline.set(
          `${REFRESH_BLACKLIST_PREFIX}${token_hash}`,
          '1',
          'EX',
          REFRESH_TTL_DAYS * 24 * 60 * 60
        );
      }
      await pipeline.exec();
    }
  }
}
