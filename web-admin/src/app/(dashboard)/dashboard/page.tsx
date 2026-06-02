'use client';

import { useQuery } from '@tanstack/react-query';
import { Users, Sprout, ShoppingBag, TrendingUp, MapPin, BookOpen } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

import { apiClient } from '@/lib/api-client';
import { formatRupiah, formatAngka } from '@/lib/utils';

// ============================================================
// Halaman Dashboard Utama — Web Admin
// ============================================================

const BULAN_INDO = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

export default function DashboardPage() {
  const { data: kpi, isLoading: loadingKpi } = useQuery({
    queryKey: ['dashboard-kpi'],
    queryFn: () => apiClient.get('/dashboard/kpi').then((r) => r.data),
    refetchInterval: 5 * 60 * 1000, // refresh 5 menit
  });

  const { data: produksiChart } = useQuery({
    queryKey: ['dashboard-produksi', new Date().getFullYear()],
    queryFn: () =>
      apiClient.get('/dashboard/produksi-per-kecamatan', {
        params: { tahun: new Date().getFullYear() },
      }).then((r) => r.data),
  });

  const { data: topPetani } = useQuery({
    queryKey: ['dashboard-top-petani'],
    queryFn: () => apiClient.get('/dashboard/top-petani').then((r) => r.data),
  });

  const { data: distribusiLahan } = useQuery({
    queryKey: ['dashboard-distribusi'],
    queryFn: () => apiClient.get('/dashboard/distribusi-lahan').then((r) => r.data),
  });

  if (loadingKpi) return <DashboardSkeleton />;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Program Buruan Sae 2.0 — Kota Bandung | Bulan: {kpi?.bulan ?? '-'}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Petani"
          value={formatAngka(kpi?.total_petani ?? 0)}
          icon={<Users className="w-5 h-5" />}
          color="bg-green-50 text-green-700"
        />
        <KpiCard
          label="Total Lahan"
          value={`${formatAngka(kpi?.total_lahan ?? 0)} lahan`}
          icon={<MapPin className="w-5 h-5" />}
          color="bg-blue-50 text-blue-700"
          sub={`${formatAngka(Math.round(kpi?.total_lahan_m2 ?? 0))} m²`}
        />
        <KpiCard
          label="Produksi Bulan Ini"
          value={`${formatAngka(Math.round(kpi?.total_produksi_kg ?? 0))} kg`}
          icon={<Sprout className="w-5 h-5" />}
          color="bg-emerald-50 text-emerald-700"
        />
        <KpiCard
          label="Pendapatan"
          value={formatRupiah(kpi?.total_pendapatan ?? 0)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="bg-yellow-50 text-yellow-700"
          sub={`${formatAngka(kpi?.total_pesanan ?? 0)} pesanan`}
        />
        <KpiCard
          label="Pengguna Aktif (MAU)"
          value={formatAngka(kpi?.mau ?? 0)}
          icon={<Users className="w-5 h-5" />}
          color="bg-purple-50 text-purple-700"
        />
        <KpiCard
          label="Booking Wisata"
          value={formatAngka(kpi?.total_booking ?? 0)}
          icon={<ShoppingBag className="w-5 h-5" />}
          color="bg-orange-50 text-orange-700"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grafik Produksi per Bulan */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Produksi per Bulan (kg)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={(() => {
                if (!produksiChart?.data) return [];
                const perBulan: Record<number, number> = {};
                for (const row of produksiChart.data) {
                  perBulan[row.bulan] = (perBulan[row.bulan] ?? 0) + row.total_kg;
                }
                return Array.from({ length: 12 }, (_, i) => ({
                  bulan: BULAN_INDO[i],
                  total: perBulan[i + 1] ?? 0,
                }));
              })()}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="bulan" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(val) => [`${formatAngka(Number(val))} kg`, 'Total']} />
              <Bar dataKey="total" fill="#4CAF50" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribusi Lahan per Kecamatan */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Distribusi Lahan per Kecamatan</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={distribusiLahan ?? []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="kecamatan" type="category" width={100} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="total_lahan" fill="#2D7D32" name="Lahan" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Petani */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-4">Top 10 Petani — Total Panen Terbesar</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 font-medium text-gray-600">#</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">Nama Petani</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">Kecamatan</th>
                <th className="text-right py-2 px-3 font-medium text-gray-600">Total Panen</th>
                <th className="text-right py-2 px-3 font-medium text-gray-600">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {(topPetani ?? []).map((p: any, i: number) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 px-3 text-gray-500">{i + 1}</td>
                  <td className="py-2.5 px-3 font-medium">{p.nama}</td>
                  <td className="py-2.5 px-3 text-gray-600">{p.kecamatan ?? '-'}</td>
                  <td className="py-2.5 px-3 text-right text-green-700 font-medium">
                    {formatAngka(Math.round(p.total_panen))} kg
                  </td>
                  <td className="py-2.5 px-3 text-right text-gray-500">{p.total_catatan}</td>
                </tr>
              ))}
              {!topPetani?.length && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">Belum ada data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Komponen KPI Card
// ============================================================

function KpiCard({
  label, value, icon, color, sub,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 truncate">{label}</p>
          <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
          {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Skeleton Loading
// ============================================================

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 bg-gray-100 rounded-2xl" />
        <div className="h-72 bg-gray-100 rounded-2xl" />
      </div>
    </div>
  );
}
