'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { apiClient } from '@/lib/api-client';
import { formatTanggal, formatLuas, cn } from '@/lib/utils';

// ============================================================
// Halaman Manajemen Lahan — Web Admin Buruan Sae 2.0
// ============================================================

// Leaflet hanya boleh di-render di client (no SSR)
const LahanMap = dynamic(() => import('@/components/maps/LahanMap'), { ssr: false });

type Lahan = {
  id: string;
  nama: string;
  kecamatan: string;
  kelurahan: string;
  luas_m2: number;
  status: 'DALAM_REVIEW' | 'AKTIF' | 'DITOLAK' | 'TIDAK_AKTIF';
  pemilik: { nama_lengkap: string; nomor_wa: string };
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  DALAM_REVIEW: 'bg-yellow-50 text-yellow-700',
  AKTIF: 'bg-green-50 text-green-700',
  DITOLAK: 'bg-red-50 text-red-600',
  TIDAK_AKTIF: 'bg-gray-100 text-gray-500',
};

const STATUS_LABELS: Record<string, string> = {
  DALAM_REVIEW: 'Review',
  AKTIF: 'Aktif',
  DITOLAK: 'Ditolak',
  TIDAK_AKTIF: 'Tidak Aktif',
};

export default function LahanPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<'list' | 'map'>('list');
  const [statusFilter, setStatusFilter] = useState('DALAM_REVIEW');
  const [page, setPage] = useState(1);
  const [selectedLahan, setSelectedLahan] = useState<Lahan | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['lahan-admin', statusFilter, page],
    queryFn: () =>
      apiClient.get('/lahan', {
        params: { status: statusFilter || undefined, page, limit: 20 },
      }).then((r) => r.data.data),
  });

  const { data: petaData } = useQuery({
    queryKey: ['lahan-peta'],
    queryFn: () => apiClient.get('/lahan/peta').then((r) => r.data.data),
    enabled: view === 'map',
  });

  const verifikasiMutation = useMutation({
    mutationFn: ({ id, status, catatan }: { id: string; status: string; catatan?: string }) =>
      apiClient.post(`/lahan/${id}/verifikasi`, { status, catatan }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lahan-admin'] });
      setSelectedLahan(null);
    },
  });

  const lahanList: Lahan[] = data?.items ?? [];
  const total: number = data?.total ?? 0;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Manajemen Lahan</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total.toLocaleString('id')} lahan terdaftar</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView('list')}
            className={cn('px-3 py-1.5 text-sm rounded-lg border transition-colors',
              view === 'list' ? 'bg-bs-hijau text-white border-bs-hijau' : 'border-gray-300 text-gray-600 hover:bg-gray-50')}
          >
            📋 Daftar
          </button>
          <button
            onClick={() => setView('map')}
            className={cn('px-3 py-1.5 text-sm rounded-lg border transition-colors',
              view === 'map' ? 'bg-bs-hijau text-white border-bs-hijau' : 'border-gray-300 text-gray-600 hover:bg-gray-50')}
          >
            🗺️ Peta
          </button>
        </div>
      </div>

      {/* Filter status */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { value: '', label: 'Semua' },
          { value: 'DALAM_REVIEW', label: 'Perlu Review' },
          { value: 'AKTIF', label: 'Aktif' },
          { value: 'DITOLAK', label: 'Ditolak' },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setStatusFilter(opt.value); setPage(1); }}
            className={cn(
              'px-3 py-1.5 text-xs rounded-full border transition-colors',
              statusFilter === opt.value
                ? 'bg-bs-hijau text-white border-bs-hijau'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Map View */}
      {view === 'map' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden h-[500px]">
          {petaData && <LahanMap geojson={petaData} />}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Lahan</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Pemilik</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Lokasi</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Luas</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Didaftarkan</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 bg-gray-100 rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : lahanList.map((l) => (
                      <tr key={l.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{l.nama}</td>
                        <td className="px-4 py-3 text-gray-600">
                          <div>{l.pemilik.nama_lengkap}</div>
                          <div className="text-xs text-gray-400">{l.pemilik.nomor_wa}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {l.kelurahan}, {l.kecamatan}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{formatLuas(l.luas_m2)}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-xs font-medium',
                            STATUS_COLORS[l.status],
                          )}>
                            {STATUS_LABELS[l.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {formatTanggal(l.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          {l.status === 'DALAM_REVIEW' && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => verifikasiMutation.mutate({ id: l.id, status: 'AKTIF' })}
                                className="text-xs px-2 py-1 rounded-md bg-green-50 text-green-700 hover:bg-green-100"
                              >
                                ✓ Setujui
                              </button>
                              <button
                                onClick={() => verifikasiMutation.mutate({ id: l.id, status: 'DITOLAK' })}
                                className="text-xs px-2 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100"
                              >
                                ✗ Tolak
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {Math.ceil(total / 20) > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">Halaman {page}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50">
                  ← Prev
                </button>
                <button onClick={() => setPage((p) => p + 1)} disabled={lahanList.length < 20}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-50">
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
