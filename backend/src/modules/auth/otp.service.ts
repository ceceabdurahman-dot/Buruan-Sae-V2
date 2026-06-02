import { FastifyInstance } from 'fastify';
import axios from 'axios';

const OTP_TTL = 300; // 5 menit
const OTP_ATTEMPT_LIMIT = 5;
const OTP_COOLDOWN = 60; // 1 menit antar kirim

// ============================================================
// OTP Service — via Fonnte WhatsApp API
// ============================================================

export class OtpService {
  private readonly redisPrefix = 'otp:';
  private readonly attemptPrefix = 'otp_attempt:';
  private readonly cooldownPrefix = 'otp_cd:';

  constructor(private readonly app: FastifyInstance) {}

  private generateOtp(): string {
    // 6 digit angka
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private redisKey(nomorWa: string): string {
    return `${this.redisPrefix}${nomorWa}`;
  }

  async sendOtp(nomorWa: string): Promise<{ berhasil: boolean; pesanError?: string }> {
    const redis = this.app.redis;

    // Cek cooldown
    const cooldownKey = `${this.cooldownPrefix}${nomorWa}`;
    const onCooldown = await redis.get(cooldownKey);
    if (onCooldown) {
      const ttl = await redis.ttl(cooldownKey);
      return {
        berhasil: false,
        pesanError: `Tunggu ${ttl} detik sebelum kirim OTP lagi`,
      };
    }

    // Generate OTP
    const kode = this.generateOtp();
    const key = this.redisKey(nomorWa);

    // Simpan di Redis (hash: kode + timestamp)
    await redis.hset(key, 'kode', kode, 'created_at', Date.now().toString());
    await redis.expire(key, OTP_TTL);

    // Set cooldown
    await redis.set(cooldownKey, '1', 'EX', OTP_COOLDOWN);

    // Kirim via Fonnte
    try {
      const nomorFormat = nomorWa.replace(/^0/, '62'); // 0812 → 62812
      await axios.post(
        'https://fontteapi.com/send',
        {
          target: nomorFormat,
          message: `*Kode OTP Buruan Sae*\n\nKode Anda: *${kode}*\n\nBerlaku 5 menit. Jangan berikan kode ini kepada siapapun.\n\n_Tim Buruan Sae Kota Bandung_`,
        },
        {
          headers: {
            token: process.env.FONNTE_API_KEY ?? '',
          },
        }
      );

      this.app.log.info({ nomorWa: nomorWa.slice(0, 4) + '****' }, 'OTP terkirim');
      return { berhasil: true };
    } catch (err) {
      this.app.log.error({ err }, 'Gagal kirim OTP via Fonnte');
      // Hapus key agar bisa retry
      await redis.del(key);
      return { berhasil: false, pesanError: 'Gagal mengirim OTP, coba lagi' };
    }
  }

  async verifyOtp(nomorWa: string, kodeInput: string): Promise<boolean> {
    const redis = this.app.redis;
    const key = this.redisKey(nomorWa);
    const attemptKey = `${this.attemptPrefix}${nomorWa}`;

    // Cek batas percobaan
    const attempts = parseInt((await redis.get(attemptKey)) ?? '0');
    if (attempts >= OTP_ATTEMPT_LIMIT) {
      await redis.del(key);
      return false;
    }

    const data = await redis.hgetall(key);
    if (!data || !data.kode) return false;

    if (data.kode !== kodeInput) {
      // Tambah counter gagal
      await redis.incr(attemptKey);
      await redis.expire(attemptKey, OTP_TTL);
      return false;
    }

    // OTP valid — hapus dari Redis
    await redis.del(key);
    await redis.del(attemptKey);
    return true;
  }

  async invalidateOtp(nomorWa: string): Promise<void> {
    await this.app.redis.del(this.redisKey(nomorWa));
  }
}
