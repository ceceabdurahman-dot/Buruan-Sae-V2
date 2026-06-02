import { FastifyInstance } from 'fastify';
import { z } from 'zod';

// ============================================================
// Schema Marketplace
// ============================================================

export const TambahProdukSchema = z.object({
  nama: z.string().min(3).max(100).trim(),
  deskripsi: z.string().min(10).max(2000).trim(),
  harga: z.number().positive().max(99_999_999),
  stok: z.number().int().min(0).max(999999),
  satuan: z.string().max(20).default('kg'),
  komoditas_id: z.string().uuid().optional(),
  foto_urls: z.array(z.string().url()).max(5).default([]),
  kategori: z.string().max(50).optional(),
  berat_gram: z.number().positive().optional(),
});

export const UpdateProdukSchema = TambahProdukSchema.partial();

export const QueryProdukSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().optional(),
  kategori: z.string().optional(),
  kecamatan: z.string().optional(),
  harga_min: z.coerce.number().optional(),
  harga_max: z.coerce.number().optional(),
  sort: z.enum(['harga_asc', 'harga_desc', 'terbaru', 'populer']).default('terbaru'),
});

export const BuatPesananSchema = z.object({
  items: z.array(z.object({
    produk_id: z.string().uuid(),
    jumlah: z.number().int().positive().max(9999),
  })).min(1).max(20),
  alamat_pengiriman: z.string().min(10).max(500),
  catatan: z.string().max(300).optional(),
  metode_pembayaran: z.enum(['MIDTRANS_SNAP', 'MIDTRANS_GOPAY', 'MIDTRANS_TRANSFER']).default('MIDTRANS_SNAP'),
});

export type TambahProdukDto = z.infer<typeof TambahProdukSchema>;
export type QueryProdukDto = z.infer<typeof QueryProdukSchema>;
export type BuatPesananDto = z.infer<typeof BuatPesananSchema>;

// ============================================================
// Marketplace Service
// ============================================================

export class MarketplaceService {
  constructor(private readonly app: FastifyInstance) {}

  /**
   * Daftar produk marketplace dengan filter & sort
   */
  async daftarProduk(query: QueryProdukDto) {
    const { page, limit, search, kategori, kecamatan, harga_min, harga_max, sort } = query;
    const skip = (page - 1) * limit;

    const where: any = { is_active: true, stok: { gt: 0 } };
    if (search) where.nama = { contains: search, mode: 'insensitive' };
    if (kategori) where.kategori = kategori;
    if (harga_min !== undefined || harga_max !== undefined) {
      where.harga = {};
      if (harga_min !== undefined) where.harga.gte = harga_min;
      if (harga_max !== undefined) where.harga.lte = harga_max;
    }
    if (kecamatan) {
      where.penjual = { kecamatan };
    }

    const orderBy: any =
      sort === 'harga_asc' ? { harga: 'asc' }
      : sort === 'harga_desc' ? { harga: 'desc' }
      : sort === 'populer' ? { pesanan_detail: { _count: 'desc' } }
      : { created_at: 'desc' };

    const [total, data] = await Promise.all([
      this.app.prisma.produkMarketplace.count({ where }),
      this.app.prisma.produkMarketplace.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          nama: true,
          deskripsi: true,
          harga: true,
          stok: true,
          satuan: true,
          foto_urls: true,
          kategori: true,
          created_at: true,
          penjual: {
            select: { id: true, nama_lengkap: true, kecamatan: true, kelurahan: true },
          },
          komoditas: { select: { id: true, nama: true } },
        },
      }),
    ]);

    return { data, total, page, limit, totalHalaman: Math.ceil(total / limit) };
  }

  /**
   * Detail produk
   */
  async detailProduk(produkId: string) {
    const produk = await this.app.prisma.produkMarketplace.findUnique({
      where: { id: produkId, is_active: true },
      include: {
        penjual: { select: { id: true, nama_lengkap: true, kecamatan: true, foto_profil_url: true } },
        komoditas: { select: { id: true, nama: true, satuan: true } },
      },
    });

    if (!produk) throw { statusCode: 404, message: 'Produk tidak ditemukan' };
    return produk;
  }

  /**
   * Tambah produk (UMKM/Petani)
   */
  async tambahProduk(dto: TambahProdukDto, penjualId: string) {
    const produk = await this.app.prisma.produkMarketplace.create({
      data: {
        penjual_id: penjualId,
        komoditas_id: dto.komoditas_id,
        nama: dto.nama,
        deskripsi: dto.deskripsi,
        harga: dto.harga,
        stok: dto.stok,
        satuan: dto.satuan,
        foto_urls: dto.foto_urls,
        kategori: dto.kategori,
        berat_gram: dto.berat_gram,
      },
      select: { id: true },
    });

    return { id: produk.id, pesan: 'Produk berhasil ditambahkan' };
  }

  /**
   * Update stok produk
   */
  async updateStok(produkId: string, stokBaru: number, penjualId: string) {
    const produk = await this.app.prisma.produkMarketplace.findUnique({
      where: { id: produkId },
      select: { penjual_id: true },
    });

    if (!produk) throw { statusCode: 404, message: 'Produk tidak ditemukan' };
    if (produk.penjual_id !== penjualId) {
      throw { statusCode: 403, message: 'Anda bukan penjual produk ini' };
    }

    await this.app.prisma.produkMarketplace.update({
      where: { id: produkId },
      data: { stok: stokBaru },
    });

    return { pesan: 'Stok berhasil diperbarui' };
  }

  /**
   * Buat pesanan + hitung total + kurangi stok (dalam transaksi)
   */
  async buatPesanan(dto: BuatPesananDto, pembeliId: string) {
    const prisma = this.app.prisma;

    // Validasi semua produk & stok
    const produkIds = dto.items.map((i) => i.produk_id);
    const produkList = await prisma.produkMarketplace.findMany({
      where: { id: { in: produkIds }, is_active: true },
      select: { id: true, nama: true, harga: true, stok: true, satuan: true, penjual_id: true },
    });

    if (produkList.length !== produkIds.length) {
      throw { statusCode: 400, message: 'Satu atau lebih produk tidak ditemukan' };
    }

    const produkMap = new Map(produkList.map((p) => [p.id, p]));
    let totalHarga = 0;

    for (const item of dto.items) {
      const produk = produkMap.get(item.produk_id)!;
      if (produk.stok < item.jumlah) {
        throw {
          statusCode: 400,
          message: `Stok ${produk.nama} tidak cukup (tersedia: ${produk.stok} ${produk.satuan})`,
        };
      }
      totalHarga += Number(produk.harga) * item.jumlah;
    }

    // Buat pesanan dalam transaksi atomik
    const pesanan = await prisma.$transaction(async (tx) => {
      const newPesanan = await tx.pesanan.create({
        data: {
          pembeli_id: pembeliId,
          total_harga: totalHarga,
          alamat_pengiriman: dto.alamat_pengiriman,
          catatan: dto.catatan,
          status: 'MENUNGGU_PEMBAYARAN',
        },
        select: { id: true },
      });

      // Buat detail pesanan + kurangi stok
      for (const item of dto.items) {
        const produk = produkMap.get(item.produk_id)!;

        await tx.detailPesanan.create({
          data: {
            pesanan_id: newPesanan.id,
            produk_id: item.produk_id,
            jumlah: item.jumlah,
            harga_satuan: produk.harga,
            subtotal: Number(produk.harga) * item.jumlah,
          },
        });

        // Kurangi stok
        await tx.produkMarketplace.update({
          where: { id: item.produk_id },
          data: { stok: { decrement: item.jumlah } },
        });
      }

      return newPesanan;
    });

    // Poin pembeli (+5 per pesanan)
    try {
      await prisma.poinPengguna.create({
        data: {
          pengguna_id: pembeliId,
          poin: 5,
          aksi: 'BELI_PRODUK',
          referensi_id: pesanan.id,
        },
      });
    } catch { /* non-critical */ }

    return {
      pesanan_id: pesanan.id,
      total_harga: totalHarga,
      pesan: 'Pesanan berhasil dibuat',
    };
  }

  /**
   * Daftar pesanan pengguna
   */
  async daftarPesanan(penggunaId: string, peran: string) {
    const where: any = {};
    if (peran === 'KONSUMEN' || peran === 'PETANI') {
      where.pembeli_id = penggunaId;
    }

    return this.app.prisma.pesanan.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 50,
      include: {
        detail_pesanan: {
          include: {
            produk: { select: { id: true, nama: true, foto_urls: true } },
          },
        },
        transaksi: { select: { id: true, status: true, snap_token: true } },
      },
    });
  }
}
