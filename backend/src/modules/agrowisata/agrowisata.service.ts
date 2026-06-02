import { FastifyInstance } from 'fastify';
import { z } from 'zod';

// ============================================================
// Schema Agrowisata
// ============================================================

export const TambahPaketSchema = z.object({
  nama: z.string().min(5).max(100).trim(),
  deskripsi: z.string().min(20).max(3000).trim(),
  harga: z.number().positive().max(99_999_999),
  kapasitas_max: z.number().int().min(1).max(1000),
  durasi_jam: z.number().positive().max(24),
  lokasi: z.string().max(200).trim(),
  fasilitas: z.array(z.string().max(100)).max(20).default([]),
  foto_urls: z.array(z.string().url()).max(10).default([]),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  hari_operasional: z.array(z.number().int().min(0).max(6)).default([1,2,3,4,5,6]),
  jam_buka: z.string().regex(/^\d{2}:\d{2}$/).default('08:00'),
  jam_tutup: z.string().regex(/^\d{2}:\d{2}$/).default('17:00'),
});

export const BookingSchema = z.object({
  paket_id: z.string().uuid(),
  tgl_kunjungan: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  jumlah_peserta: z.number().int().min(1).max(500),
  nama_pemesan: z.string().min(3).max(100).trim(),
  nomor_wa_pemesan: z.string().regex(/^08\d{8,11}$/),
  catatan: z.string().max(300).optional(),
});

export type TambahPaketDto = z.infer<typeof TambahPaketSchema>;
export type BookingDto = z.infer<typeof BookingSchema>;

// ============================================================
// Agrowisata Service
// ============================================================

export class AgrowisataService {
  constructor(private readonly app: FastifyInstance) {}

  async daftarPaket(query: { page?: number; limit?: number; kecamatan?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: any = { is_active: true };
    if (query.kecamatan) {
      where.pengelola = { kecamatan: query.kecamatan };
    }

    const [total, data] = await Promise.all([
      this.app.prisma.paketWisata.count({ where }),
      this.app.prisma.paketWisata.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          nama: true,
          deskripsi: true,
          harga: true,
          kapasitas_max: true,
          durasi_jam: true,
          lokasi: true,
          foto_urls: true,
          rata_rating: true,
          total_review: true,
          pengelola: { select: { id: true, nama_lengkap: true, kecamatan: true } },
        },
      }),
    ]);

    return { data, total, page, limit };
  }

  async detailPaket(paketId: string) {
    const paket = await this.app.prisma.paketWisata.findUnique({
      where: { id: paketId, is_active: true },
      include: {
        pengelola: { select: { id: true, nama_lengkap: true, nomor_wa: true, kecamatan: true } },
        booking: {
          where: { status: 'DIKONFIRMASI' },
          select: { tgl_kunjungan: true, jumlah_peserta: true },
          orderBy: { tgl_kunjungan: 'asc' },
          take: 30,
        },
      },
    });

    if (!paket) throw { statusCode: 404, message: 'Paket wisata tidak ditemukan' };
    return paket;
  }

  async tambahPaket(dto: TambahPaketDto, pengelolaId: string) {
    const paket = await this.app.prisma.$transaction(async (tx) => {
      const newPaket = await tx.paketWisata.create({
        data: {
          pengelola_id: pengelolaId,
          nama: dto.nama,
          deskripsi: dto.deskripsi,
          harga: dto.harga,
          kapasitas_max: dto.kapasitas_max,
          durasi_jam: dto.durasi_jam,
          lokasi: dto.lokasi,
          fasilitas: dto.fasilitas,
          foto_urls: dto.foto_urls,
          hari_operasional: dto.hari_operasional,
          jam_buka: dto.jam_buka,
          jam_tutup: dto.jam_tutup,
        },
        select: { id: true },
      });

      // Update koordinat PostGIS jika ada
      if (dto.lat && dto.lng) {
        await tx.$executeRaw`
          UPDATE "PaketWisata"
          SET lokasi_geom = ST_SetSRID(ST_MakePoint(${dto.lng}, ${dto.lat}), 4326)
          WHERE id = ${newPaket.id}::uuid
        `;
      }

      return newPaket;
    });

    return { id: paket.id, pesan: 'Paket wisata berhasil ditambahkan' };
  }

  async buatBooking(dto: BookingDto, pemesanId: string) {
    const paket = await this.app.prisma.paketWisata.findUnique({
      where: { id: dto.paket_id, is_active: true },
      select: { id: true, kapasitas_max: true, harga: true, nama: true },
    });

    if (!paket) throw { statusCode: 404, message: 'Paket wisata tidak ditemukan' };

    // Cek kapasitas pada tanggal tersebut
    const tglKunjungan = new Date(dto.tgl_kunjungan);
    const bookingExisting = await this.app.prisma.bookingWisata.aggregate({
      where: {
        paket_id: dto.paket_id,
        tgl_kunjungan: tglKunjungan,
        status: { in: ['MENUNGGU_KONFIRMASI', 'DIKONFIRMASI'] },
      },
      _sum: { jumlah_peserta: true },
    });

    const terisi = bookingExisting._sum.jumlah_peserta ?? 0;
    const tersedia = paket.kapasitas_max - terisi;

    if (dto.jumlah_peserta > tersedia) {
      throw {
        statusCode: 400,
        message: `Kapasitas tidak cukup. Tersedia: ${tersedia} peserta pada tanggal tersebut`,
      };
    }

    const booking = await this.app.prisma.bookingWisata.create({
      data: {
        paket_id: dto.paket_id,
        pemesan_id: pemesanId,
        tgl_kunjungan: tglKunjungan,
        jumlah_peserta: dto.jumlah_peserta,
        total_harga: Number(paket.harga) * dto.jumlah_peserta,
        nama_pemesan: dto.nama_pemesan,
        nomor_wa_pemesan: dto.nomor_wa_pemesan,
        catatan: dto.catatan,
        status: 'MENUNGGU_KONFIRMASI',
      },
      select: { id: true, total_harga: true },
    });

    return {
      booking_id: booking.id,
      total_harga: booking.total_harga,
      pesan: 'Booking berhasil! Lanjutkan ke pembayaran.',
    };
  }
}
