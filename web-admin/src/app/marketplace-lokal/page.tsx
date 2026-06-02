'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Loader2,
  PackageSearch,
  RefreshCcw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

type ProdukMarketplace = {
  id: string;
  nama: string;
  deskripsi?: string | null;
  kategori: string;
  harga: number;
  stok: number;
  satuan: string;
  foto_url?: string | null;
  penjual?: {
    nama_lengkap?: string;
    nama?: string;
    kecamatan?: string | null;
    kelurahan?: string | null;
  };
};

type ProdukResponse = {
  data: ProdukMarketplace[];
  items?: ProdukMarketplace[];
  total: number;
  page: number;
  limit: number;
  totalHalaman: number;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

async function fetchProduk(params: { search: string; kategori: string; sort: string }) {
  const query = new URLSearchParams({
    page: '1',
    limit: '24',
    sort: params.sort,
  });
  if (params.search) query.set('search', params.search);
  if (params.kategori) query.set('kategori', params.kategori);

  const response = await fetch(`${API_BASE_URL}/marketplace/produk?${query.toString()}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Gagal memuat marketplace (${response.status})`);
  }

  return response.json() as Promise<ProdukResponse>;
}

export default function MarketplaceLokalPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [kategori, setKategori] = useState('');
  const [sort, setSort] = useState('terbaru');

  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['marketplace-lokal', search, kategori, sort],
    queryFn: () => fetchProduk({ search, kategori, sort }),
  });

  const produk = data?.data ?? data?.items ?? [];
  const kategoriOptions = useMemo(() => {
    const values = new Set(produk.map((item) => item.kategori).filter(Boolean));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [produk]);

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
                Marketplace Lokal
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-gray-600">
                Katalog produk segar dan olahan dari komunitas, petani, dan UMKM Buruan Sae.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
              <p className="text-xs font-medium text-gray-500">Produk tersedia</p>
              <p className="mt-1 text-2xl font-bold text-gray-950">{data?.total ?? produk.length}</p>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px_auto] lg:items-end">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Search className="h-4 w-4" aria-hidden="true" />
                Cari Produk
              </span>
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') setSearch(searchInput.trim());
                }}
                placeholder="Sayur, buah, olahan..."
                className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-bs-hijau focus:ring-2 focus:ring-bs-hijau/20"
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
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
                Urutkan
              </span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-bs-hijau focus:ring-2 focus:ring-bs-hijau/20"
              >
                <option value="terbaru">Terbaru</option>
                <option value="harga_asc">Harga terendah</option>
                <option value="harga_desc">Harga tertinggi</option>
                <option value="populer">Populer</option>
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
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="h-36 animate-pulse rounded-lg bg-gray-100" />
                <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-gray-100" />
                <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mt-6 flex min-h-80 flex-col items-center justify-center rounded-lg border border-gray-200 bg-white px-6 text-center">
            <PackageSearch className="mb-3 h-9 w-9 text-red-500" aria-hidden="true" />
            <p className="text-sm font-semibold text-gray-900">Data marketplace belum dapat dimuat</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
              Pastikan backend berjalan di {API_BASE_URL}, lalu muat ulang halaman.
            </p>
          </div>
        ) : produk.length === 0 ? (
          <div className="mt-6 flex min-h-80 flex-col items-center justify-center rounded-lg border border-gray-200 bg-white px-6 text-center">
            <PackageSearch className="mb-3 h-9 w-9 text-bs-hijau" aria-hidden="true" />
            <p className="text-sm font-semibold text-gray-900">Belum ada produk aktif</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
              Produk akan tampil setelah petani atau UMKM menambahkan stok aktif di dashboard.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {produk.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="flex h-40 items-center justify-center bg-bs-hijau-50">
                  {item.foto_url ? (
                    <img src={item.foto_url} alt={item.nama} className="h-full w-full object-cover" />
                  ) : (
                    <ShoppingBag className="h-10 w-10 text-bs-hijau" aria-hidden="true" />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="line-clamp-2 text-base font-semibold text-gray-950">{item.nama}</h2>
                    <span className="shrink-0 rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-600">
                      {item.kategori}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    {item.penjual?.nama_lengkap ?? item.penjual?.nama ?? 'Penjual lokal'}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {[item.penjual?.kelurahan, item.penjual?.kecamatan].filter(Boolean).join(', ') || 'Kota Bandung'}
                  </p>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold text-bs-hijau">{formatRupiah(item.harga)}</p>
                      <p className="text-xs text-gray-500">per {item.satuan}</p>
                    </div>
                    <p className="rounded-lg bg-bs-hijau-50 px-2 py-1 text-xs font-medium text-bs-hijau-800">
                      Stok {item.stok}
                    </p>
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
