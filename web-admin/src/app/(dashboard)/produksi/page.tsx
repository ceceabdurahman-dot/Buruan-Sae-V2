'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { apiClient } from '@/lib/api-client';
import { formatAngka, formatTanggal, cn } from '@/lib/utils';

// ============================================================
// Halaman Monitoring Produksi — Web Admin Buruan Sae 2.0
// ============================================================

const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
const COLORS = ['#2D7D32','#F9A825','#1565C0','#AD1457','#6A1B9A','#00838F'];

export default function ProduksiPage() {
  const currentYear = new Date().getFullYear();
  const [tahun, setTahun] = useState(currentYear);
  const [kecamatan, setKecamatan] = useState('');

  // Ringkasan produksi per bulan per kecamatan
  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['produksi-chart', tahun, kecamatan],
    queryFn: () =>
      apiClient.get('/dashboard/produksi-per-kecamatan', {
        params: { tahun, kecamatan: kecamatan || undefined },
      }).then((r) => r.data.data),
  });

  // Top petani bulan ini
  const { data: topPetani } = useQuery({
    queryKey: ['top-petani'],
    queryFn: () => apiClient.get('/dashboard/top-petani').then((r) => r.data.data),
  });

  // Catatan panen terbaru
  const { data: catatanTerbaru, isLoading: catatanLoading } = useQuery({
    queryKey: ['catatan-panen-terbaru', tahun],
    queryFn: () =>
      apiClient.get('/produksi/catatan', {
        params: { limit: 15, tahun },
      }).then((r) => r.data.data),
  });

  // Transformasi data untuk Recharts
  const barData = BULAN.map((bulan, idx) => {
    const bulanData: Record<string, any> = { bulan };
    if (chartData) {
      for (const item of chartData) {
        if (item.bulan === idx + 1) {
          bulanData[item.kecamatan] = (bulanData[item.kecamatan] ?? 0) + item.total_kg;
        }
      }
    }
    return bulanData;
  });

  const kecamatanList: string[] = chartData
    ? [...new Set<string>(chartData.map((d: any) => d.kecamatan))]
    : [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Monitoring Produksi</h1>
          <p className="text-sm text-gray-500 mt-0.5">Data panen urban farming Kota Bandung</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={tahun}
            onChange={(e) => setTahun(Number(e.target.value))}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bs-hijau/40"
          >
            {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart Produksi per Kecamatan */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Produksi per Kecamatan (kg)</h2>
          <select
            value={kecamatan}
            onChange={(e) => setKecamatan(e.target.value)}
            className="text-xs px-2 py-1.5 border border-gray-300 rounded-lg"
          >
            <option value="">Semua Kecamatan</option>
            {kecamatanList.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
        {chartLoading ? (
          <div className="h-64 bg-gray-50 rounded-lg animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => `${formatAngka(v)} kg`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {kecamatanList.slice(0, 6).map((k, i) => (
                <Bar key={k} dataKey={k} stackId="a" fill={COLORS[i % COLORS.length]} radius={i === 0 ? [0,0,3,3] : [0,0,0,0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Petani */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">🏆 Top Petani Bulan Ini</h2>
          <div className="space-y-3">
            {(topPetani ?? []).slice(0, 8).map((p: any, i: number) => (
              <div key={p.pengguna_id} className="flex items-center gap-3">
                <span className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                  i === 0 ? 'bg-yellow-400 text-white' :
                  i === 1 ? 'bg-gray-300 text-gray-700' :
                  i === 2 ? 'bg-orange-400 text-white' :
                  'bg-gray-100 text-gray-500',
                )}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.nama_lengkap}</p>
                  <p className="text-xs text-gray-400">{p.kecamatan}</p>
                </div>
                <span className="text-sm font-semibold text-bs-hijau whitespace-nowrap">
                  {formatAngka(p.total_kg)} kg
                </span>
              </div>
            ))}
            {!topPetani && (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 bg-gray-50 rounded-lg animate-pulse" />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Catatan Panen Terbaru */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">📋 Catatan Panen Terbaru</h2>
          <div className="space-y-2">
            {catatanLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />
                ))
              : (catatanTerbaru?.items ?? []).map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.komoditas.nama}</p>
                      <p className="text-xs text-gray-400">
                        {c.pengguna?.nama_lengkap} · {c.lahan?.nama}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-bs-hijau">{formatAngka(c.jumlah_kg)} kg</p>
                      <p className="text-xs text-gray-400">{formatTanggal(c.tanggal_panen)}</p>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}
