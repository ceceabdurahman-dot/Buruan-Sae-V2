import { FastifyInstance } from 'fastify';
import { PembayaranService } from '../modules/marketplace/pembayaran.service';

// ============================================================
// Webhook Routes — Midtrans Payment Notification
// ============================================================

export async function webhookRoutes(app: FastifyInstance) {
  const pembayaranService = new PembayaranService(app);

  /**
   * POST /webhook/midtrans
   * Menerima notifikasi pembayaran dari Midtrans
   * Endpoint ini TIDAK memerlukan autentikasi JWT
   * Keamanan melalui verifikasi SHA-512 signature di dalam service
   */
  app.post('/midtrans', {
    config: {
      // Nonaktifkan rate limit untuk webhook Midtrans
      rateLimit: { max: 1000, timeWindow: 60_000 },
    },
    schema: {
      body: {
        type: 'object',
        required: ['order_id', 'status_code', 'gross_amount', 'signature_key'],
        properties: {
          order_id: { type: 'string' },
          status_code: { type: 'string' },
          gross_amount: { type: 'string' },
          payment_type: { type: 'string' },
          transaction_status: { type: 'string' },
          fraud_status: { type: 'string' },
          signature_key: { type: 'string' },
          transaction_id: { type: 'string' },
          transaction_time: { type: 'string' },
          settlement_time: { type: 'string' },
          currency: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const payload = request.body as Record<string, string>;

    try {
      await pembayaranService.handleWebhook(payload);
      return reply.status(200).send({ ok: true });
    } catch (err: any) {
      // Kembalikan 200 agar Midtrans tidak retry terus
      // Tapi log error untuk investigasi
      app.log.error({ err, payload }, 'Webhook Midtrans gagal diproses');
      return reply.status(200).send({ ok: false, message: err.message });
    }
  });

  app.log.info('✅ Webhook routes (Midtrans) aktif');
}
