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
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(query.limit ?? 20)));

    const where: any = { is_aktif: true };

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
          kapasitas: true,
          durasi_jam: true,
          foto_url: true,
          is_aktif: true,
          created_at: true,
        },
      }),
    ]);

    const mapped = data.map((paket) => ({
      ...paket,
      harga: Number(paket.harga),
      harga_per_orang: Number(paket.harga),
      kapasitas_max: paket.kapasitas,
      lokasi: 'Kota Bandung',
      foto_urls: paket.foto_url ? [paket.foto_url] : [],
      rata_rating: 0,
      total_review: 0,
    }));

    return { data: mapped, items: mapped, total, page, limit, totalHalaman: Math.ceil(total / limit) };
  }

  async detailPaket(paketId: string) {
    const paket = await this.app.prisma.paketWisata.findUnique({
      where: { id: paketId, is_aktif: true },
      include: {
        booking: {
          where: { status: 'DIKONFIRMASI' },
          select: { tanggal: true, jumlah_peserta: true },
          orderBy: { tanggal: 'asc' },
          take: 30,
        },
      },
    });

    if (!paket) throw { statusCode: 404, message: 'Paket wisata tidak ditemukan' };
    return {
      ...paket,
      harga: Number(paket.harga),
      harga_per_orang: Number(paket.harga),
      kapasitas_max: paket.kapasitas,
      lokasi: 'Kota Bandung',
      foto_urls: paket.foto_url ? [paket.foto_url] : [],
      booking: paket.booking.map((booking) => ({
        ...booking,
        tgl_kunjungan: booking.tanggal,
      })),
    };
  }

  async tambahPaket(dto: TambahPaketDto, pengelolaId: string) {
    const paket = await this.app.prisma.paketWisata.create({
      data: {
        nama: dto.nama,
        deskripsi: dto.deskripsi,
        harga: dto.harga,
        kapasitas: dto.kapasitas_max,
        durasi_jam: dto.durasi_jam,
        foto_url: dto.foto_urls[0],
      },
      select: { id: true },
    });

    return { id: paket.id, pesan: 'Paket wisata berhasil ditambahkan' };
  }

  async buatBooking(dto: BookingDto, pemesanId: string) {
    const paket = await this.app.prisma.paketWisata.findUnique({
      where: { id: dto.paket_id, is_aktif: true },
      select: { id: true, kapasitas: true, harga: true, nama: true },
    });

    if (!paket) throw { statusCode: 404, message: 'Paket wisata tidak ditemukan' };

    // Cek kapasitas pada tanggal tersebut
    const tglKunjungan = new Date(dto.tgl_kunjungan);
    const bookingExisting = await this.app.prisma.bookingWisata.aggregate({
      where: {
        paket_id: dto.paket_id,
        tanggal: tglKunjungan,
        status: { in: ['PENDING', 'DIKONFIRMASI'] },
      },
      _sum: { jumlah_peserta: true },
    });

    const terisi = bookingExisting._sum.jumlah_peserta ?? 0;
    const tersedia = paket.kapasitas - terisi;

    if (dto.jumlah_peserta > tersedia) {
      throw {
        statusCode: 400,
        message: `Kapasitas tidak cukup. Tersedia: ${tersedia} peserta pada tanggal tersebut`,
      };
    }

    const booking = await this.app.prisma.bookingWisata.create({
      data: {
        paket_id: dto.paket_id,
        pengguna_id: pemesanId,
        tanggal: tglKunjungan,
        jumlah_peserta: dto.jumlah_peserta,
        catatan: dto.catatan,
        status: 'PENDING',
      },
      select: { id: true },
    });

    const totalHarga = Number(paket.harga) * dto.jumlah_peserta;

    return {
      booking_id: booking.id,
      total_harga: totalHarga,
      total: totalHarga,
      pesan: 'Booking berhasil! Lanjutkan ke pembayaran.',
    };
  }

  async daftarBooking(penggunaId: string, peran: string) {
    const where: any = {};
    if (!['ADMIN_DINAS', 'SUPER_ADMIN'].includes(peran)) {
      where.pengguna_id = penggunaId;
    }

    const data = await this.app.prisma.bookingWisata.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 50,
      include: {
        paket: { select: { id: true, nama: true, harga: true, foto_url: true } },
        pengguna: { select: { id: true, nama: true, nomor_wa: true } },
        pembayaran: { select: { id: true, status: true, snap_token: true } },
      },
    });

    return {
      data: data.map((booking) => ({
        ...booking,
        tgl_kunjungan: booking.tanggal,
        tanggal_kunjungan: booking.tanggal,
        total_harga: Number(booking.paket.harga) * booking.jumlah_peserta,
        pengguna: booking.pengguna
          ? { ...booking.pengguna, nama_lengkap: booking.pengguna.nama }
          : null,
      })),
    };
  }
}
