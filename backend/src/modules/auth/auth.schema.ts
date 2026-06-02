import { z } from 'zod';

// ============================================================
// Schema validasi Auth (Zod)
// ============================================================

export const RegisterSchema = z.object({
  nik: z
    .string()
    .length(16, 'NIK harus 16 digit')
    .regex(/^\d+$/, 'NIK harus angka'),
  nama_lengkap: z
    .string()
    .min(3, 'Nama minimal 3 karakter')
    .max(100, 'Nama maksimal 100 karakter')
    .trim(),
  nomor_wa: z
    .string()
    .regex(/^08\d{8,11}$/, 'Format nomor WA tidak valid (contoh: 08123456789)')
    .max(15),
  email: z.string().email('Format email tidak valid').optional(),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .regex(/[A-Z]/, 'Password harus ada huruf kapital')
    .regex(/[0-9]/, 'Password harus ada angka'),
  peran: z
    .enum(['PETANI', 'KADER_KELURAHAN', 'KONSUMEN', 'UMKM', 'PENGELOLA_WISATA'])
    .default('PETANI'),
  kecamatan: z.string().max(50).optional(),
  kelurahan: z.string().max(50).optional(),
  consent_diberikan: z.literal(true, {
    errorMap: () => ({ message: 'Persetujuan data pribadi wajib diberikan' }),
  }),
});

export const LoginSchema = z.object({
  identifier: z.string().min(1, 'Email atau nomor WA wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export const SendOtpSchema = z.object({
  nomor_wa: z
    .string()
    .regex(/^08\d{8,11}$/, 'Format nomor WA tidak valid'),
});

export const VerifyOtpSchema = z.object({
  nomor_wa: z.string().regex(/^08\d{8,11}$/),
  kode_otp: z.string().length(6, 'Kode OTP harus 6 digit').regex(/^\d+$/),
});

export const RefreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token wajib diisi'),
});

export const ChangePasswordSchema = z.object({
  password_lama: z.string().min(1),
  password_baru: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/),
}).refine((data) => data.password_lama !== data.password_baru, {
  message: 'Password baru tidak boleh sama dengan password lama',
  path: ['password_baru'],
});

export const ForgotPasswordSchema = z.object({
  nomor_wa: z.string().regex(/^08\d{8,11}$/),
});

export const ResetPasswordSchema = z.object({
  nomor_wa: z.string().regex(/^08\d{8,11}$/),
  kode_otp: z.string().length(6).regex(/^\d+$/),
  password_baru: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
});

// Tipe dari schema
export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type SendOtpDto = z.infer<typeof SendOtpSchema>;
export type VerifyOtpDto = z.infer<typeof VerifyOtpSchema>;
export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;
export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;
