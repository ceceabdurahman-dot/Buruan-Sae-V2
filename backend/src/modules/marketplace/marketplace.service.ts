import { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// ============================================================
// Schema Marketplace
// ============================================================

export const TambahProdukSchema = z.object({
  nama: z.string().min(3).max(100).trim(),
  deskripsi: z.string().min(10).max(2000).trim().optional(),
  harga: z.number().positive().max(99_999_999),
  stok: z.number().int().min(0).max(999999),
  satuan: z.string().max(20).default('kg'),
  komoditas_id: z.string().uuid().optional(),
  foto_urls: z.array(z.string().url()).max(5).default([]),
  foto_url: z.string().url().optional(),
  kategori: z.string().max(50).default('sayuran'),
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

    const filters: Prisma.Sql[] = [
      Prisma.sql`pm.is_aktif = true`,
      Prisma.sql`pm.stok > 0`,
    ];

    if (search) {
      filters.push(Prisma.sql`pm.nama ILIKE ${`%${search}%`}`);
    }
    if (kategori) {
      filters.push(Prisma.sql`pm.kategori = ${kategori}`);
    }
    if (harga_min !== undefined) {
      filters.push(Prisma.sql`pm.harga >= ${harga_min}`);
    }
    if (harga_max !== undefined) {
      filters.push(Prisma.sql`pm.harga <= ${harga_max}`);
    }
    if (kecamatan) {
      filters.push(Prisma.sql`p.kecamatan = ${kecamatan}`);
    }

    const whereSql = Prisma.sql`WHERE ${Prisma.join(filters, ' AND ')}`;
    const orderSql =
      sort === 'harga_asc' ? Prisma.sql`pm.harga ASC`
      : sort === 'harga_desc' ? Prisma.sql`pm.harga DESC`
      : sort === 'populer' ? Prisma.sql`jumlah_pesanan DESC, pm.created_at DESC`
      : Prisma.sql`pm.created_at DESC`;

    const [countRows, rows] = await Promise.all([
      this.app.prisma.$queryRaw<{ total: bigint }[]>`
        SELECT COUNT(*)::bigint AS total
        FROM produk_marketplace pm
        LEFT JOIN pengguna p ON p.id = pm.penjual_id
        ${whereSql}
      `,
      this.app.prisma.$queryRaw<{
        id: string;
        nama: string;
        deskripsi: string | null;
        kategori: string;
        harga: string;
        stok: number;
        satuan: string;
        foto_url: string | null;
        created_at: Date;
        penjual_id: string;
        penjual_nama: string | null;
        penjual_kecamatan: string | null;
        penjual_kelurahan: string | null;
        jumlah_pesanan: bigint;
      }[]>`
        SELECT
          pm.id::text,
          pm.nama,
          pm.deskripsi,
          pm.kategori,
          pm.harga::text,
          pm.stok,
          pm.satuan,
          pm.foto_url,
          pm.created_at,
          pm.penjual_id::text,
          p.nama AS penjual_nama,
          p.kecamatan AS penjual_kecamatan,
          p.kelurahan AS penjual_kelurahan,
          COALESCE((
            SELECT COUNT(*)
            FROM detail_pesanan dp
            WHERE dp.produk_id = pm.id
          ), 0)::bigint AS jumlah_pesanan
        FROM produk_marketplace pm
        LEFT JOIN pengguna p ON p.id = pm.penjual_id
        ${whereSql}
        ORDER BY ${orderSql}
        LIMIT ${limit}
        OFFSET ${skip}
      `,
    ]);

    const total = Number(countRows[0]?.total ?? 0);
    const data = rows.map((row) => ({
      id: row.id,
      nama: row.nama,
      deskripsi: row.deskripsi,
      kategori: row.kategori,
      harga: Number(row.harga),
      stok: row.stok,
      satuan: row.satuan,
      foto_url: row.foto_url,
      foto_urls: row.foto_url ? [row.foto_url] : [],
      created_at: row.created_at,
      jumlah_pesanan: Number(row.jumlah_pesanan),
      penjual: {
        id: row.penjual_id,
        nama_lengkap: row.penjual_nama ?? 'Penjual',
        nama: row.penjual_nama ?? 'Penjual',
        kecamatan: row.penjual_kecamatan,
        kelurahan: row.penjual_kelurahan,
      },
    }));

    return { data, items: data, total, page, limit, totalHalaman: Math.ceil(total / limit) };
  }

  /**
   * Detail produk
   */
  async detailProduk(produkId: string) {
    const rows = await this.app.prisma.$queryRaw<{
      id: string;
      nama: string;
      deskripsi: string | null;
      kategori: string;
      harga: string;
      stok: number;
      satuan: string;
      foto_url: string | null;
      created_at: Date;
      penjual_id: string;
      penjual_nama: string | null;
      penjual_kecamatan: string | null;
      penjual_kelurahan: string | null;
      penjual_foto_url: string | null;
    }[]>`
      SELECT
        pm.id::text,
        pm.nama,
        pm.deskripsi,
        pm.kategori,
        pm.harga::text,
        pm.stok,
        pm.satuan,
        pm.foto_url,
        pm.created_at,
        pm.penjual_id::text,
        p.nama AS penjual_nama,
        p.kecamatan AS penjual_kecamatan,
        p.kelurahan AS penjual_kelurahan,
        p.foto_url AS penjual_foto_url
      FROM produk_marketplace pm
      LEFT JOIN pengguna p ON p.id = pm.penjual_id
      WHERE pm.id = ${produkId}::uuid
        AND pm.is_aktif = true
      LIMIT 1
    `;

    const produk = rows[0];
    if (!produk) throw { statusCode: 404, message: 'Produk tidak ditemukan' };

    return {
      id: produk.id,
      nama: produk.nama,
      deskripsi: produk.deskripsi,
      kategori: produk.kategori,
      harga: Number(produk.harga),
      stok: produk.stok,
      satuan: produk.satuan,
      foto_url: produk.foto_url,
      foto_urls: produk.foto_url ? [produk.foto_url] : [],
      created_at: produk.created_at,
      penjual: {
        id: produk.penjual_id,
        nama_lengkap: produk.penjual_nama ?? 'Penjual',
        nama: produk.penjual_nama ?? 'Penjual',
        kecamatan: produk.penjual_kecamatan,
        kelurahan: produk.penjual_kelurahan,
        foto_profil_url: produk.penjual_foto_url,
      },
    };
  }

  /**
   * Tambah produk (UMKM/Petani)
   */
  async tambahProduk(dto: TambahProdukDto, penjualId: string) {
    const produk = await this.app.prisma.produkMarketplace.create({
      data: {
        penjual_id: penjualId,
        nama: dto.nama,
        deskripsi: dto.deskripsi,
        harga: dto.harga,
        stok: dto.stok,
        satuan: dto.satuan,
        foto_url: dto.foto_url ?? dto.foto_urls[0],
        kategori: dto.kategori,
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
      where: { id: { in: produkIds }, is_aktif: true },
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
          penjual_id: produkList[0].penjual_id,
          total: totalHarga,
          catatan: dto.catatan,
          status: 'PENDING',
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
            qty: item.jumlah,
            harga_satuan: produk.harga,
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
      total: totalHarga,
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
        detail: {
          include: {
            produk: { select: { id: true, nama: true, foto_url: true } },
          },
        },
        pembayaran: { select: { id: true, status: true, snap_token: true } },
      },
    });
  }
}
