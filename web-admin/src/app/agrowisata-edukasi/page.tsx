'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Loader2,
  MapPin,
  RefreshCcw,
  Search,
  Sprout,
  Users,
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

type PaketWisata = {
  id: string;
  nama: string;
  deskripsi?: string | null;
  harga: number;
  harga_per_orang?: number;
  durasi_jam: number;
  kapasitas: number;
  kapasitas_max?: number;
  foto_url?: string | null;
  lokasi?: string;
};

type PaketResponse = {
  data: PaketWisata[];
  items?: PaketWisata[];
  total: number;
  page: number;
  limit: number;
  totalHalaman?: number;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

async function fetchPaket(search: string) {
  const response = await fetch(`${API_BASE_URL}/agrowisata/paket?page=1&limit=24`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Gagal memuat agrowisata (${response.status})`);
  }

  const result = await response.json() as PaketResponse;
  if (!search) return result;

  const needle = search.toLowerCase();
  const data = (result.data ?? result.items ?? []).filter((item) =>
    `${item.nama} ${item.deskripsi ?? ''}`.toLowerCase().includes(needle),
  );
  return { ...result, data, items: data, total: data.length };
}

export default function AgrowisataEdukasiPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['agrowisata-edukasi', search],
    queryFn: () => fetchPaket(search),
  });

  const paket = useMemo(() => data?.data ?? data?.items ?? [], [data]);

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
                Agrowisata Edukasi
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-gray-600">
                Paket kunjungan kebun, pembelajaran urban farming, dan pengalaman lapangan
                untuk masyarakat, sekolah, komunitas, dan mitra kota.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
              <p className="text-xs font-medium text-gray-500">Paket aktif</p>
              <p className="mt-1 text-2xl font-bold text-gray-950">{data?.total ?? paket.length}</p>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <label className="block flex-1">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Search className="h-4 w-4" aria-hidden="true" />
                Cari Paket
              </span>
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') setSearch(searchInput.trim());
                }}
                placeholder="Kebun edukasi, hidroponik, kompos..."
                className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-bs-hijau focus:ring-2 focus:ring-bs-hijau/20"
              />
            </label>
            <button
              type="button"
              onClick={() => setSearch(searchInput.trim())}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-bs-hijau px-5 text-sm font-semibold text-white transition hover:bg-bs-hijau-900"
            >
              Cari
            </button>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
            >
              <RefreshCcw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
              Muat ulang
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="h-40 animate-pulse rounded-lg bg-gray-100" />
                <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-gray-100" />
                <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mt-6 flex min-h-80 flex-col items-center justify-center rounded-lg border border-gray-200 bg-white px-6 text-center">
            <Sprout className="mb-3 h-9 w-9 text-red-500" aria-hidden="true" />
            <p className="text-sm font-semibold text-gray-900">Data agrowisata belum dapat dimuat</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
              Pastikan backend berjalan di {API_BASE_URL}, lalu muat ulang halaman.
            </p>
          </div>
        ) : paket.length === 0 ? (
          <div className="mt-6 flex min-h-80 flex-col items-center justify-center rounded-lg border border-gray-200 bg-white px-6 text-center">
            <CalendarDays className="mb-3 h-9 w-9 text-bs-hijau" aria-hidden="true" />
            <p className="text-sm font-semibold text-gray-900">Belum ada paket aktif</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
              Paket agrowisata akan tampil setelah pengelola menambahkan paket aktif di dashboard.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paket.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="flex h-44 items-center justify-center bg-bs-hijau-50">
                  {item.foto_url ? (
                    <img src={item.foto_url} alt={item.nama} className="h-full w-full object-cover" />
                  ) : (
                    <Sprout className="h-12 w-12 text-bs-hijau" aria-hidden="true" />
                  )}
                </div>
                <div className="p-5">
                  <h2 className="text-lg font-semibold text-gray-950">{item.nama}</h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">
                    {item.deskripsi ?? 'Paket edukasi urban farming Buruan Sae Kota Bandung.'}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-bs-hijau" aria-hidden="true" />
                      {item.durasi_jam} jam
                    </span>
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-bs-hijau" aria-hidden="true" />
                      {item.kapasitas_max ?? item.kapasitas} peserta
                    </span>
                    <span className="col-span-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-bs-hijau" aria-hidden="true" />
                      {item.lokasi ?? 'Kota Bandung'}
                    </span>
                  </div>

                  <div className="mt-5 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold text-bs-hijau">
                        {formatRupiah(item.harga_per_orang ?? item.harga)}
                      </p>
                      <p className="text-xs text-gray-500">per peserta</p>
                    </div>
                    <Link
                      href="/auth/login"
                      className="inline-flex h-10 items-center justify-center rounded-lg bg-bs-hijau px-4 text-sm font-semibold text-white transition hover:bg-bs-hijau-900"
                    >
                      Booking
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
