import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterSchema, LoginSchema, VerifyOtpSchema } from '../../modules/auth/auth.schema';
import { OtpService } from '../../modules/auth/otp.service';
import { TokenService } from '../../modules/auth/token.service';

// ============================================================
// Unit Test: Auth Schema Validation
// ============================================================

describe('Auth Schema Validation', () => {
  describe('RegisterSchema', () => {
    it('harus valid dengan data lengkap', () => {
      const data = {
        nik: '3273010101900001',
        nama_lengkap: 'Budi Santoso',
        nomor_wa: '08123456789',
        password: 'Password123',
        peran: 'PETANI',
        consent_diberikan: true,
      };
      const result = RegisterSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('harus gagal jika NIK bukan 16 digit', () => {
      const data = {
        nik: '12345',
        nama_lengkap: 'Budi',
        nomor_wa: '08123456789',
        password: 'Password123',
        consent_diberikan: true,
      };
      const result = RegisterSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('16 digit');
    });

    it('harus gagal jika password tidak ada huruf kapital', () => {
      const data = {
        nik: '3273010101900001',
        nama_lengkap: 'Budi Santoso',
        nomor_wa: '08123456789',
        password: 'password123',
        consent_diberikan: true,
      };
      const result = RegisterSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('harus gagal jika consent tidak diberikan', () => {
      const data = {
        nik: '3273010101900001',
        nama_lengkap: 'Budi Santoso',
        nomor_wa: '08123456789',
        password: 'Password123',
        consent_diberikan: false,
      };
      const result = RegisterSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('harus gagal jika nomor WA tidak valid', () => {
      const invalidNumbers = ['1234567890', '+6281234', '62812345678'];
      for (const nomor of invalidNumbers) {
        const data = {
          nik: '3273010101900001',
          nama_lengkap: 'Budi',
          nomor_wa: nomor,
          password: 'Password123',
          consent_diberikan: true,
        };
        const result = RegisterSchema.safeParse(data);
        expect(result.success, `Nomor ${nomor} seharusnya gagal`).toBe(false);
      }
    });
  });

  describe('LoginSchema', () => {
    it('harus valid dengan email', () => {
      const result = LoginSchema.safeParse({ identifier: 'test@gmail.com', password: 'pass' });
      expect(result.success).toBe(true);
    });

    it('harus valid dengan nomor WA', () => {
      const result = LoginSchema.safeParse({ identifier: '08123456789', password: 'pass' });
      expect(result.success).toBe(true);
    });

    it('harus gagal jika identifier kosong', () => {
      const result = LoginSchema.safeParse({ identifier: '', password: 'pass' });
      expect(result.success).toBe(false);
    });
  });

  describe('VerifyOtpSchema', () => {
    it('harus valid dengan kode OTP 6 digit', () => {
      const result = VerifyOtpSchema.safeParse({ nomor_wa: '08123456789', kode_otp: '123456' });
      expect(result.success).toBe(true);
    });

    it('harus gagal jika OTP bukan 6 digit', () => {
      const result = VerifyOtpSchema.safeParse({ nomor_wa: '08123456789', kode_otp: '1234' });
      expect(result.success).toBe(false);
    });

    it('harus gagal jika OTP bukan angka', () => {
      const result = VerifyOtpSchema.safeParse({ nomor_wa: '08123456789', kode_otp: 'abcdef' });
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================
// Unit Test: OTP Service (dengan Redis mock)
// ============================================================

describe('OtpService', () => {
  let mockApp: any;
  let mockRedis: any;
  let otpService: OtpService;

  beforeEach(() => {
    mockRedis = {
      get: vi.fn(),
      hset: vi.fn(),
      expire: vi.fn(),
      set: vi.fn(),
      hgetall: vi.fn(),
      del: vi.fn(),
      incr: vi.fn(),
    };

    mockApp = {
      redis: mockRedis,
      log: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
    };

    otpService = new OtpService(mockApp);
  });

  it('harus gagal kirim jika dalam cooldown', async () => {
    mockRedis.get.mockResolvedValue('1'); // cooldown aktif
    mockRedis.ttl = vi.fn().mockResolvedValue(45);

    const result = await otpService.sendOtp('08123456789');
    expect(result.berhasil).toBe(false);
    expect(result.pesanError).toContain('Tunggu');
  });

  it('harus verifikasi OTP yang benar', async () => {
    mockRedis.get.mockResolvedValue(null); // tidak ada attempt limit
    mockRedis.hgetall.mockResolvedValue({ kode: '123456', created_at: Date.now().toString() });
    mockRedis.del.mockResolvedValue(1);

    const valid = await otpService.verifyOtp('08123456789', '123456');
    expect(valid).toBe(true);
  });

  it('harus tolak OTP yang salah', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockRedis.hgetall.mockResolvedValue({ kode: '123456', created_at: Date.now().toString() });
    mockRedis.incr.mockResolvedValue(1);

    const valid = await otpService.verifyOtp('08123456789', '999999');
    expect(valid).toBe(false);
  });

  it('harus tolak jika percobaan melebihi batas', async () => {
    mockRedis.get.mockResolvedValue('5'); // sudah 5 kali salah
    mockRedis.hgetall.mockResolvedValue({ kode: '123456' });
    mockRedis.del.mockResolvedValue(1);

    const valid = await otpService.verifyOtp('08123456789', '123456');
    expect(valid).toBe(false);
  });
});
