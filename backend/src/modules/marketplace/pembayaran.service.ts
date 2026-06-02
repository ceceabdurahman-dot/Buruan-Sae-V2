import { FastifyInstance } from 'fastify';
import midtransClient from 'midtrans-client';
import crypto from 'crypto';

// ============================================================
// Pembayaran Service — Midtrans Snap + Core API
// ============================================================

export class PembayaranService {
  private readonly snap: midtransClient.Snap;
  private readonly coreApi: midtransClient.CoreApi;
  private readonly serverKey: string;

  constructor(private readonly app: FastifyInstance) {
    const isProduction = process.env.NODE_ENV === 'production';
    this.serverKey = process.env.MIDTRANS_SERVER_KEY ?? '';

    this.snap = new midtransClient.Snap({
      isProduction,
      serverKey: this.serverKey,
      clientKey: process.env.MIDTRANS_CLIENT_KEY ?? '',
    });

    this.coreApi = new midtransClient.CoreApi({
      isProduction,
      serverKey: this.serverKey,
      clientKey: process.env.MIDTRANS_CLIENT_KEY ?? '',
    });
  }

  /**
   * Buat Snap token untuk pesanan produk
   */
  async buatSnapToken(pesananId: string): Promise<string> {
    const prisma = this.app.prisma;

    const pesanan = await prisma.pesanan.findUnique({
      where: { id: pesananId },
      include: {
        pembeli: { select: { id: true, nama_lengkap: true, email: true, nomor_wa: true } },
        detail_pesanan: {
          include: { produk: { select: { nama: true, harga: true } } },
        },
        transaksi: { select: { id: true, snap_token: true, status: true } },
      },
    });

    if (!pesanan) throw { statusCode: 404, message: 'Pesanan tidak ditemukan' };
    if (pesanan.status !== 'MENUNGGU_PEMBAYARAN') {
      throw { statusCode: 400, message: 'Pesanan tidak dalam status menunggu pembayaran' };
    }

    // Cek apakah snap token sudah ada dan masih valid
    if (pesanan.transaksi?.snap_token) {
      return pesanan.transaksi.snap_token;
    }

    // Buat Snap transaction
    const parameter = {
      transaction_details: {
        order_id: pesananId,
        gross_amount: Number(pesanan.total_harga),
      },
      customer_details: {
        first_name: pesanan.pembeli.nama_lengkap,
        email: pesanan.pembeli.email ?? `${pesanan.pembeli.nomor_wa}@buruansae.local`,
        phone: pesanan.pembeli.nomor_wa,
      },
      item_details: pesanan.detail_pesanan.map((d) => ({
        id: d.produk_id,
        price: Number(d.harga_satuan),
        quantity: d.jumlah,
        name: d.produk.nama.substring(0, 50),
      })),
      callbacks: {
        finish: `${process.env.WEB_APP_URL ?? 'https://admin.buruansae.bandung.go.id'}/pembayaran/selesai`,
      },
    };

    const snapResponse = await this.snap.createTransaction(parameter);
    const snapToken: string = snapResponse.token;

    // Simpan snap token ke DB
    await prisma.transaksiPembayaran.upsert({
      where: { pesanan_id: pesananId },
      create: {
        pesanan_id: pesananId,
        snap_token: snapToken,
        jumlah: pesanan.total_harga,
        status: 'PENDING',
        metode: 'MIDTRANS_SNAP',
      },
      update: {
        snap_token: snapToken,
        updated_at: new Date(),
      },
    });

    return snapToken;
  }

  /**
   * Buat Snap token untuk booking agrowisata
   */
  async buatSnapTokenBooking(bookingId: string): Promise<string> {
    const prisma = this.app.prisma;

    const booking = await prisma.bookingWisata.findUnique({
      where: { id: bookingId },
      include: {
        pemesan: { select: { nama_lengkap: true, email: true, nomor_wa: true } },
        paket: { select: { nama: true, harga: true } },
        transaksi: { select: { snap_token: true } },
      },
    });

    if (!booking) throw { statusCode: 404, message: 'Booking tidak ditemukan' };
    if (booking.transaksi?.snap_token) return booking.transaksi.snap_token;

    const totalHarga = Number(booking.paket.harga) * booking.jumlah_peserta;

    const parameter = {
      transaction_details: {
        order_id: `WISATA-${bookingId}`,
        gross_amount: totalHarga,
      },
      customer_details: {
        first_name: booking.pemesan.nama_lengkap,
        email: booking.pemesan.email ?? `${booking.pemesan.nomor_wa}@buruansae.local`,
        phone: booking.pemesan.nomor_wa,
      },
      item_details: [{
        id: booking.paket_id,
        price: Number(booking.paket.harga),
        quantity: booking.jumlah_peserta,
        name: `Agrowisata: ${booking.paket.nama}`.substring(0, 50),
      }],
    };

    const snapResponse = await this.snap.createTransaction(parameter);
    const snapToken: string = snapResponse.token;

    await prisma.transaksiPembayaran.upsert({
      where: { booking_id: bookingId },
      create: {
        booking_id: bookingId,
        snap_token: snapToken,
        jumlah: totalHarga,
        status: 'PENDING',
        metode: 'MIDTRANS_SNAP',
      },
      update: { snap_token: snapToken },
    });

    return snapToken;
  }

  /**
   * Handle notifikasi webhook Midtrans
   */
  async handleWebhook(notification: Record<string, any>): Promise<void> {
    const prisma = this.app.prisma;

    // Verifikasi signature Midtrans
    const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = notification;

    const expectedSignature = crypto
      .createHash('sha512')
      .update(`${order_id}${status_code}${gross_amount}${this.serverKey}`)
      .digest('hex');

    if (signature_key !== expectedSignature) {
      throw { statusCode: 403, message: 'Signature tidak valid' };
    }

    // Tentukan status transaksi
    let statusBaru: string;
    if (transaction_status === 'capture' && fraud_status === 'accept') {
      statusBaru = 'SUCCESS';
    } else if (transaction_status === 'settlement') {
      statusBaru = 'SUCCESS';
    } else if (transaction_status === 'pending') {
      statusBaru = 'PENDING';
    } else if (['deny', 'cancel', 'failure'].includes(transaction_status)) {
      statusBaru = 'FAILED';
    } else if (transaction_status === 'expire') {
      statusBaru = 'EXPIRED';
    } else if (transaction_status === 'refund') {
      statusBaru = 'REFUNDED';
    } else {
      statusBaru = 'PENDING';
    }

    // Cek apakah ini booking atau pesanan produk
    const isBooking = order_id.startsWith('WISATA-');
    const realId = isBooking ? order_id.replace('WISATA-', '') : order_id;

    // Update transaksi
    if (isBooking) {
      await prisma.transaksiPembayaran.updateMany({
        where: { booking_id: realId },
        data: { status: statusBaru as any, updated_at: new Date() },
      });

      if (statusBaru === 'SUCCESS') {
        await prisma.bookingWisata.update({
          where: { id: realId },
          data: { status: 'DIKONFIRMASI' },
        });
      }
    } else {
      await prisma.transaksiPembayaran.updateMany({
        where: { pesanan_id: realId },
        data: { status: statusBaru as any, updated_at: new Date() },
      });

      if (statusBaru === 'SUCCESS') {
        await prisma.pesanan.update({
          where: { id: realId },
          data: { status: 'DIBAYAR' },
        });
      } else if (statusBaru === 'FAILED' || statusBaru === 'EXPIRED') {
        // Kembalikan stok
        await this.kembalikanStok(realId);
      }
    }

    this.app.log.info({ orderId: order_id, status: statusBaru }, 'Midtrans webhook diproses');
  }

  private async kembalikanStok(pesananId: string): Promise<void> {
    const detail = await this.app.prisma.detailPesanan.findMany({
      where: { pesanan_id: pesananId },
      select: { produk_id: true, jumlah: true },
    });

    for (const item of detail) {
      await this.app.prisma.produkMarketplace.update({
        where: { id: item.produk_id },
        data: { stok: { increment: item.jumlah } },
      });
    }
  }
}
