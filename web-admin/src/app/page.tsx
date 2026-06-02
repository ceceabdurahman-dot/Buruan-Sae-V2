import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  Leaf,
  Map,
  MapPin,
  ShoppingBag,
  Sprout,
  Users,
} from 'lucide-react';

const publicModules = [
  {
    title: 'Peta Lahan Publik',
    description: 'Sebaran lahan aktif dan data spasial program Buruan Sae.',
    icon: Map,
    href: '/peta-lahan',
    status: 'Publik',
  },
  {
    title: 'Marketplace Lokal',
    description: 'Katalog produk segar dan olahan dari komunitas serta UMKM.',
    icon: ShoppingBag,
    href: '#marketplace',
    status: 'Portal',
  },
  {
    title: 'Agrowisata Edukasi',
    description: 'Informasi kunjungan kebun, pelatihan, dan agenda edukasi.',
    icon: CalendarDays,
    href: '#agrowisata',
    status: 'Portal',
  },
  {
    title: 'Edukasi Terbuka',
    description: 'Materi budidaya, kompos, hidroponik, pemasaran, dan kolaborasi.',
    icon: BookOpen,
    href: '#edukasi',
    status: 'Portal',
  },
];

const stats = [
  { label: 'Modul terintegrasi', value: '8' },
  { label: 'Aktor Penta Helix', value: '5' },
  { label: 'Kecamatan target', value: '30' },
];

const ecosystem = [
  { label: 'Pemerintah', description: 'Validasi program, monitoring, dan kebijakan.', icon: Building2 },
  { label: 'Komunitas', description: 'Kelompok tani, kader, dan pengelola kebun.', icon: Users },
  { label: 'Bisnis', description: 'UMKM, offtaker, marketplace, dan agrowisata.', icon: ShoppingBag },
  { label: 'Data', description: 'Peta lahan, panen, transaksi, dan indikator dampak.', icon: BarChart3 },
];

const navLinks = [
  { href: '/peta-lahan', label: 'Peta' },
  { href: '#marketplace', label: 'Marketplace' },
  { href: '#agrowisata', label: 'Agrowisata' },
  { href: '#edukasi', label: 'Edukasi' },
];

export default function PublicHomePage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bs-hijau text-white">
              <Leaf className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-gray-950">Buruan Sae 2.0</span>
              <span className="block truncate text-xs text-gray-500">Portal Publik Kota Bandung</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-bs-hijau-50 hover:text-bs-hijau"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/auth/login"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-bs-hijau px-4 text-sm font-semibold text-white transition hover:bg-bs-hijau-900"
          >
            Masuk Admin
          </Link>
        </div>

        <nav className="flex gap-1 overflow-x-auto border-t border-gray-100 px-4 py-2 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-bs-hijau-50 hover:text-bs-hijau"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      <section className="border-b border-gray-200 bg-bs-hijau-50">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8 lg:py-14">
          <div className="flex flex-col justify-center">
            <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-lg border border-bs-hijau-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-bs-hijau-800">
              <Sprout className="h-4 w-4" aria-hidden="true" />
              Sistem publik Buruan Sae
            </span>
            <h1 className="max-w-3xl text-3xl font-bold leading-tight text-gray-950 sm:text-4xl lg:text-5xl">
              Portal pertanian perkotaan untuk lahan, komunitas, produk, agrowisata, dan edukasi.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-700">
              Halaman publik menampilkan akses masyarakat sesuai arsitektur sistem. Area
              operasional, validasi, dan dashboard tetap dipisahkan di panel admin berbasis role.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/peta-lahan"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-bs-hijau px-5 text-sm font-semibold text-white transition hover:bg-bs-hijau-900"
              >
                Buka Peta Lahan
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="#modul-publik"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-800 transition hover:border-bs-hijau hover:text-bs-hijau"
              >
                Lihat Modul Publik
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <p className="text-sm font-semibold text-gray-950">Ringkasan Sistem</p>
                <p className="mt-1 text-xs text-gray-500">Publik dan admin dipisahkan</p>
              </div>
              <span className="rounded-lg bg-bs-hijau-50 px-3 py-1 text-xs font-semibold text-bs-hijau-800">
                v2.0
              </span>
            </div>

            <dl className="mt-5 grid grid-cols-3 gap-3">
              {stats.map((item) => (
                <div key={item.label} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-4">
                  <dt className="text-xs leading-4 text-gray-500">{item.label}</dt>
                  <dd className="mt-2 text-2xl font-bold text-gray-950">{item.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-5 rounded-lg border border-bs-hijau-100 bg-bs-hijau-50 p-4">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-bs-hijau" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-gray-950">Peta Lahan Publik</p>
                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    Endpoint publik sudah mengembalikan GeoJSON valid. Polygon akan tampil
                    setelah data geometri lahan tersedia di database.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="modul-publik" className="border-b border-gray-200 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-950 sm:text-3xl">Modul Publik</h2>
            <p className="mt-3 text-sm leading-6 text-gray-600 sm:text-base">
              Modul berikut dapat diakses masyarakat tanpa membuka area dashboard admin.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {publicModules.map((module) => {
              const Icon = module.icon;
              return (
                <Link
                  key={module.title}
                  href={module.href}
                  className="group rounded-lg border border-gray-200 bg-white p-5 transition hover:border-bs-hijau hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-bs-hijau-50 text-bs-hijau">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                      {module.status}
                    </span>
                  </div>
                  <h3 className="mt-5 text-base font-semibold text-gray-950">{module.title}</h3>
                  <p className="mt-2 min-h-16 text-sm leading-6 text-gray-600">{module.description}</p>
                  <span className="mt-4 inline-flex items-center text-sm font-semibold text-bs-hijau">
                    Buka modul
                    <ArrowRight className="ml-1 h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section id="marketplace" className="border-b border-gray-200 bg-gray-50 py-12 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-950 sm:text-3xl">Ekosistem Penta Helix</h2>
            <p className="mt-4 text-sm leading-6 text-gray-600 sm:text-base">
              Buruan Sae 2.0 menghubungkan pemerintah, komunitas, bisnis, akademisi,
              dan masyarakat melalui data program yang tertata.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Data publik untuk transparansi program',
                'Dashboard admin untuk validasi dan monitoring',
                'Modul ekonomi, agrowisata, dan edukasi tetap terpisah',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-bs-hijau" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {ecosystem.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-lg border border-gray-200 bg-white p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-bs-kuning-50 text-bs-kuning-800">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-gray-950">{item.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="agrowisata" className="border-b border-gray-200 bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-bs-hijau-200 bg-bs-hijau-50 p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-wide text-bs-hijau-800">
                  Agrowisata dan edukasi
                </p>
                <h2 className="mt-2 text-2xl font-bold text-gray-950 sm:text-3xl">
                  Informasi publik siap dikembangkan dari data admin.
                </h2>
                <p className="mt-3 text-sm leading-6 text-gray-700 sm:text-base">
                  Konten agrowisata, edukasi, dan marketplace dapat diisi dari modul admin
                  setelah data operasional dikurasi.
                </p>
              </div>
              <Link
                href="/auth/login"
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-bs-hijau px-5 text-sm font-semibold text-white transition hover:bg-bs-hijau-900"
              >
                Kelola di Dashboard
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="edukasi" className="bg-bs-hijau-900 py-12 text-white sm:py-14">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Admin mengelola, publik mengakses.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">
              Gunakan dashboard untuk validasi data dan monitoring program, sementara halaman
              publik menjadi pintu informasi masyarakat.
            </p>
          </div>
          <Link
            href="/auth/login"
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-white px-5 text-sm font-semibold text-bs-hijau-900 transition hover:bg-bs-hijau-50 sm:w-auto"
          >
            Masuk Admin
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-gray-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-bs-hijau text-white">
              <Leaf className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-semibold text-gray-900">Buruan Sae 2.0</p>
              <p>Dinas Ketahanan Pangan dan Pertanian Kota Bandung</p>
            </div>
          </div>
          <p>© {new Date().getFullYear()} IBBF. Portal Publik Kota Bandung.</p>
        </div>
      </footer>
    </main>
  );
}
