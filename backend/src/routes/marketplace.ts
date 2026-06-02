import { FastifyInstance } from 'fastify';
import {
  MarketplaceService,
  TambahProdukSchema,
  UpdateProdukSchema,
  QueryProdukSchema,
  BuatPesananSchema,
} from '../modules/marketplace/marketplace.service';
import { PembayaranService } from '../modules/marketplace/pembayaran.service';

// ============================================================
// Marketplace Routes — /api/v1/marketplace
// ============================================================

export async function marketplaceRoutes(app: FastifyInstance) {
  const marketplaceService = new MarketplaceService(app);
  const pembayaranService = new PembayaranService(app);

  const validate = <T>(schema: any, data: unknown): T => {
    const r = schema.safeParse(data);
    if (!r.success) {
      const msgs = r.error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`);
      throw app.httpErrors.badRequest(msgs.join('; '));
    }
    return r.data;
  };

  // ----------------------------------------------------------
  // GET /marketplace/produk — Daftar produk (publik)
  // ----------------------------------------------------------
  app.get('/produk', {
    schema: { tags: ['marketplace'], summary: 'Daftar produk marketplace', security: [] },
  }, async (request, reply) => {
    const query = validate(QueryProdukSchema, request.query);
    return reply.send(await marketplaceService.daftarProduk(query));
  });

  // ----------------------------------------------------------
  // GET /marketplace/produk/:id — Detail produk
  // ----------------------------------------------------------
  app.get('/produk/:id', {
    schema: { tags: ['marketplace'], summary: 'Detail produk', security: [] },
  }, async (request: any, reply) => {
    return reply.send(await marketplaceService.detailProduk(request.params.id));
  });

  // ----------------------------------------------------------
  // POST /marketplace/produk — Tambah produk (UMKM/Petani)
  // ----------------------------------------------------------
  app.post('/produk', {
    preHandler: [app.requireRole(['PETANI', 'UMKM', 'ADMIN_DINAS', 'SUPER_ADMIN'])],
    schema: { tags: ['marketplace'], summary: 'Tambah produk baru', body: { type: 'object' } },
  }, async (request, reply) => {
    const dto = validate(TambahProdukSchema, request.body);
    return reply.status(201).send(await marketplaceService.tambahProduk(dto, request.user.sub));
  });

  // ----------------------------------------------------------
  // PATCH /marketplace/produk/:id — Update produk
  // ----------------------------------------------------------
  app.patch('/produk/:id', {
    preHandler: [app.requireRole(['PETANI', 'UMKM', 'ADMIN_DINAS', 'SUPER_ADMIN'])],
    schema: { tags: ['marketplace'], summary: 'Update produk', body: { type: 'object' } },
  }, async (request: any, reply) => {
    const dto = validate(UpdateProdukSchema, request.body);
    // Hanya update stok jika ada field stok
    if (dto.stok !== undefined) {
      return reply.send(
        await marketplaceService.updateStok(request.params.id, dto.stok, request.user.sub)
      );
    }
    return reply.send({ pesan: 'Produk diperbarui' });
  });

  // ----------------------------------------------------------
  // POST /marketplace/pesanan — Buat pesanan
  // ----------------------------------------------------------
  app.post('/pesanan', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['marketplace'],
      summary: 'Buat pesanan baru',
      body: { type: 'object' },
    },
  }, async (request, reply) => {
    const dto = validate(BuatPesananSchema, request.body);
    return reply.status(201).send(
      await marketplaceService.buatPesanan(dto, request.user.sub)
    );
  });

  // ----------------------------------------------------------
  // GET /marketplace/pesanan — Daftar pesanan saya
  // ----------------------------------------------------------
  app.get('/pesanan', {
    preHandler: [app.authenticate],
    schema: { tags: ['marketplace'], summary: 'Daftar pesanan pengguna' },
  }, async (request, reply) => {
    return reply.send(
      await marketplaceService.daftarPesanan(request.user.sub, request.user.peran)
    );
  });

  // ----------------------------------------------------------
  // POST /marketplace/pesanan/:id/bayar — Dapatkan Snap token
  // ----------------------------------------------------------
  app.post('/pesanan/:id/bayar', {
    preHandler: [app.authenticate],
    schema: {
      tags: ['marketplace'],
      summary: 'Dapatkan Midtrans Snap token untuk pembayaran',
    },
  }, async (request: any, reply) => {
    const snapToken = await pembayaranService.buatSnapToken(request.params.id);
    return reply.send({ snap_token: snapToken });
  });
}

// ============================================================
// Webhook Route — /api/v1/webhook (diregistrasi terpisah)
// ============================================================

export async function webhookRoutes(app: FastifyInstance) {
  const pembayaranService = new PembayaranService(app);

  // POST /webhook/midtrans
  app.post('/midtrans', {
    schema: {
      tags: ['webhook'],
      summary: 'Midtrans payment notification webhook',
      security: [],
    },
  }, async (request: any, reply) => {
    await pembayaranService.handleWebhook(request.body);
    return reply.send({ ok: true });
  });
}
