import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// ============================================================
// Production Seed: Data Awal Aplikasi Buruan Sae 2.0
// Dijalankan satu kali saat inisialisasi server produksi
// ============================================================

const prisma = new PrismaClient();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;
const ENCRYPTION_SALT = process.env.ENCRYPTION_SALT ?? 'v1';

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
  throw new Error('[Seed] ENCRYPTION_KEY wajib disetel dan minimal 32 karakter.');
}

function encryptNik(nik: string): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, ENCRYPTION_SALT, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(nik, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${encrypted.toString('hex')}:${tag.toString('hex')}`;
}

function hashNik(nik: string): string {
  return crypto.createHash('sha256').update(nik + ENCRYPTION_SALT).digest('hex');
}

async function main() {
  console.log('Memulai seed data produksi Buruan Sae 2.0...');

  // 1. Super Admin
  console.log('  -> Membuat akun Super Admin...');
  const adminNik      = process.env.SEED_ADMIN_NIK      ?? '3273010000000001';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'BuruanSae@Admin2026';
  const adminWa       = process.env.SEED_ADMIN_WA       ?? '6281111111111';
  const adminEmail    = process.env.SEED_ADMIN_EMAIL    ?? 'admin@buruansae.bandung.go.id';

  const existingAdmin = await prisma.pengguna.findUnique({
    where: { nik_hash: hashNik(adminNik) },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const admin = await prisma.pengguna.create({
      data: {
        nik_encrypted:    encryptNik(adminNik),
        nik_hash:         hashNik(adminNik),
        nama:             'Administrator Buruan Sae',
        nomor_wa:         adminWa,
        email:            adminEmail,
        password_hash:    passwordHash,
        peran:            'SUPER_ADMIN',
        is_terverifikasi: true,
        is_aktif:         true,
        kecamatan:        'Bandung Wetan',
        kelurahan:        'Citarum',
      },
    });

    await prisma.consentPengguna.create({
      data: {
        pengguna_id:  admin.id,
        tipe_dokumen: 'KEBIJAKAN_PRIVASI',
        versi:        '1.0',
        disetujui:    true,
        ip_address:   '127.0.0.1',
      },
    });

    await prisma.poinPengguna.create({
      data: { pengguna_id: admin.id, total_poin: 0 },
    });

    console.log(`  OK Super Admin dibuat: ${adminWa}`);
    console.log(`     GANTI password setelah login pertama!`);
  } else {
    console.log('  INFO Super Admin sudah ada, skip.');
  }

  // 2. Komoditas Standar
  console.log('  -> Menambahkan komoditas standar...');
  const komoditasList = [
    { nama: 'Bayam',       nama_latin: 'Amaranthus tricolor',       kategori: 'SAYURAN' as const, satuan: 'kg' },
    { nama: 'Kangkung',    nama_latin: 'Ipomoea aquatica',          kategori: 'SAYURAN' as const, satuan: 'kg' },
    { nama: 'Selada',      nama_latin: 'Lactuca sativa',            kategori: 'SAYURAN' as const, satuan: 'kg' },
    { nama: 'Pakcoy',      nama_latin: 'Brassica rapa',             kategori: 'SAYURAN' as const, satuan: 'kg' },
    { nama: 'Sawi Hijau',  nama_latin: 'Brassica juncea',           kategori: 'SAYURAN' as const, satuan: 'kg' },
    { nama: 'Tomat',       nama_latin: 'Solanum lycopersicum',      kategori: 'SAYURAN' as const, satuan: 'kg' },
    { nama: 'Cabai Merah', nama_latin: 'Capsicum annuum',           kategori: 'SAYURAN' as const, satuan: 'kg' },
    { nama: 'Cabai Rawit', nama_latin: 'Capsicum frutescens',       kategori: 'SAYURAN' as const, satuan: 'kg' },
    { nama: 'Terong',      nama_latin: 'Solanum melongena',         kategori: 'SAYURAN' as const, satuan: 'kg' },
    { nama: 'Timun',       nama_latin: 'Cucumis sativus',           kategori: 'SAYURAN' as const, satuan: 'kg' },
    { nama: 'Buncis',      nama_latin: 'Phaseolus vulgaris',        kategori: 'SAYURAN' as const, satuan: 'kg' },
    { nama: 'Wortel',      nama_latin: 'Daucus carota',             kategori: 'SAYURAN' as const, satuan: 'kg' },
    { nama: 'Jahe',        nama_latin: 'Zingiber officinale',       kategori: 'REMPAH'  as const, satuan: 'kg' },
    { nama: 'Kunyit',      nama_latin: 'Curcuma longa',             kategori: 'REMPAH'  as const, satuan: 'kg' },
    { nama: 'Sereh',       nama_latin: 'Cymbopogon citratus',       kategori: 'REMPAH'  as const, satuan: 'ikat' },
    { nama: 'Kemangi',     nama_latin: 'Ocimum africanum',          kategori: 'HERBAL'  as const, satuan: 'ikat' },
    { nama: 'Daun Mint',   nama_latin: 'Mentha spicata',            kategori: 'HERBAL'  as const, satuan: 'ikat' },
    { nama: 'Stroberi',    nama_latin: 'Fragaria ananassa',         kategori: 'BUAH'    as const, satuan: 'kg' },
    { nama: 'Melon',       nama_latin: 'Cucumis melo',              kategori: 'BUAH'    as const, satuan: 'kg' },
    { nama: 'Pepaya',      nama_latin: 'Carica papaya',             kategori: 'BUAH'    as const, satuan: 'kg' },
  ];

  let komoditasBaru = 0;
  for (const k of komoditasList) {
    await prisma.komoditas.upsert({
      where:  { nama: k.nama },
      update: { nama_latin: k.nama_latin },
      create: { ...k, is_aktif: true },
    });
    komoditasBaru++;
  }
  console.log(`  OK ${komoditasBaru} komoditas berhasil di-seed.`);

  // 3. Kelompok Tani Contoh
  console.log('  -> Membuat kelompok tani contoh...');
  const kelompokList = [
    { nama: 'Kelompok Tani Hijau Cidadap', kecamatan: 'Cidadap',       kelurahan: 'Hegarmanah', deskripsi: 'Kelompok tani urban farming di kawasan Cidadap' },
    { nama: 'Komunitas Berkebun Coblong',  kecamatan: 'Coblong',       kelurahan: 'Dago',       deskripsi: 'Komunitas berkebun di RT/RW sekitar Dago' },
    { nama: 'Tani Maju Bandung Wetan',     kecamatan: 'Bandung Wetan', kelurahan: 'Tamansari',  deskripsi: 'Kelompok pertanian urban di Tamansari' },
  ];

  for (const k of kelompokList) {
    await prisma.kelompokTani.upsert({
      where:  { nama: k.nama },
      update: {},
      create: { ...k, is_aktif: true },
    });
  }
  console.log(`  OK ${kelompokList.length} kelompok tani berhasil di-seed.`);

  // 4. Kursus Edukasi Awal
  console.log('  -> Membuat kursus edukasi awal...');

  const adminUser = await prisma.pengguna.findFirst({ where: { peran: 'SUPER_ADMIN' } });

  if (adminUser) {
    const kursusData = [
      {
        judul:        'Panduan Memulai Urban Farming',
        deskripsi:    'Langkah awal untuk memulai berkebun di lahan terbatas perkotaan. Cocok untuk pemula.',
        kategori:     'DASAR',
        level:        'PEMULA',
        durasi_menit: 30,
        is_aktif:     true,
        pembuat_id:   adminUser.id,
        modul: [
          { judul: 'Apa itu Urban Farming?',        konten: { teks: 'Urban farming adalah praktik bercocok tanam di area perkotaan dengan memanfaatkan lahan sempit seperti pekarangan, atap rumah, atau pot.' }, urutan: 1, tipe: 'artikel', durasi_menit: 10 },
          { judul: 'Persiapan Lahan dan Media Tanam', konten: { teks: 'Pilih media tanam yang tepat: tanah kompos, hidroponik, atau pot. Pastikan drainase baik dan sinar matahari minimal 6 jam per hari.' }, urutan: 2, tipe: 'artikel', durasi_menit: 15 },
          { judul: 'Pemilihan Komoditas Awal',      konten: { teks: 'Mulai dengan sayuran mudah tumbuh: bayam, kangkung, atau selada. Panen dalam 21-30 hari.' }, urutan: 3, tipe: 'artikel', durasi_menit: 5 },
        ],
      },
      {
        judul:        'Teknik Hidroponik untuk Pemula',
        deskripsi:    'Belajar menanam tanpa tanah menggunakan sistem NFT dan DWC.',
        kategori:     'TEKNIK',
        level:        'MENENGAH',
        durasi_menit: 60,
        is_aktif:     true,
        pembuat_id:   adminUser.id,
        modul: [
          { judul: 'Prinsip Dasar Hidroponik',         konten: { teks: 'Hidroponik menggunakan air sebagai media nutrisi. Tanaman mendapatkan mineral langsung dari larutan nutrisi tanpa tanah.' }, urutan: 1, tipe: 'artikel', durasi_menit: 20 },
          { judul: 'Sistem NFT (Nutrient Film Technique)', konten: { teks: 'NFT mengalirkan lapisan tipis nutrisi di atas akar tanaman secara terus-menerus. Cocok untuk selada, kangkung, dan pakcoy.' }, urutan: 2, tipe: 'artikel', durasi_menit: 25 },
          { judul: 'Pemantauan pH dan EC',             konten: { teks: 'pH ideal 5.5-6.5, EC disesuaikan dengan jenis tanaman (sayuran daun: 1.2-2.0 mS/cm). Cek setiap hari.' }, urutan: 3, tipe: 'artikel', durasi_menit: 15 },
        ],
      },
      {
        judul:        'Pengelolaan Panen dan Pasca Panen',
        deskripsi:    'Cara memanen yang tepat, penanganan pasca panen, dan strategi memasarkan hasil panen.',
        kategori:     'BISNIS',
        level:        'MENENGAH',
        durasi_menit: 45,
        is_aktif:     true,
        pembuat_id:   adminUser.id,
        modul: [
          { judul: 'Waktu Panen yang Tepat',   konten: { teks: 'Setiap komoditas memiliki indikator kematangan berbeda. Bayam: 21-25 hari. Tomat: warna merata merah/oranye.' }, urutan: 1, tipe: 'artikel', durasi_menit: 15 },
          { judul: 'Penanganan Pasca Panen',   konten: { teks: 'Suhu penyimpanan 4-10 derajat untuk sayuran daun. Grading kualitas A/B/C berdasarkan ukuran dan kondisi. Pengemasan higienis.' }, urutan: 2, tipe: 'artikel', durasi_menit: 15 },
          { judul: 'Memasarkan Hasil Panen',   konten: { teks: 'Daftarkan produk di marketplace Buruan Sae untuk menjangkau konsumen sekitar. Foto produk yang baik meningkatkan penjualan.' }, urutan: 3, tipe: 'artikel', durasi_menit: 15 },
        ],
      },
    ];

    for (const kursus of kursusData) {
      const { modul, ...kursusFields } = kursus;
      const existingKursus = await prisma.kursus.findFirst({ where: { judul: kursusFields.judul } });
      if (!existingKursus) {
        await prisma.kursus.create({
          data: { ...kursusFields, modul: { create: modul } },
        });
      }
    }
    console.log(`  OK ${kursusData.length} kursus awal berhasil di-seed.`);
  }

  // 5. Paket Wisata Contoh
  console.log('  -> Membuat paket wisata contoh...');
  const paketWisataList = [
    { nama: 'Tur Kebun Urban 1 Jam',     deskripsi: 'Kunjungi kebun urban farming komunitas, pelajari teknik bertanam, dan petik langsung sayuran segar.', harga: 35000,  durasi_jam: 1, kapasitas: 15, is_aktif: true },
    { nama: 'Workshop Hidroponik Keluarga', deskripsi: 'Paket edukasi hidroponik untuk keluarga. Peserta membawa pulang kit starter hidroponik.',              harga: 150000, durasi_jam: 3, kapasitas: 10, is_aktif: true },
  ];

  for (const paket of paketWisataList) {
    const existing = await prisma.paketWisata.findFirst({ where: { nama: paket.nama } });
    if (!existing) {
      await prisma.paketWisata.create({ data: paket });
    }
  }
  console.log(`  OK ${paketWisataList.length} paket wisata berhasil di-seed.`);

  console.log('\nSeed produksi selesai! Buruan Sae 2.0 siap digunakan.');
  console.log('   Login WA: ' + (process.env.SEED_ADMIN_WA ?? '6281111111111'));
  console.log('   GANTI password setelah login pertama!');
}

main()
  .catch((e) => {
    console.error('Seed gagal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
