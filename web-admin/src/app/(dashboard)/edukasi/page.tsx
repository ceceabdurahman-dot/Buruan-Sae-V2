'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { formatTanggal, cn } from '@/lib/utils';

// ============================================================
// Halaman Edukasi Admin — Web Admin Buruan Sae 2.0
// ============================================================

export default function EdukasiPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['kursus-admin', search],
    queryFn: () =>
      apiClient.get('/edukasi/kursus', { params: { search: search || undefined, limit: 30 } })
        .then((r) => r.data.data),
  });

  const kursus: any[] = data?.items ?? [];

  const LEVEL_COLORS: Record<string, string> = {
    PEMULA: 'bg-green-50 text-green-700',
    MENENGAH: 'bg-yellow-50 text-yellow-700',
    LANJUTAN: 'bg-red-50 text-red-600',
  };

  const KATEGORI_ICON: Record<string, string> = {
    DASAR: '🌱',
    TEKNIK: '🔧',
    BISNIS: '💼',
    KESEHATAN: '🍃',
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Konten Edukasi</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data?.total ?? 0} kursus tersedia</p>
        </div>
        <button className="px-4 py-2 bg-bs-hijau text-white text-sm rounded-lg hover:bg-bs-hijau/90 transition-colors">
          + Tambah Kursus
        </button>
      </div>

      <input
        type="text"
        placeholder="Cari kursus..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm px-3 py-2 text-sm border border-gray-300 rounded-lg mb-4
                   focus:outline-none focus:ring-2 focus:ring-bs-hijau/40"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-100 rounded mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))
          : kursus.map((k) => (
              <div key={k.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{KATEGORI_ICON[k.kategori] ?? '📚'}</span>
                  <div className="flex gap-2">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', LEVEL_COLORS[k.level] ?? 'bg-gray-100 text-gray-600')}>
                      {k.level}
                    </span>
                    {!k.is_published && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Draft</span>
                    )}
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-1">{k.judul}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{k.deskripsi}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>📖 {k._count?.modul ?? 0} modul</span>
                  <span>⏱️ {k.durasi_menit} menit</span>
                  <span>👥 {k._count?.progres ?? 0} peserta</span>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                  <button className="flex-1 text-xs py-1.5 rounded-md bg-bs-hijau/10 text-bs-hijau hover:bg-bs-hijau/20 transition-colors">
                    ✏️ Edit
                  </button>
                  <button className="text-xs px-3 py-1.5 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                    {k.is_published ? '📤 Unpublish' : '✅ Publish'}
                  </button>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
