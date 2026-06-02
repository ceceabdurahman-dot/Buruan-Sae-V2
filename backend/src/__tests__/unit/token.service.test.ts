import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TokenService } from '../../modules/auth/token.service';

// ============================================================
// Unit Test: Token Service
// ============================================================

describe('TokenService', () => {
  let mockApp: any;
  let mockPrisma: any;
  let mockRedis: any;
  let tokenService: TokenService;

  const MOCK_USER_ID = 'user-uuid-1234';
  const MOCK_PERAN = 'PETANI';

  beforeEach(() => {
    mockRedis = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue('OK'),
      del: vi.fn().mockResolvedValue(1),
      pipeline: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([]),
      }),
    };

    mockPrisma = {
      refreshToken: {
        create: vi.fn().mockResolvedValue({ token: 'mock-token-hex' }),
        findUnique: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };

    mockApp = {
      redis: mockRedis,
      prisma: mockPrisma,
      log: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
      jwt: {
        sign: vi.fn().mockReturnValue('mock.jwt.access.token'),
        verify: vi.fn(),
      },
    };

    tokenService = new TokenService(mockApp);
  });

  // --------------------------------------------------------
  // signAccessToken
  // --------------------------------------------------------

  describe('signAccessToken()', () => {
    it('harus menghasilkan JWT dengan payload yang benar', () => {
      const token = tokenService.signAccessToken(MOCK_USER_ID, MOCK_PERAN);

      expect(mockApp.jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: MOCK_USER_ID,
          peran: MOCK_PERAN,
        }),
        expect.objectContaining({ expiresIn: expect.any(String) }),
      );
      expect(token).toBe('mock.jwt.access.token');
    });
  });

  // --------------------------------------------------------
  // createRefreshToken
  // --------------------------------------------------------

  describe('createRefreshToken()', () => {
    it('harus membuat refresh token dan simpan ke DB', async () => {
      const token = await tokenService.createRefreshToken(MOCK_USER_ID);

      expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            pengguna_id: MOCK_USER_ID,
          }),
        }),
      );
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(32);
    });
  });

  // --------------------------------------------------------
  // validateRefreshToken
  // --------------------------------------------------------

  describe('validateRefreshToken()', () => {
    it('harus return null jika token tidak ada di DB', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);

      const result = await tokenService.validateRefreshToken('invalid-token');
      expect(result).toBeNull();
    });

    it('harus return null jika token sudah expired', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-id',
        token: 'some-token',
        pengguna_id: MOCK_USER_ID,
        expires_at: new Date(Date.now() - 1000), // sudah lewat
        revoked_at: null,
        pengguna: { id: MOCK_USER_ID, peran: MOCK_PERAN, is_active: true },
      });

      const result = await tokenService.validateRefreshToken('some-token');
      expect(result).toBeNull();
    });

    it('harus return null jika token sudah dicabut (revoked)', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-id',
        token: 'some-token',
        pengguna_id: MOCK_USER_ID,
        expires_at: new Date(Date.now() + 86400000),
        revoked_at: new Date(), // sudah dicabut
        pengguna: { id: MOCK_USER_ID, peran: MOCK_PERAN, is_active: true },
      });

      const result = await tokenService.validateRefreshToken('some-token');
      expect(result).toBeNull();
    });

    it('harus return null jika token ada di Redis blacklist', async () => {
      mockRedis.get.mockResolvedValue('1'); // blacklisted

      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-id',
        token: 'blacklisted-token',
        pengguna_id: MOCK_USER_ID,
        expires_at: new Date(Date.now() + 86400000),
        revoked_at: null,
        pengguna: { id: MOCK_USER_ID, peran: MOCK_PERAN, is_active: true },
      });

      const result = await tokenService.validateRefreshToken('blacklisted-token');
      expect(result).toBeNull();
    });

    it('harus return data pengguna jika token valid', async () => {
      mockRedis.get.mockResolvedValue(null); // tidak di blacklist

      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-id',
        token: 'valid-token',
        pengguna_id: MOCK_USER_ID,
        expires_at: new Date(Date.now() + 86400000),
        revoked_at: null,
        pengguna: {
          id: MOCK_USER_ID,
          peran: MOCK_PERAN,
          is_active: true,
          is_verified: true,
        },
      });

      const result = await tokenService.validateRefreshToken('valid-token');
      expect(result).not.toBeNull();
      expect(result?.pengguna_id).toBe(MOCK_USER_ID);
    });
  });

  // --------------------------------------------------------
  // revokeRefreshToken
  // --------------------------------------------------------

  describe('revokeRefreshToken()', () => {
    it('harus update DB dan tambah ke Redis blacklist', async () => {
      mockPrisma.refreshToken.update.mockResolvedValue({
        id: 'rt-id',
        token: 'some-token',
        expires_at: new Date(Date.now() + 86400000),
      });

      await tokenService.revokeRefreshToken('some-token');

      expect(mockPrisma.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { token: 'some-token' },
          data: expect.objectContaining({ revoked_at: expect.any(Date) }),
        }),
      );
      expect(mockRedis.set).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------
  // revokeAllUserTokens
  // --------------------------------------------------------

  describe('revokeAllUserTokens()', () => {
    it('harus revoke semua token milik pengguna via updateMany', async () => {
      await tokenService.revokeAllUserTokens(MOCK_USER_ID);

      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ pengguna_id: MOCK_USER_ID }),
          data: expect.objectContaining({ revoked_at: expect.any(Date) }),
        }),
      );
    });
  });
});
