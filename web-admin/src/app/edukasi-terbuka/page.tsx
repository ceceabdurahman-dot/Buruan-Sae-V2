'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  GraduationCap,
  Layers,
  Loader2,
  RefreshCcw,
  Search,
  SlidersHorizontal,
} from 'lucide-react';

type Kursus = {
  id: string;
  judul: string;
  deskripsi?: string | null;
  kategori: string;
  level: string;
  durasi_menit: number;
  foto_cover?: string | null;
  foto_cover_url?: string | null;
  is_gratis?: boolean;
  _count?: {
    modul?: number;
    progres?: number;
  };
};

type KursusResponse = {
  data: Kursus[];
  items?: Kursus[];
  total: number;
  page: number;
  limit: number;
  totalHalaman?: number;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

async function fetchKursus(params: { search: string; kategori: string; level: string }) {
  const query = new URLSearchParams({
    page: '1',
    limit: '30',
  });
  if (params.kategori) query.set('kategori', params.kategori);
  if (params.level) query.set('level', params.level);

  const response = await fetch(`${API_BASE_URL}/edukasi/kursus?${query.toString()}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Gagal memuat edukasi (${response.status})`);
  }

  const result = await response.json() as KursusResponse;
  if (!params.search) return result;

  const needle = params.search.toLowerCase();
  const data = (result.data ?? result.items ?? []).filter((item) =>
    `${item.judul} ${item.deskripsi ?? ''}`.toLowerCase().includes(needle),
  );
  return { ...result, data, items: data, total: data.length };
}

export default function EdukasiTerbukaPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [kategori, setKategori] = useState('');
  const [level, setLevel] = useState('');

  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['edukasi-terbuka', search, kategori, level],
    queryFn: () => fetchKursus({ search, kategori, level }),
  });

  const kursus = useMemo(() => data?.data ?? data?.items ?? [], [data]);
  const kategoriOptions = useMemo(() => {
    const values = new Set(kursus.map((item) => item.kategori).filter(Boolean));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [kursus]);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-bs-hijau transition hover:text-bs-hijau-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Portal Publik
          </Link>

          <div className="mt-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-bs-hijau">
                Modul Publik
              </p>
              <h1 className="mt-2 text-3xl font-bold text-gray-950 sm:text-4xl">
                Edukasi Terbuka
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-gray-600">
                Materi belajar urban farming, budidaya, pengolahan, teknologi, dan pemasaran
                yang dapat diakses masyarakat secara terbuka.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
              <p className="text-xs font-medium text-gray-500">Kursus aktif</p>
              <p className="mt-1 text-2xl font-bold text-gray-950">{data?.total ?? kursus.length}</p>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_180px_auto] lg:items-end">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Search className="h-4 w-4" aria-hidden="true" />
                Cari Materi
              </span>
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') setSearch(searchInput.trim());
                }}
                placeholder="Budidaya, hidroponik, pemasaran..."
                className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-bs-hijau focus:ring-2 focus:ring-bs-hijau/20"
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                Kategori
              </span>
              <select
                value={kategori}
                onChange={(event) => setKategori(event.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-bs-hijau focus:ring-2 focus:ring-bs-hijau/20"
              >
                <option value="">Semua kategori</option>
                {kategoriOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                Level
              </span>
              <select
                value={level}
                onChange={(event) => setLevel(event.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-bs-hijau focus:ring-2 focus:ring-bs-hijau/20"
              >
                <option value="">Semua level</option>
                <option value="PEMULA">Pemula</option>
                <option value="MENENGAH">Menengah</option>
                <option value="MAHIR">Mahir</option>
              </select>
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSearch(searchInput.trim())}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-lg bg-bs-hijau px-4 text-sm font-semibold text-white transition hover:bg-bs-hijau-900 lg:flex-none"
              >
                Cari
              </button>
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                aria-label="Muat ulang"
              >
                <RefreshCcw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-lg border border-gray-200 bg-white p-5">
                <div className="h-5 w-2/3 animate-pulse rounded bg-gray-100" />
                <div className="mt-3 h-4 w-full animate-pulse rounded bg-gray-100" />
                <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mt-6 flex min-h-80 flex-col items-center justify-center rounded-lg border border-gray-200 bg-white px-6 text-center">
            <GraduationCap className="mb-3 h-9 w-9 text-red-500" aria-hidden="true" />
            <p className="text-sm font-semibold text-gray-900">Data edukasi belum dapat dimuat</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
              Pastikan backend berjalan di {API_BASE_URL}, lalu muat ulang halaman.
            </p>
          </div>
        ) : kursus.length === 0 ? (
          <div className="mt-6 flex min-h-80 flex-col items-center justify-center rounded-lg border border-gray-200 bg-white px-6 text-center">
            <BookOpen className="mb-3 h-9 w-9 text-bs-hijau" aria-hidden="true" />
            <p className="text-sm font-semibold text-gray-900">Belum ada kursus aktif</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
              Materi edukasi akan tampil setelah admin mempublikasikan kursus aktif.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {kursus.map((item) => (
              <article key={item.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-bs-hijau-50 text-bs-hijau">
                    <BookOpen className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                    {item.level}
                  </span>
                </div>

                <h2 className="mt-5 text-lg font-semibold leading-snug text-gray-950">{item.judul}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">
                  {item.deskripsi ?? 'Materi edukasi urban farming Buruan Sae.'}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600">
                  <span className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-bs-hijau" aria-hidden="true" />
                    {item._count?.modul ?? 0} modul
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-bs-hijau" aria-hidden="true" />
                    {item.durasi_menit} menit
                  </span>
                </div>

                <div className="mt-5 flex items-end justify-between gap-3 border-t border-gray-100 pt-4">
                  <div>
                    <p className="text-xs text-gray-500">Kategori</p>
                    <p className="mt-1 text-sm font-semibold text-gray-800">{item.kategori}</p>
                  </div>
                  <Link
                    href="/auth/login"
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-bs-hijau px-4 text-sm font-semibold text-white transition hover:bg-bs-hijau-900"
                  >
                    Mulai
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
