import { FastifyInstance } from 'fastify';
import { z } from 'zod';

// ============================================================
// Schema Komunitas
// ============================================================

export const PostinganSchema = z.object({
  judul: z.string().min(5).max(200).trim(),
  konten: z.string().min(10).max(10000).trim(),
  kategori: z.enum(['DISKUSI', 'TANYA_JAWAB', 'PENGUMUMAN', 'TIPS_BERTANI', 'BERITA']).default('DISKUSI'),
  foto_urls: z.array(z.string().url()).max(5).default([]),
  kelompok_id: z.string().uuid().optional(),
  tags: z.array(z.string().max(30)).max(10).default([]),
});

export const KomentarSchema = z.object({
  konten: z.string().min(2).max(2000).trim(),
});

export const QueryPostinganSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  kategori: z.string().optional(),
  kelompok_id: z.string().uuid().optional(),
  search: z.string().optional(),
  sort: z.enum(['terbaru', 'terpopuler']).default('terbaru'),
});

export type PostinganDto = z.infer<typeof PostinganSchema>;
export type KomentarDto = z.infer<typeof KomentarSchema>;

// ============================================================
// Komunitas Service
// ============================================================

export class KomunitasService {
  constructor(private readonly app: FastifyInstance) {}

  async daftarPostingan(query: z.infer<typeof QueryPostinganSchema>) {
    const { page, limit, kategori, kelompok_id, search, sort } = query;
    const skip = (page - 1) * limit;

    const where: any = { deleted_at: null };
    if (kategori) where.kategori = kategori;
    if (kelompok_id) where.kelompok_id = kelompok_id;
    if (search) {
      where.OR = [
        { judul: { contains: search, mode: 'insensitive' } },
        { konten: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy = sort === 'terpopuler'
      ? [{ komentar: { _count: 'desc' } }, { created_at: 'desc' }]
      : { created_at: 'desc' };

    const [total, data] = await Promise.all([
      this.app.prisma.postingan.count({ where }),
      this.app.prisma.postingan.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderBy as any,
        select: {
          id: true,
          judul: true,
          konten: true,
          kategori: true,
          foto_urls: true,
          tags: true,
          created_at: true,
          penulis: { select: { id: true, nama_lengkap: true, foto_profil_url: true, peran: true } },
          kelompok: { select: { id: true, nama: true } },
          _count: { select: { komentar: true, like: true } },
        },
      }),
    ]);

    return { data, total, page, limit };
  }

  async detailPostingan(postinganId: string) {
    const postingan = await this.app.prisma.postingan.findUnique({
      where: { id: postinganId, deleted_at: null },
      include: {
        penulis: { select: { id: true, nama_lengkap: true, foto_profil_url: true, peran: true } },
        kelompok: { select: { id: true, nama: true } },
        komentar: {
          where: { deleted_at: null },
          orderBy: { created_at: 'asc' },
          include: {
            penulis: { select: { id: true, nama_lengkap: true, foto_profil_url: true } },
          },
          take: 100,
        },
        _count: { select: { like: true } },
      },
    });

    if (!postingan) throw { statusCode: 404, message: 'Postingan tidak ditemukan' };

    // Increment view count
    await this.app.prisma.postingan.update({
      where: { id: postinganId },
      data: { view_count: { increment: 1 } },
    });

    return postingan;
  }

  async buatPostingan(dto: PostinganDto, penulisId: string) {
    const postingan = await this.app.prisma.postingan.create({
      data: {
        penulis_id: penulisId,
        judul: dto.judul,
        konten: dto.konten,
        kategori: dto.kategori as any,
        foto_urls: dto.foto_urls,
        kelompok_id: dto.kelompok_id,
        tags: dto.tags,
      },
      select: { id: true },
    });

    // Poin +15 untuk postingan baru
    await this.app.prisma.poinPengguna.create({
      data: { pengguna_id: penulisId, poin: 15, aksi: 'BUAT_POSTINGAN', referensi_id: postingan.id },
    }).catch(() => {});

    return { id: postingan.id, pesan: 'Postingan berhasil dibuat' };
  }

  async tambahKomentar(postinganId: string, dto: KomentarDto, penulisId: string) {
    const komentar = await this.app.prisma.komentar.create({
      data: {
        postingan_id: postinganId,
        penulis_id: penulisId,
        konten: dto.konten,
      },
      select: { id: true },
    });

    // Poin +5 untuk komentar
    await this.app.prisma.poinPengguna.create({
      data: { pengguna_id: penulisId, poin: 5, aksi: 'KOMENTAR', referensi_id: komentar.id },
    }).catch(() => {});

    return { id: komentar.id, pesan: 'Komentar berhasil ditambahkan' };
  }

  async toggleLike(postinganId: string, penggunaId: string) {
    const existing = await this.app.prisma.likePostingan.findUnique({
      where: { postingan_id_pengguna_id: { postingan_id: postinganId, pengguna_id: penggunaId } },
    });

    if (existing) {
      await this.app.prisma.likePostingan.delete({ where: { id: existing.id } });
      return { disukai: false };
    } else {
      await this.app.prisma.likePostingan.create({
        data: { postingan_id: postinganId, pengguna_id: penggunaId },
      });
      return { disukai: true };
    }
  }
}
