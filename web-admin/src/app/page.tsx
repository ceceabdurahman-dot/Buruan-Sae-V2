'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  Leaf,
  Map,
  Menu,
  ShoppingBag,
  Sprout,
  Users,
  X,
} from 'lucide-react';

// ============================================================
// Halaman Publik — Buruan Sae 2.0 Portal
// ============================================================

const publicModules = [
  {
    title: 'Peta Lahan Publik',
    description: 'Sebaran kebun, status lahan, dan potensi pemanfaatan ruang kota.',
    icon: Map,
    href: '#peta',
    gradient: 'from-emerald-500 to-green-600',
  },
  {
    title: 'Marketplace Lokal',
    description: 'Produk segar dan olahan dari kelompok tani, UMKM, dan mitra kota.',
    icon: ShoppingBag,
    href: '#ekonomi',
    gradient: 'from-amber-500 to-yellow-600',
  },
  {
    title: 'Agrowisata Edukasi',
    description: 'Paket kunjungan kebun, pelatihan lapangan, dan pengalaman hijau.',
    icon: CalendarDays,
    href: '#agrowisata',
    gradient: 'from-teal-500 to-cyan-600',
  },
  {
    title: 'Edukasi Terbuka',
    description: 'Materi budidaya, pemasaran digital, kompos, dan hidroponik.',
    icon: BookOpen,
    href: '#edukasi',
    gradient: 'from-violet-500 to-purple-600',
  },
];

const impactStats = [
  { label: 'Modul terintegrasi', value: 8 },
  { label: 'Aktor Penta Helix', value: 5 },
  { label: 'Kecamatan target', value: 30 },
];

const ecosystem = [
  { label: 'Pemerintah', description: 'Validasi program dan dashboard kebijakan', icon: Building2 },
  { label: 'Komunitas', description: 'Kelompok tani, kader, dan pengelola kebun', icon: Users },
  { label: 'Bisnis', description: 'UMKM, offtaker, marketplace, dan agrowisata', icon: ShoppingBag },
  { label: 'Data', description: 'Peta, panen, transaksi, dan indikator dampak', icon: BarChart3 },
];

const NAV_LINKS = [
  { href: '#peta', label: 'Peta' },
  { href: '#ekonomi', label: 'Marketplace' },
  { href: '#agrowisata', label: 'Agrowisata' },
  { href: '#edukasi', label: 'Edukasi' },
];

// ── Scroll-triggered visibility hook ────────────────────────
function useScrollReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, revealed };
}

// ── Animated counter ────────────────────────────────────────
function AnimatedCounter({ target, active }: { target: number; active: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    let frame: number;
    const duration = 1200;
    const start = performance.now();

    function step(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(step);
    }

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [active, target]);

  return <>{count}</>;
}

// ============================================================
// Main Component
// ============================================================

export default function PublicHomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  const modulesReveal = useScrollReveal();
  const ecoReveal = useScrollReveal();
  const ctaReveal = useScrollReveal();
  const statsReveal = useScrollReveal<HTMLDListElement>();

  // Mounted state — trigger hero animation after hydration
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Track header scroll state
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMobile = useCallback(() => setMobileMenuOpen(false), []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  return (
    <main className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      {/* ── Header ──────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 bg-white/95 backdrop-blur-md transition-all duration-300 ${
          scrolled
            ? 'border-b border-gray-200 shadow-sm shadow-gray-200/50'
            : 'border-b border-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-bs-hijau to-bs-hijau-900 text-white shadow-md shadow-bs-hijau/25 transition-transform duration-200 group-hover:scale-105">
              <Leaf className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-bold leading-5 text-gray-950">Buruan Sae 2.0</span>
              <span className="block text-xs leading-4 text-gray-500">Portal Publik Kota Bandung</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors duration-200 hover:bg-bs-hijau-50 hover:text-bs-hijau"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="hidden h-10 items-center justify-center rounded-lg bg-gradient-to-r from-bs-hijau to-bs-hijau-700 px-5 text-sm font-semibold text-white shadow-md shadow-bs-hijau/20 transition-all duration-200 hover:shadow-lg hover:shadow-bs-hijau/30 hover:brightness-110 sm:inline-flex"
            >
              Masuk Admin
            </Link>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="animate-slide-down border-t border-gray-100 bg-white shadow-lg md:hidden">
            <nav className="mx-auto max-w-7xl space-y-1 px-4 py-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={closeMobile}
                  className="flex items-center rounded-lg px-3 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-bs-hijau-50 hover:text-bs-hijau"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-2">
                <Link
                  href="/auth/login"
                  onClick={closeMobile}
                  className="flex h-11 w-full items-center justify-center rounded-lg bg-gradient-to-r from-bs-hijau to-bs-hijau-700 text-sm font-semibold text-white shadow-md"
                >
                  Masuk Admin
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ── Hero Section ────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-b from-bs-hijau-50/80 via-white to-white">
        {/* Decorative floating blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -left-32 -top-32 h-96 w-96 animate-float rounded-full bg-gradient-to-br from-bs-hijau-100/60 to-bs-hijau-200/30 blur-3xl" />
          <div className="animate-float-slow absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-gradient-to-br from-bs-kuning-100/50 to-bs-kuning-200/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-64 w-64 animate-float rounded-full bg-gradient-to-br from-emerald-100/40 to-teal-100/20 blur-3xl" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-8">
          {/* Left column — copy */}
          <div
            className={`max-w-2xl transition-all duration-700 ease-out ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-bs-hijau-200 bg-bs-hijau-50 px-4 py-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-bs-hijau" />
              <span className="text-xs font-semibold text-bs-hijau-800">Sistem Terbuka & Terukur</span>
            </div>

            <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-950 sm:text-4xl md:text-5xl lg:text-6xl">
              Platform publik untuk{' '}
              <span className="bg-gradient-to-r from-bs-hijau to-bs-hijau-600 bg-clip-text text-transparent">
                ekosistem pertanian
              </span>{' '}
              perkotaan Bandung.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-gray-600 sm:text-lg">
              Buruan Sae 2.0 menghubungkan peta lahan, produksi komunitas, UMKM,
              agrowisata, dan edukasi dalam satu sistem terbuka yang terukur.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#peta"
                className="group inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-bs-hijau to-bs-hijau-700 px-6 text-sm font-semibold text-white shadow-lg shadow-bs-hijau/25 transition-all duration-200 hover:shadow-xl hover:shadow-bs-hijau/30 hover:brightness-110 active:scale-[0.98]"
              >
                Lihat Portal Publik
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
              </a>
              <a
                href="#ekosistem"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-gray-300 bg-white px-6 text-sm font-semibold text-gray-800 shadow-sm transition-all duration-200 hover:border-bs-hijau hover:text-bs-hijau hover:shadow-md active:scale-[0.98]"
              >
                Pelajari Ekosistem
              </a>
            </div>

            {/* Impact Stats */}
            <dl
              ref={statsReveal.ref}
              className="mt-10 grid max-w-md grid-cols-3 gap-4"
            >
              {impactStats.map((stat, i) => (
                <div
                  key={stat.label}
                  className="border-l-2 border-bs-hijau pl-4"
                >
                  <dt className="text-xs leading-4 text-gray-500">{stat.label}</dt>
                  <dd className="mt-1 text-2xl font-bold tabular-nums text-gray-950">
                    <AnimatedCounter target={stat.value} active={statsReveal.revealed} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Right column — Map illustration */}
          <div
            id="peta"
            className={`relative transition-all delay-300 duration-700 ease-out ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-300/30">
              {/* Map header bar */}
              <div className="flex h-12 items-center justify-between border-b border-gray-100 bg-gray-50/50 px-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-bs-hijau" />
                  <span className="text-sm font-semibold text-gray-900">Peta Lahan Kota</span>
                </div>
                <span className="rounded-full bg-bs-hijau-50 px-2.5 py-0.5 text-xs font-medium text-bs-hijau-800">
                  Data publik
                </span>
              </div>

              {/* Map content */}
              <div className="relative aspect-[4/3] bg-gradient-to-br from-bs-hijau-50 to-emerald-50/50">
                {/* Grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(45,125,50,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(45,125,50,0.06)_1px,transparent_1px)] bg-[size:36px_36px]" />

                {/* SVG illustration */}
                <svg className="absolute inset-0 h-full w-full" viewBox="0 0 560 420" role="img" aria-label="Ilustrasi peta lahan publik Buruan Sae">
                  <path d="M72 274C122 206 135 120 219 101C300 83 337 147 408 127C466 110 505 139 516 197C529 266 470 314 394 330C302 349 252 308 190 330C128 352 43 337 72 274Z" fill="#C8E6C9" />
                  <path d="M109 272C152 223 173 158 232 145C289 132 324 181 381 166C432 153 469 179 473 224C479 276 426 300 370 307C292 316 254 279 204 301C155 321 82 307 109 272Z" fill="#81C784" />
                  <path d="M93 302L192 215L268 250L357 184L483 244" fill="none" stroke="#2D7D32" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M93 302L192 215L268 250L357 184L483 244" fill="none" stroke="#F9A825" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  {[
                    [192, 215],
                    [268, 250],
                    [357, 184],
                    [423, 212],
                  ].map(([cx, cy]) => (
                    <g key={`${cx}-${cy}`}>
                      <circle cx={cx} cy={cy} r="22" fill="#2D7D32" fillOpacity="0.1" className="animate-pulse-dot" />
                      <circle cx={cx} cy={cy} r="16" fill="#ffffff" stroke="#2D7D32" strokeWidth="3" />
                      <circle cx={cx} cy={cy} r="6" fill="#F9A825" />
                    </g>
                  ))}
                </svg>

                {/* Overlay stat cards */}
                <div className="absolute bottom-3 left-3 right-3 grid gap-2 sm:grid-cols-3">
                  {[
                    ['Lahan aktif', '126', 'bg-emerald-500'],
                    ['Pengajuan', '38', 'bg-amber-500'],
                    ['Kebun wisata', '12', 'bg-teal-500'],
                  ].map(([label, value, dotColor]) => (
                    <div key={label} className="rounded-lg border border-white/60 bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
                        <p className="text-[11px] text-gray-500">{label}</p>
                      </div>
                      <p className="mt-0.5 text-lg font-bold text-gray-950">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Public Modules ──────────────────────────────────── */}
      <section id="ekonomi" className="border-b border-gray-100 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div ref={modulesReveal.ref}>
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-bs-hijau-50 px-3 py-1">
                <Leaf className="h-3.5 w-3.5 text-bs-hijau" />
                <span className="text-xs font-semibold text-bs-hijau-800">Modul Terbuka</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
                Akses publik sesuai arsitektur sistem
              </h2>
              <p className="mt-3 text-sm leading-6 text-gray-600 sm:text-base">
                Modul publik dirancang terbuka untuk masyarakat, wisatawan, akademisi,
                pelaku UMKM, dan mitra bisnis tanpa membuka area operasional admin.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {publicModules.map((module, i) => {
              const Icon = module.icon;
              return (
                <a
                  key={module.title}
                  href={module.href}
                  className={`group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-500 hover:-translate-y-1 hover:border-bs-hijau/30 hover:shadow-xl hover:shadow-bs-hijau/5 ${
                    modulesReveal.revealed
                      ? 'translate-y-0 opacity-100'
                      : 'translate-y-6 opacity-0'
                  }`}
                  style={{ transitionDelay: `${(i + 1) * 80}ms` }}
                >
                  <span className={`relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${module.gradient} text-white shadow-md transition-transform duration-200 group-hover:scale-110`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="relative mt-5 text-base font-semibold text-gray-950">{module.title}</h3>
                  <p className="relative mt-2 text-sm leading-6 text-gray-600">{module.description}</p>
                  <span className="relative mt-5 inline-flex items-center text-sm font-semibold text-bs-hijau">
                    Buka modul
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Ekosistem Penta Helix ───────────────────────────── */}
      <section id="agrowisata" className="border-b border-gray-100 bg-gray-50 py-20">
        <div
          ref={ecoReveal.ref}
          className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:px-8"
        >
          {/* Left: description */}
          <div
            className={`transition-all duration-700 ease-out ${
              ecoReveal.revealed ? 'translate-x-0 opacity-100' : '-translate-x-6 opacity-0'
            }`}
          >
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-bs-kuning-50 px-3 py-1">
              <Sprout className="h-3.5 w-3.5 text-bs-kuning-800" />
              <span className="text-xs font-semibold text-bs-kuning-800">Penta Helix</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
              Dari lahan tidur ke sentra ekonomi kreatif.
            </h2>
            <p className="mt-4 text-sm leading-6 text-gray-600 sm:text-base">
              Halaman publik menampilkan narasi program, data agregat, dan akses modul
              yang aman. Operasional validasi, pengguna, dan dashboard tetap berada di
              area admin berbasis role.
            </p>

            <ul className="mt-6 space-y-3">
              {['Data terbuka untuk transparansi', 'Kolaborasi multi-stakeholder', 'Dashboard terpisah untuk admin'].map(
                (text, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-bs-hijau/10 text-bs-hijau">
                      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {text}
                  </li>
                ),
              )}
            </ul>
          </div>

          {/* Right: ecosystem cards */}
          <div id="ekosistem" className="grid gap-4 sm:grid-cols-2">
            {ecosystem.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className={`group rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-lg hover:shadow-gray-200/50 ${
                    ecoReveal.revealed ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
                  }`}
                  style={{ transitionDelay: `${(i + 1) * 80}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-bs-kuning-50 to-bs-kuning-100 text-bs-kuning-800 shadow-sm transition-transform duration-200 group-hover:scale-110">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="text-base font-semibold text-gray-950">{item.label}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-gray-600">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA Bottom ──────────────────────────────────────── */}
      <section id="edukasi" className="relative overflow-hidden bg-gradient-to-br from-bs-hijau-900 via-bs-hijau-800 to-bs-hijau py-20">
        {/* Decorative bg */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px]" />
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-bs-kuning/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        </div>

        <div
          ref={ctaReveal.ref}
          className={`relative mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 transition-all duration-700 ease-out ${
            ctaReveal.revealed ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <div className="max-w-2xl">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-sm">
                <Sprout className="h-6 w-6" aria-hidden="true" />
              </span>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Admin mengelola, publik ikut bergerak.
              </h2>
            </div>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/70 sm:text-base">
              Gunakan panel admin untuk validasi data, monitoring produksi, marketplace,
              agrowisata, edukasi, dan dashboard program.
            </p>
          </div>
          <Link
            href="/auth/login"
            className="group inline-flex h-12 w-full shrink-0 items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-bs-hijau-800 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] sm:w-auto"
          >
            Masuk ke Dashboard
            <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-bs-hijau to-bs-hijau-900 text-white">
                  <Leaf className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-gray-950">Buruan Sae 2.0</span>
                  <span className="block text-xs text-gray-500">Kota Bandung</span>
                </span>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-6 text-gray-500">
                Platform digital ekosistem pertanian perkotaan untuk transparansi,
                kolaborasi, dan pemberdayaan komunitas.
              </p>
            </div>

            {/* Portal Publik */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Portal Publik
              </h3>
              <ul className="mt-4 space-y-2.5">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} className="text-sm text-gray-600 transition-colors duration-200 hover:text-bs-hijau">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Program */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Program
              </h3>
              <ul className="mt-4 space-y-2.5">
                <li><span className="text-sm text-gray-600">Peta Lahan Perkotaan</span></li>
                <li><span className="text-sm text-gray-600">Produksi & Distribusi</span></li>
                <li><span className="text-sm text-gray-600">UMKM & Agrowisata</span></li>
                <li><span className="text-sm text-gray-600">Edukasi Komunitas</span></li>
              </ul>
            </div>

            {/* Instansi */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Instansi
              </h3>
              <ul className="mt-4 space-y-2.5">
                <li><span className="text-sm text-gray-600">Dinas Ketahanan Pangan & Pertanian</span></li>
                <li><span className="text-sm text-gray-600">Kota Bandung</span></li>
                <li><span className="text-sm text-gray-600">Jawa Barat, Indonesia</span></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-6 sm:flex-row">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} Buruan Sae 2.0 — Dinas Ketahanan Pangan & Pertanian Kota Bandung.
            </p>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-bs-hijau-50 px-3 py-1 text-xs font-medium text-bs-hijau-800">
                v2.0.0
              </span>
              <span className="text-xs text-gray-400">Didukung oleh IBBF</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
