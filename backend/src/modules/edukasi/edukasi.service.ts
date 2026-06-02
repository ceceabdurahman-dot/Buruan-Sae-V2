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
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: any = { is_active: true };
    if (query.kategori) where.kategori = query.kategori;
    if (query.level) where.level = query.level;

    const [total, data] = await Promise.all([
      this.app.prisma.kursus.count({ where }),
      this.app.prisma.kursus.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true, judul: true, deskripsi: true, kategori: true,
          level: true, durasi_menit: true, foto_cover_url: true,
          is_gratis: true, harga: true, rata_rating: true,
          _count: { select: { modul: true, progres: true } },
        },
      }),
    ]);

    return { data, total, page, limit };
  }

  async detailKursus(kursusId: string, penggunaId?: string) {
    const kursus = await this.app.prisma.kursus.findUnique({
      where: { id: kursusId, is_active: true },
      include: {
        modul: { orderBy: { urutan: 'asc' }, select: { id: true, judul: true, urutan: true, durasi_menit: true } },
        instruktur: { select: { id: true, nama_lengkap: true, foto_profil_url: true } },
      },
    });

    if (!kursus) throw { statusCode: 404, message: 'Kursus tidak ditemukan' };

    // Cek progres pengguna jika ada
    let progres = null;
    if (penggunaId) {
      progres = await this.app.prisma.progresBelajar.findMany({
        where: { pengguna_id: penggunaId, modul: { kursus_id: kursusId } },
        select: { modul_id: true, selesai: true, updated_at: true },
      });
    }

    const totalModul = kursus.modul.length;
    const modulSelesai = progres?.filter((p) => p.selesai).length ?? 0;

    return {
      ...kursus,
      progres: { total_modul: totalModul, selesai: modulSelesai, persen: totalModul ? Math.round((modulSelesai / totalModul) * 100) : 0 },
      progres_modul: progres ?? [],
    };
  }

  async tambahKursus(dto: TambahKursusDto, instrukturId: string) {
    const kursus = await this.app.prisma.$transaction(async (tx) => {
      const newKursus = await tx.kursus.create({
        data: {
          instruktur_id: instrukturId,
          judul: dto.judul,
          deskripsi: dto.deskripsi,
          kategori: dto.kategori as any,
          level: dto.level as any,
          durasi_menit: dto.durasi_menit,
          foto_cover_url: dto.foto_cover_url,
          is_gratis: dto.is_gratis,
          harga: dto.harga,
        },
        select: { id: true },
      });

      // Buat semua modul
      await tx.modulKursus.createMany({
        data: dto.modul.map((m) => ({
          kursus_id: newKursus.id,
          judul: m.judul,
          konten: m.konten,
          urutan: m.urutan,
          video_url: m.video_url,
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
      where: { pengguna_id_modul_id: { pengguna_id: penggunaId, modul_id: modulId } },
      create: { pengguna_id: penggunaId, modul_id: modulId, selesai: true },
      update: { selesai: true, updated_at: new Date() },
    });

    // Cek apakah kursus sudah 100% selesai
    const [totalModul, selesai] = await Promise.all([
      this.app.prisma.modulKursus.count({ where: { kursus_id: modul.kursus_id } }),
      this.app.prisma.progresBelajar.count({
        where: { selesai: true, modul: { kursus_id: modul.kursus_id } },
      }),
    ]);

    const kursusSelesai = totalModul > 0 && selesai === totalModul;

    if (kursusSelesai) {
      // Poin +50 untuk menyelesaikan kursus
      await this.app.prisma.poinPengguna.create({
        data: { pengguna_id: penggunaId, poin: 50, aksi: 'SELESAI_KURSUS', referensi_id: modul.kursus_id },
      }).catch(() => {});
    }

    return { pesan: 'Modul ditandai selesai', kursus_selesai: kursusSelesai };
  }
}
