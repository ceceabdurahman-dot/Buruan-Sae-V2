'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Filter, Loader2, MapPin, RefreshCcw } from 'lucide-react';

const LahanMap = dynamic(() => import('@/components/maps/LahanMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[420px] items-center justify-center bg-gray-50 text-sm text-gray-500">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Memuat peta...
    </div>
  ),
});

type PetaFeatureCollection = {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: {
      type: string;
      coordinates: number[][][];
    } | null;
    properties?: {
      id?: string;
      nama?: string;
      kecamatan?: string;
      kelurahan?: string;
      status?: string;
      luas_m2?: number;
    };
  }>;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

async function fetchPetaLahan(kecamatan: string) {
  const params = new URLSearchParams();
  if (kecamatan) params.set('kecamatan', kecamatan);

  const response = await fetch(`${API_BASE_URL}/lahan/peta?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Gagal memuat peta lahan (${response.status})`);
  }

  return response.json() as Promise<PetaFeatureCollection>;
}

export default function PetaLahanPublikPage() {
  const [kecamatan, setKecamatan] = useState('');
  const { data, error, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['peta-lahan-publik', kecamatan],
    queryFn: () => fetchPetaLahan(kecamatan),
  });

  const kecamatanOptions = useMemo(() => {
    const values = new Set<string>();
    data?.features.forEach((feature) => {
      if (feature.properties?.kecamatan) values.add(feature.properties.kecamatan);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const totalLahan = data?.features.length ?? 0;
  const totalGeometri = data?.features.filter((feature) => feature.geometry).length ?? 0;

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-bs-hijau transition-colors hover:text-bs-hijau-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Portal Publik
          </Link>

          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-bs-hijau">
                Modul Publik
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-normal text-gray-950 sm:text-4xl">
                Peta Lahan Publik
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-gray-600">
                Sebaran lahan aktif Buruan Sae berdasarkan data yang tersedia di sistem.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:w-auto">
              <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                <p className="text-xs font-medium text-gray-500">Lahan aktif</p>
                <p className="mt-1 text-2xl font-bold text-gray-950">{totalLahan}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                <p className="text-xs font-medium text-gray-500">Ber-geometri</p>
                <p className="mt-1 text-2xl font-bold text-gray-950">{totalGeometri}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 md:flex-row md:items-end md:justify-between">
          <label className="block md:min-w-72">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Filter className="h-4 w-4" aria-hidden="true" />
              Filter Kecamatan
            </span>
            <select
              value={kecamatan}
              onChange={(event) => setKecamatan(event.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-bs-hijau focus:ring-2 focus:ring-bs-hijau/20"
            >
              <option value="">Semua kecamatan</option>
              {kecamatanOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isFetching}
          >
            <RefreshCcw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} aria-hidden="true" />
            Muat ulang
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="h-[64vh] min-h-[420px] w-full">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengambil data peta...
              </div>
            ) : error ? (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <MapPin className="mb-3 h-8 w-8 text-red-500" aria-hidden="true" />
                <p className="text-sm font-semibold text-gray-900">Data peta belum dapat dimuat</p>
                <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
                  Pastikan backend berjalan di {API_BASE_URL}, lalu coba muat ulang.
                </p>
              </div>
            ) : (
              <LahanMap key={`${kecamatan}-${totalLahan}-${totalGeometri}`} geojson={data} />
            )}
          </div>
        </div>

        {!isLoading && !error && totalGeometri === 0 && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            Data lahan aktif tersedia, tetapi kolom geometri belum ada pada skema database saat ini.
            Peta akan menampilkan polygon setelah data geometri lahan ditambahkan.
          </div>
        )}
      </section>
    </main>
  );
}
