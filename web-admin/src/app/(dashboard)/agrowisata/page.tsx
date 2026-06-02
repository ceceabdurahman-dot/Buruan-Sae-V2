'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { formatRupiah, formatTanggal, cn } from '@/lib/utils';

// ============================================================
// Halaman Agrowisata Admin — Web Admin Buruan Sae 2.0
// ============================================================

export default function AgrowisataPage() {
  const { data: paketData, isLoading: paketLoading } = useQuery({
    queryKey: ['paket-wisata'],
    queryFn: () => apiClient.get('/agrowisata/paket', { params: { limit: 20 } }).then((r) => r.data.data),
  });

  const { data: bookingData, isLoading: bookingLoading } = useQuery({
    queryKey: ['booking-wisata'],
    queryFn: () =>
      apiClient.get('/agrowisata/booking', { params: { limit: 20, admin: true } }).then((r) => r.data.data),
  });

  const paket: any[] = paketData?.items ?? [];
  const booking: any[] = bookingData?.items ?? [];

  const STATUS_BOOKING: Record<string, { label: string; color: string }> = {
    MENUNGGU_KONFIRMASI: { label: 'Menunggu Konfirmasi', color: 'bg-yellow-50 text-yellow-700' },
    DIKONFIRMASI: { label: 'Dikonfirmasi', color: 'bg-blue-50 text-blue-700' },
    DIBAYAR: { label: 'Dibayar', color: 'bg-green-50 text-green-700' },
    SELESAI: { label: 'Selesai', color: 'bg-gray-100 text-gray-600' },
    DIBATALKAN: { label: 'Dibatalkan', color: 'bg-red-50 text-red-600' },
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Agrowisata</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manajemen paket wisata & booking</p>
      </div>

      {/* Paket Wisata */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">🌿 Paket Wisata ({paket.length})</h2>
          <button className="px-3 py-1.5 text-sm bg-bs-hijau text-white rounded-lg hover:bg-bs-hijau/90">
            + Tambah Paket
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paketLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                  <div className="h-32 bg-gray-100 rounded-lg mb-3" />
                  <div className="h-4 bg-gray-100 rounded mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              ))
            : paket.map((p) => (
                <div key={p.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="h-32 bg-gradient-to-br from-bs-hijau/20 to-bs-kuning/20 flex items-center justify-center">
                    {p.foto_url
                      ? <img src={p.foto_url} alt={p.nama} className="w-full h-full object-cover" />
                      : <span className="text-4xl">🌿</span>
                    }
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-gray-900 text-sm">{p.nama}</h3>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                        p.is_aktif ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500')}>
                        {p.is_aktif ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.deskripsi}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-bold text-bs-hijau text-sm">{formatRupiah(p.harga_per_orang)}/orang</span>
                      <span className="text-xs text-gray-400">Kapasitas: {p.kapasitas}</span>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </section>

      {/* Booking Terbaru */}
      <section>
        <h2 className="font-semibold text-gray-800 mb-4">📅 Booking Terbaru</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Pemesan</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Paket</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tanggal Kunjungan</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Peserta</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Total</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookingLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}</tr>
                  ))
                : booking.map((b) => {
                    const statusInfo = STATUS_BOOKING[b.status] ?? { label: b.status, color: 'bg-gray-100 text-gray-600' };
                    return (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{b.pengguna?.nama_lengkap}</p>
                          <p className="text-xs text-gray-400">{b.pengguna?.nomor_wa}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{b.paket?.nama}</td>
                        <td className="px-4 py-3 text-gray-600">{formatTanggal(b.tanggal_kunjungan)}</td>
                        <td className="px-4 py-3 text-center text-gray-700">{b.jumlah_peserta}</td>
                        <td className="px-4 py-3 font-semibold">{formatRupiah(b.total_harga)}</td>
                        <td className="px-4 py-3">
                          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', statusInfo.color)}>
                            {statusInfo.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
