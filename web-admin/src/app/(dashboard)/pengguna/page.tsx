'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { formatTanggal, labelStatus, warnaStatus, cn } from '@/lib/utils';

// ============================================================
// Halaman Manajemen Pengguna — Web Admin Buruan Sae 2.0
// ============================================================

type Pengguna = {
  id: string;
  nama_lengkap: string;
  nomor_wa: string;
  email: string | null;
  peran: string;
  kecamatan: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
};

const PERAN_OPTIONS = [
  { value: '', label: 'Semua Peran' },
  { value: 'PETANI', label: 'Petani' },
  { value: 'KADER_KELURAHAN', label: 'Kader Kelurahan' },
  { value: 'KONSUMEN', label: 'Konsumen' },
  { value: 'UMKM', label: 'UMKM' },
  { value: 'PENGELOLA_WISATA', label: 'Pengelola Wisata' },
  { value: 'KOORDINATOR_KECAMATAN', label: 'Koordinator Kecamatan' },
  { value: 'ADMIN_DINAS', label: 'Admin Dinas' },
];

export default function PenggunaPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [peranFilter, setPeranFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['pengguna', search, peranFilter, page],
    queryFn: () =>
      apiClient.get('/pengguna', {
        params: { search, peran: peranFilter || undefined, page, limit: 20 },
      }).then((r) => r.data.data),
    staleTime: 30_000,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      apiClient.patch(`/pengguna/${id}/status`, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pengguna'] }),
  });

  const pengguna: Pengguna[] = data?.items ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Manajemen Pengguna</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Total {total.toLocaleString('id')} pengguna terdaftar
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Cari nama, nomor WA, email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-48 px-3 py-2 text-sm border border-gray-300 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-bs-hijau/40"
        />
        <select
          value={peranFilter}
          onChange={(e) => { setPeranFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bs-hijau/40"
        >
          {PERAN_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nama</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Kontak</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Peran</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Kecamatan</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Bergabung</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : pengguna.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    Tidak ada pengguna ditemukan
                  </td>
                </tr>
              ) : (
                pengguna.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-bs-hijau/15 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-bs-hijau">
                            {p.nama_lengkap[0]}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">{p.nama_lengkap}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div>{p.nomor_wa}</div>
                      {p.email && <div className="text-xs text-gray-400">{p.email}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {p.peran.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.kecamatan ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={cn(
                          'inline-flex px-2 py-0.5 rounded-full text-xs font-medium w-fit',
                          p.is_active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600',
                        )}>
                          {p.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                        {!p.is_verified && (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-yellow-50 text-yellow-700 w-fit">
                            Belum verif
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {formatTanggal(p.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStatusMutation.mutate({
                          id: p.id,
                          is_active: !p.is_active,
                        })}
                        className={cn(
                          'text-xs px-2 py-1 rounded-md transition-colors',
                          p.is_active
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-green-600 hover:bg-green-50',
                        )}
                      >
                        {p.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Halaman {page} dari {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-md disabled:opacity-40
                           hover:bg-gray-50 transition-colors"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-md disabled:opacity-40
                           hover:bg-gray-50 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
