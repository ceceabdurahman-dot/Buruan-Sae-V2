import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { RegisterDto, LoginDto, ResetPasswordDto } from './auth.schema';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';

const BCRYPT_ROUNDS = 12;
const AES_ALGORITHM = 'aes-256-gcm';

// ============================================================
// Auth Service — Register, Login, Token, Password
// ============================================================

export class AuthService {
  private readonly otpService: OtpService;
  private readonly tokenService: TokenService;
  private readonly encKey: Buffer;

  constructor(private readonly app: FastifyInstance) {
    this.otpService = new OtpService(app);
    this.tokenService = new TokenService(app);

    // Derive AES-256 key dari ENCRYPTION_KEY env
    // Gagal startup jika ENCRYPTION_KEY tidak disetel — NIK sensitif UU PDP
    const secret = process.env.ENCRYPTION_KEY;
    if (!secret || secret.length < 32) {
      throw new Error(
        '[Security] ENCRYPTION_KEY wajib disetel dan minimal 32 karakter. ' +
        'Generate dengan: openssl rand -hex 32'
      );
    }
    const encSalt = process.env.ENCRYPTION_SALT;
    if (!encSalt) {
      throw new Error('[Security] ENCRYPTION_SALT wajib disetel.');
    }
    const salt = Buffer.from(encSalt, 'utf8');
    this.encKey = scryptSync(secret, salt, 32) as Buffer;
  }

  // ----------------------------------------------------------
  // Enkripsi NIK (AES-256-GCM)
  // ----------------------------------------------------------
  private encryptNik(nik: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv(AES_ALGORITHM, this.encKey, iv);
    const encrypted = Buffer.concat([cipher.update(nik, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${encrypted.toString('hex')}:${tag.toString('hex')}`;
  }

  private decryptNik(encrypted: string): string {
    const [ivHex, dataHex, tagHex] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const data = Buffer.from(dataHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = createDecipheriv(AES_ALGORITHM, this.encKey, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  }

  private hashNik(nik: string): string {
    const { createHash } = require('crypto');
    return createHash('sha256')
      .update(nik + (process.env.ENCRYPTION_SALT ?? 'bs-salt-v1'))
      .digest('hex');
  }

  // ----------------------------------------------------------
  // Register
  // ----------------------------------------------------------
  async register(dto: RegisterDto, meta: { ip?: string; userAgent?: string }) {
    const prisma = this.app.prisma;

    // Cek duplikasi nomor WA
    const existingWa = await prisma.pengguna.findUnique({
      where: { nomor_wa: dto.nomor_wa },
      select: { id: true },
    });
    if (existingWa) {
      throw { statusCode: 409, message: 'Nomor WA sudah terdaftar' };
    }

    // Cek duplikasi NIK (via hash)
    const nikHash = this.hashNik(dto.nik);
    const existingNik = await prisma.pengguna.findUnique({
      where: { nik_hash: nikHash },
      select: { id: true },
    });
    if (existingNik) {
      throw { statusCode: 409, message: 'NIK sudah terdaftar' };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // Enkripsi NIK
    const nikEncrypted = this.encryptNik(dto.nik);

    // Buat pengguna baru + consent dalam satu transaksi
    const pengguna = await prisma.$transaction(async (tx) => {
      const newUser = await tx.pengguna.create({
        data: {
          nik_encrypted: nikEncrypted,
          nik_hash: nikHash,
          nama_lengkap: dto.nama_lengkap,
          nomor_wa: dto.nomor_wa,
          email: dto.email,
          password_hash: passwordHash,
          peran: dto.peran as any,
          kecamatan: dto.kecamatan,
          kelurahan: dto.kelurahan,
          consent_diberikan: true,
          consent_tgl: new Date(),
        },
        select: {
          id: true,
          nama_lengkap: true,
          nomor_wa: true,
          email: true,
          peran: true,
        },
      });

      // Simpan consent
      await tx.consentPengguna.create({
        data: {
          pengguna_id: newUser.id,
          versi: '1.0',
          diberikan: true,
          tgl_consent: new Date(),
          ip_address: meta.ip,
        },
      });

      return newUser;
    });

    // Kirim OTP verifikasi
    await this.otpService.sendOtp(dto.nomor_wa);

    // Audit log
    await this.app.prisma.auditLog.create({
      data: {
        pengguna_id: pengguna.id,
        aksi: 'REGISTER',
        entitas: 'Pengguna',
        entitas_id: pengguna.id,
        ip_address: meta.ip,
        user_agent: meta.userAgent,
      },
    });

    return {
      pesan: 'Registrasi berhasil! Kode OTP telah dikirim ke WhatsApp Anda',
      nomor_wa: dto.nomor_wa.slice(0, 4) + '****',
    };
  }

  // ----------------------------------------------------------
  // Verifikasi OTP (pasca register / login WA)
  // ----------------------------------------------------------
  async verifyOtp(nomorWa: string, kodeOtp: string, meta: { ip?: string; userAgent?: string }) {
    const valid = await this.otpService.verifyOtp(nomorWa, kodeOtp);
    if (!valid) {
      throw { statusCode: 400, message: 'Kode OTP tidak valid atau sudah kadaluarsa' };
    }

    const pengguna = await this.app.prisma.pengguna.findUnique({
      where: { nomor_wa: nomorWa },
      select: { id: true, email: true, peran: true, is_verified: true },
    });
    if (!pengguna) {
      throw { statusCode: 404, message: 'Pengguna tidak ditemukan' };
    }

    // Tandai verified
    if (!pengguna.is_verified) {
      await this.app.prisma.pengguna.update({
        where: { id: pengguna.id },
        data: { is_verified: true },
      });
    }

    // Buat token
    const payload = { sub: pengguna.id, email: pengguna.email ?? '', peran: pengguna.peran };
    const accessToken = this.tokenService.signAccessToken(payload);
    const refreshToken = await this.tokenService.createRefreshToken(pengguna.id, meta);

    return { access_token: accessToken, refresh_token: refreshToken, peran: pengguna.peran };
  }

  // ----------------------------------------------------------
  // Login dengan password
  // ----------------------------------------------------------
  async login(dto: LoginDto, meta: { ip?: string; userAgent?: string }) {
    // Cari pengguna by email atau nomor WA
    const pengguna = await this.app.prisma.pengguna.findFirst({
      where: {
        OR: [
          { email: dto.identifier },
          { nomor_wa: dto.identifier },
        ],
        is_aktif: true,
      },
      select: {
        id: true,
        email: true,
        peran: true,
        password_hash: true,
        is_terverifikasi: true,
        nomor_wa: true,
      },
    });

    if (!pengguna || !pengguna.password_hash) {
      throw { statusCode: 401, message: 'Email/WA atau password tidak valid' };
    }

    // Cek password
    const passwordOk = await bcrypt.compare(dto.password, pengguna.password_hash);
    if (!passwordOk) {
      throw { statusCode: 401, message: 'Email/WA atau password tidak valid' };
    }

    // Cek verifikasi
    if (!pengguna.is_terverifikasi) {
      // Kirim ulang OTP
      if (pengguna.nomor_wa) {
        await this.otpService.sendOtp(pengguna.nomor_wa);
      }
      throw {
        statusCode: 403,
        message: 'Akun belum diverifikasi. OTP telah dikirim ulang ke WhatsApp Anda',
        kode: 'UNVERIFIED',
      };
    }

    // Buat token
    const payload = { sub: pengguna.id, email: pengguna.email ?? '', peran: pengguna.peran };
    const accessToken = this.tokenService.signAccessToken(payload);
    const refreshToken = await this.tokenService.createRefreshToken(pengguna.id, meta);

    // Audit log
    await this.app.prisma.auditLog.create({
      data: {
        pengguna_id: pengguna.id,
        aksi: 'LOGIN',
        resource: 'Pengguna',
        resource_id: pengguna.id,
        detail: {
          user_agent: meta.userAgent,
        },
        ip_address: meta.ip,
      },
    });

    return { access_token: accessToken, refresh_token: refreshToken, peran: pengguna.peran };
  }

  // ----------------------------------------------------------
  // Refresh Token
  // ----------------------------------------------------------
  async refreshToken(token: string, meta: { ip?: string; userAgent?: string }) {
    const record = await this.tokenService.validateRefreshToken(token);
    if (!record) {
      throw { statusCode: 401, message: 'Refresh token tidak valid atau sudah kadaluarsa' };
    }

    // Revoke token lama (rotation)
    await this.tokenService.revokeRefreshToken(token);

    // Buat token baru
    const payload = {
      sub: record.pengguna.id,
      email: record.pengguna.email ?? '',
      peran: record.pengguna.peran,
    };
    const accessToken = this.tokenService.signAccessToken(payload);
    const newRefreshToken = await this.tokenService.createRefreshToken(record.pengguna.id, meta);

    return { access_token: accessToken, refresh_token: newRefreshToken };
  }

  // ----------------------------------------------------------
  // Logout
  // ----------------------------------------------------------
  async logout(penggunaId: string, refreshToken: string, meta: { ip?: string }) {
    await this.tokenService.revokeRefreshToken(refreshToken);

    await this.app.prisma.auditLog.create({
      data: {
        pengguna_id: penggunaId,
        aksi: 'LOGOUT',
        entitas: 'Pengguna',
        entitas_id: penggunaId,
        ip_address: meta.ip,
      },
    });
  }

  // ----------------------------------------------------------
  // Reset Password (via OTP)
  // ----------------------------------------------------------
  async resetPassword(dto: ResetPasswordDto) {
    const valid = await this.otpService.verifyOtp(dto.nomor_wa, dto.kode_otp);
    if (!valid) {
      throw { statusCode: 400, message: 'Kode OTP tidak valid atau sudah kadaluarsa' };
    }

    const pengguna = await this.app.prisma.pengguna.findUnique({
      where: { nomor_wa: dto.nomor_wa },
      select: { id: true },
    });
    if (!pengguna) {
      throw { statusCode: 404, message: 'Pengguna tidak ditemukan' };
    }

    const passwordHash = await bcrypt.hash(dto.password_baru, BCRYPT_ROUNDS);

    await this.app.prisma.$transaction([
      this.app.prisma.pengguna.update({
        where: { id: pengguna.id },
        data: { password_hash: passwordHash },
      }),
      // Revoke semua refresh token
      this.app.prisma.refreshToken.updateMany({
        where: { pengguna_id: pengguna.id, revoked_at: null },
        data: { revoked_at: new Date() },
      }),
    ]);

    return { pesan: 'Password berhasil direset. Silakan login dengan password baru.' };
  }

  // Expose untuk dependency injection
  get otp() { return this.otpService; }
  get token() { return this.tokenService; }
}
