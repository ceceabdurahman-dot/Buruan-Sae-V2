'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { formatRupiah, formatTanggal, cn } from '@/lib/utils';

// ============================================================
// Halaman Marketplace Admin — Web Admin Buruan Sae 2.0
// ============================================================

type Pesanan = {
  id: string;
  kode_pesanan: string;
  total_harga: number;
  status: string;
  pembeli: { nama_lengkap: string; nomor_wa: string };
  created_at: string;
  detail_pesanan: { produk: { nama: string }; jumlah: number; harga_satuan: number }[];
};

const STATUS_COLORS: Record<string, string> = {
  MENUNGGU_PEMBAYARAN: 'bg-yellow-50 text-yellow-700',
  DIBAYAR: 'bg-blue-50 text-blue-700',
  DIPROSES: 'bg-purple-50 text-purple-700',
  DIKIRIM: 'bg-indigo-50 text-indigo-700',
  SELESAI: 'bg-green-50 text-green-700',
  DIBATALKAN: 'bg-red-50 text-red-600',
};

const STATUS_LABELS: Record<string, string> = {
  MENUNGGU_PEMBAYARAN: 'Menunggu Bayar',
  DIBAYAR: 'Dibayar',
  DIPROSES: 'Diproses',
  DIKIRIM: 'Dikirim',
  SELESAI: 'Selesai',
  DIBATALKAN: 'Dibatalkan',
};

export default function MarketplacePage() {
  const [tab, setTab] = useState<'pesanan' | 'produk'>('pesanan');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: pesananData, isLoading: pesananLoading } = useQuery({
    queryKey: ['pesanan-admin', statusFilter, page],
    queryFn: () =>
      apiClient.get('/marketplace/pesanan', {
        params: { status: statusFilter || undefined, page, limit: 20, admin: true },
      }).then((r) => r.data.data),
    enabled: tab === 'pesanan',
  });

  const { data: produkData, isLoading: produkLoading } = useQuery({
    queryKey: ['produk-admin', page],
    queryFn: () =>
      apiClient.get('/marketplace/produk', { params: { page, limit: 20 } }).then((r) => r.data.data),
    enabled: tab === 'produk',
  });

  const pesanan: Pesanan[] = pesananData?.items ?? [];
  const produk: any[] = produkData?.items ?? [];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Marketplace</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manajemen produk & pesanan</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-5">
        {(['pesanan', 'produk'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t
                ? 'border-bs-hijau text-bs-hijau'
                : 'border-transparent text-gray-500 hover:text-gray-800',
            )}
          >
            {t === 'pesanan' ? '📦 Pesanan' : '🛍️ Produk'}
          </button>
        ))}
      </div>

      {/* Tab: Pesanan */}
      {tab === 'pesanan' && (
        <>
          <div className="flex gap-2 mb-4 flex-wrap">
            {['', 'MENUNGGU_PEMBAYARAN', 'DIBAYAR', 'DIPROSES', 'DIKIRIM', 'SELESAI'].map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={cn(
                  'px-3 py-1 text-xs rounded-full border transition-colors',
                  statusFilter === s
                    ? 'bg-bs-hijau text-white border-bs-hijau'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50',
                )}
              >
                {s === '' ? 'Semua' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Kode</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Pembeli</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Produk</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Total</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pesananLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                      ))}</tr>
                    ))
                  : pesanan.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">{p.kode_pesanan}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{p.pembeli.nama_lengkap}</p>
                          <p className="text-xs text-gray-400">{p.pembeli.nomor_wa}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {p.detail_pesanan.slice(0, 2).map((d, i) => (
                            <div key={i}>{d.produk.nama} ×{d.jumlah}</div>
                          ))}
                          {p.detail_pesanan.length > 2 && (
                            <div className="text-gray-400">+{p.detail_pesanan.length - 2} lainnya</div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{formatRupiah(p.total_harga)}</td>
                        <td className="px-4 py-3">
                          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-500')}>
                            {STATUS_LABELS[p.status] ?? p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{formatTanggal(p.created_at)}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Tab: Produk */}
      {tab === 'produk' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {produkLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                  <div className="h-32 bg-gray-100 rounded-lg mb-3" />
                  <div className="h-4 bg-gray-100 rounded mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              ))
            : produk.map((p) => (
                <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="h-32 bg-gray-100 rounded-lg mb-3 overflow-hidden">
                    {p.foto_url && (
                      <img src={p.foto_url} alt={p.nama} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <p className="font-medium text-gray-900 text-sm truncate">{p.nama}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.penjual?.nama_lengkap}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-bold text-bs-hijau">{formatRupiah(p.harga)}</span>
                    <span className="text-xs text-gray-400">Stok: {p.stok}</span>
                  </div>
                </div>
              ))}
        </div>
      )}
    </div>
  );
}
