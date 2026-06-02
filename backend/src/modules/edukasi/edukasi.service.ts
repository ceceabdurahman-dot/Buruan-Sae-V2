import { FastifyInstance } from 'fastify';
import { z } from 'zod';

// ============================================================
// Schema Edukasi
// ============================================================

export const TambahKursusSchema = z.object({
  judul: z.string().min(5).max(150).trim(),
  deskripsi: z.string().min(20).max(3000).trim(),
  kategori: z.enum(['PERTANIAN_DASAR', 'BUDIDAYA', 'PENGOLAHAN', 'PEMASARAN', 'TEKNOLOGI']),
  level: z.enum(['PEMULA', 'MENENGAH', 'MAHIR']).default('PEMULA'),
  durasi_menit: z.number().int().positive(),
  foto_cover_url: z.string().url().optional(),
  is_gratis: z.boolean().default(true),
  harga: z.number().min(0).default(0),
  modul: z.array(z.object({
    judul: z.string().min(3).max(100),
    konten: z.string().min(10),
    urutan: z.number().int().positive(),
    video_url: z.string().url().optional(),
    durasi_menit: z.number().int().positive().optional(),
  })).min(1).max(50),
});

export type TambahKursusDto = z.infer<typeof TambahKursusSchema>;

// ============================================================
// Edukasi Service
// ============================================================

export class EdukasiService {
  constructor(private readonly app: FastifyInstance) {}

  async daftarKursus(query: { page?: number; limit?: number; kategori?: string; level?: string }) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(query.limit ?? 20)));
    const where: any = { is_aktif: true };
    if (query.kategori) where.kategori = query.kategori;
    if (query.level) where.level = query.level;

    const [total, data] = await Promise.all([
      this.app.prisma.kursus.count({ where }),
      this.app.prisma.kursus.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true, judul: true, deskripsi: true, kategori: true,
          level: true, durasi_menit: true, foto_cover: true,
          is_aktif: true, created_at: true,
          _count: { select: { modul: true, progres: true } },
        },
      }),
    ]);

    const mapped = data.map((kursus) => ({
      ...kursus,
      foto_cover_url: kursus.foto_cover,
      is_published: kursus.is_aktif,
      is_gratis: true,
      harga: 0,
      rata_rating: 0,
    }));

    return { data: mapped, items: mapped, total, page, limit, totalHalaman: Math.ceil(total / limit) };
  }

  async detailKursus(kursusId: string, penggunaId?: string) {
    const kursus = await this.app.prisma.kursus.findUnique({
      where: { id: kursusId, is_aktif: true },
      include: {
        modul: {
          orderBy: { urutan: 'asc' },
          select: { id: true, judul: true, urutan: true, durasi_menit: true, tipe: true, konten: true },
        },
        pembuat: { select: { id: true, nama: true, foto_url: true } },
      },
    });

    if (!kursus) throw { statusCode: 404, message: 'Kursus tidak ditemukan' };

    // Cek progres pengguna jika ada
    let progres = null;
    if (penggunaId) {
      progres = await this.app.prisma.progresBelajar.findUnique({
        where: { pengguna_id_kursus_id: { pengguna_id: penggunaId, kursus_id: kursusId } },
        select: { persen: true, selesai_at: true, updated_at: true },
      });
    }

    const totalModul = kursus.modul.length;
    const modulSelesai = progres ? Math.round((progres.persen / 100) * totalModul) : 0;

    return {
      ...kursus,
      foto_cover_url: kursus.foto_cover,
      is_published: kursus.is_aktif,
      is_gratis: true,
      harga: 0,
      instruktur: kursus.pembuat
        ? { id: kursus.pembuat.id, nama_lengkap: kursus.pembuat.nama, foto_profil_url: kursus.pembuat.foto_url }
        : null,
      progres: { total_modul: totalModul, selesai: modulSelesai, persen: totalModul ? Math.round((modulSelesai / totalModul) * 100) : 0 },
      progres_modul: [],
    };
  }

  async tambahKursus(dto: TambahKursusDto, instrukturId: string) {
    const kursus = await this.app.prisma.$transaction(async (tx) => {
      const newKursus = await tx.kursus.create({
        data: {
          pembuat_id: instrukturId,
          judul: dto.judul,
          deskripsi: dto.deskripsi,
          kategori: dto.kategori as any,
          level: dto.level as any,
          durasi_menit: dto.durasi_menit,
          foto_cover: dto.foto_cover_url,
        },
        select: { id: true },
      });

      // Buat semua modul
      await tx.modulKursus.createMany({
        data: dto.modul.map((m) => ({
          kursus_id: newKursus.id,
          judul: m.judul,
          konten: { teks: m.konten },
          urutan: m.urutan,
          tipe: m.video_url ? 'video' : 'artikel',
          durasi_menit: m.durasi_menit,
        })),
      });

      return newKursus;
    });

    return { id: kursus.id, pesan: 'Kursus berhasil dibuat' };
  }

  async tandaiModulSelesai(modulId: string, penggunaId: string) {
    const modul = await this.app.prisma.modulKursus.findUnique({
      where: { id: modulId },
      select: { id: true, kursus_id: true },
    });

    if (!modul) throw { statusCode: 404, message: 'Modul tidak ditemukan' };

    await this.app.prisma.progresBelajar.upsert({
      where: { pengguna_id_kursus_id: { pengguna_id: penggunaId, kursus_id: modul.kursus_id } },
      create: { pengguna_id: penggunaId, kursus_id: modul.kursus_id, persen: 100, selesai_at: new Date() },
      update: { persen: 100, selesai_at: new Date(), updated_at: new Date() },
    });

    const kursusSelesai = true;

    if (kursusSelesai) {
      // Poin +50 untuk menyelesaikan kursus
      await this.app.prisma.poinPengguna.upsert({
        where: { pengguna_id: penggunaId },
        create: { pengguna_id: penggunaId, total_poin: 50 },
        update: { total_poin: { increment: 50 } },
      }).catch(() => {});
    }

    return { pesan: 'Modul ditandai selesai', kursus_selesai: kursusSelesai };
  }
}
