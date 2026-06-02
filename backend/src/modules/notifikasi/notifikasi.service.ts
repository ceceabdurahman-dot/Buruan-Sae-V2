import { FastifyInstance } from 'fastify';
import axios from 'axios';

// ============================================================
// Notifikasi Service — FCM (Push) + WhatsApp (Fonnte)
// ============================================================

export interface PesanNotifikasi {
  judul: string;
  isi: string;
  tipe: 'SISTEM' | 'TRANSAKSI' | 'PANEN' | 'KOMUNITAS' | 'EDUKASI' | 'PROMOSI';
  data?: Record<string, string>;
}

export class NotifikasiService {
  private readonly fcmUrl = 'https://fcm.googleapis.com/v1/projects/buruan-sae/messages:send';
  private readonly fonnte = 'https://fontteapi.com/send';

  constructor(private readonly app: FastifyInstance) {}

  // ----------------------------------------------------------
  // Push Notification via FCM v1
  // ----------------------------------------------------------

  async kirimFcm(fcmToken: string, pesan: PesanNotifikasi): Promise<void> {
    try {
      await axios.post(
        this.fcmUrl,
        {
          message: {
            token: fcmToken,
            notification: { title: pesan.judul, body: pesan.isi },
            android: {
              notification: {
                icon: 'ic_notification',
                color: '#2D7D32',
                channel_id: pesan.tipe.toLowerCase(),
              },
            },
            apns: {
              payload: {
                aps: { badge: 1, sound: 'default' },
              },
            },
            data: {
              tipe: pesan.tipe,
              ...(pesan.data ?? {}),
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.FCM_SERVER_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (err: any) {
      this.app.log.warn({ err: err.message }, 'Gagal kirim FCM notifikasi');
    }
  }

  async kirimFcmBatch(fcmTokens: string[], pesan: PesanNotifikasi): Promise<void> {
    // FCM v1 tidak support batch — kirim paralel, max 500/s
    const BATCH_SIZE = 50;
    for (let i = 0; i < fcmTokens.length; i += BATCH_SIZE) {
      const batch = fcmTokens.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(batch.map((token) => this.kirimFcm(token, pesan)));
    }
  }

  // ----------------------------------------------------------
  // WhatsApp via Fonnte
  // ----------------------------------------------------------

  async kirimWhatsapp(nomorWa: string, pesan: string): Promise<boolean> {
    try {
      const nomorFormat = nomorWa.replace(/^0/, '62');
      const response = await axios.post(
        this.fonnte,
        { target: nomorFormat, message: pesan },
        {
          headers: { token: process.env.FONNTE_API_KEY ?? '' },
          timeout: 10_000,
        }
      );
      return response.data?.status === true;
    } catch (err: any) {
      this.app.log.warn({ err: err.message, nomorWa: nomorWa.slice(0, 4) + '****' }, 'Gagal kirim WA');
      return false;
    }
  }

  // ----------------------------------------------------------
  // Simpan notifikasi ke DB + kirim FCM
  // ----------------------------------------------------------

  async kirimKePengguna(
    penggunaId: string,
    pesan: PesanNotifikasi,
    opsi?: { kirimWa?: boolean }
  ): Promise<void> {
    // Simpan ke DB
    await this.app.prisma.notifikasi.create({
      data: {
        pengguna_id: penggunaId,
        judul: pesan.judul,
        isi: pesan.isi,
        tipe: pesan.tipe as any,
        data: pesan.data,
      },
    });

    // Ambil FCM token pengguna
    const pengguna = await this.app.prisma.pengguna.findUnique({
      where: { id: penggunaId },
      select: { fcm_token: true, nomor_wa: true },
    });

    if (pengguna?.fcm_token) {
      await this.kirimFcm(pengguna.fcm_token, pesan);
    }

    if (opsi?.kirimWa && pengguna?.nomor_wa) {
      await this.kirimWhatsapp(
        pengguna.nomor_wa,
        `*${pesan.judul}*\n\n${pesan.isi}`
      );
    }
  }

  async kirimBroadcast(
    filter: { peran?: string; kecamatan?: string },
    pesan: PesanNotifikasi
  ): Promise<{ terkirim: number }> {
    const where: any = { is_active: true, deleted_at: null, fcm_token: { not: null } };
    if (filter.peran) where.peran = filter.peran;
    if (filter.kecamatan) where.kecamatan = filter.kecamatan;

    const pengguna = await this.app.prisma.pengguna.findMany({
      where,
      select: { id: true, fcm_token: true },
    });

    const tokens = pengguna.map((p) => p.fcm_token!).filter(Boolean);

    // Simpan ke DB (batch)
    await this.app.prisma.notifikasi.createMany({
      data: pengguna.map((p) => ({
        pengguna_id: p.id,
        judul: pesan.judul,
        isi: pesan.isi,
        tipe: pesan.tipe as any,
        data: pesan.data,
      })),
      skipDuplicates: true,
    });

    await this.kirimFcmBatch(tokens, pesan);

    this.app.log.info({ count: tokens.length, tipe: pesan.tipe }, 'Broadcast notifikasi terkirim');
    return { terkirim: tokens.length };
  }

  // ----------------------------------------------------------
  // Notifikasi spesifik per event
  // ----------------------------------------------------------

  async notifikasiPesananDibayar(pesananId: string): Promise<void> {
    const pesanan = await this.app.prisma.pesanan.findUnique({
      where: { id: pesananId },
      select: {
        pembeli_id: true,
        total_harga: true,
        detail_pesanan: {
          include: { produk: { select: { penjual_id: true } } },
        },
      },
    });

    if (!pesanan) return;

    // Notifikasi ke pembeli
    await this.kirimKePengguna(pesanan.pembeli_id, {
      judul: '✅ Pembayaran Berhasil',
      isi: `Pesanan Anda telah dibayar. Menunggu konfirmasi penjual.`,
      tipe: 'TRANSAKSI',
      data: { pesanan_id: pesananId },
    });

    // Notifikasi ke semua penjual terlibat
    const penjualIds = [...new Set(pesanan.detail_pesanan.map((d) => d.produk.penjual_id))];
    for (const penjualId of penjualIds) {
      await this.kirimKePengguna(penjualId, {
        judul: '🛒 Pesanan Baru!',
        isi: 'Ada pesanan baru yang perlu dikonfirmasi.',
        tipe: 'TRANSAKSI',
        data: { pesanan_id: pesananId },
      }, { kirimWa: true });
    }
  }

  async notifikasiLahanDisetujui(lahanId: string, disetujui: boolean): Promise<void> {
    const lahan = await this.app.prisma.lahan.findUnique({
      where: { id: lahanId },
      select: { pemilik_id: true, nama: true },
    });

    if (!lahan) return;

    await this.kirimKePengguna(lahan.pemilik_id, {
      judul: disetujui ? '✅ Lahan Disetujui' : '❌ Lahan Ditolak',
      isi: disetujui
        ? `Lahan "${lahan.nama}" telah diverifikasi dan aktif. Mulai catat produksimu!`
        : `Lahan "${lahan.nama}" ditolak. Cek detail di aplikasi.`,
      tipe: 'SISTEM',
      data: { lahan_id: lahanId },
    }, { kirimWa: true });
  }
}
