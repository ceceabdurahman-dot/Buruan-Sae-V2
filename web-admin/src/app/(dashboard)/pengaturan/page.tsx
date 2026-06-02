'use client';

import { useSession } from 'next-auth/react';
import { Shield, User, Bell, Key, Database } from 'lucide-react';

// ============================================================
// Halaman Pengaturan — Web Admin Buruan Sae 2.0
// ============================================================

const SETTING_SECTIONS = [
  {
    icon: User,
    title: 'Profil Admin',
    description: 'Kelola informasi akun dan profil administrator.',
    label: 'Segera Hadir',
    disabled: true,
  },
  {
    icon: Key,
    title: 'Keamanan & Password',
    description: 'Ubah password dan atur autentikasi dua faktor.',
    label: 'Segera Hadir',
    disabled: true,
  },
  {
    icon: Bell,
    title: 'Notifikasi',
    description: 'Atur preferensi notifikasi email dan sistem.',
    label: 'Segera Hadir',
    disabled: true,
  },
  {
    icon: Database,
    title: 'Data & Backup',
    description: 'Ekspor data dan kelola cadangan database.',
    label: 'Segera Hadir',
    disabled: true,
  },
  {
    icon: Shield,
    title: 'Akses & Izin',
    description: 'Kelola hak akses dan peran pengguna admin.',
    label: 'Segera Hadir',
    disabled: true,
  },
];

export default function PengaturanPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
        <p className="text-sm text-gray-500 mt-1">
          Kelola konfigurasi dan preferensi sistem Buruan Sae 2.0
        </p>
      </div>

      {/* Info akun aktif */}
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-start gap-3">
        <Shield className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-green-800">
            Masuk sebagai{' '}
            <span className="font-semibold">{session?.user?.name ?? '—'}</span>
          </p>
          <p className="text-xs text-green-700 mt-0.5">
            Peran:{' '}
            <span className="font-semibold">
              {session?.user?.peran === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin Dinas'}
            </span>
          </p>
        </div>
      </div>

      {/* Daftar seksi pengaturan */}
      <div className="grid gap-4 sm:grid-cols-2">
        {SETTING_SECTIONS.map(({ icon: Icon, title, description, label, disabled }) => (
          <div
            key={title}
            className={`rounded-lg border bg-white p-5 flex items-start gap-4 ${
              disabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-sm cursor-pointer'
            }`}
          >
            <div className="rounded-md bg-gray-100 p-2 shrink-0">
              <Icon className="h-5 w-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
                {label && (
                  <span className="shrink-0 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                    {label}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Versi aplikasi */}
      <p className="text-xs text-gray-400 text-center pt-2">
        Buruan Sae 2.0 · Web Admin · v2.0.0
      </p>
    </div>
  );
}
