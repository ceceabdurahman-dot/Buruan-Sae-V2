'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';

// ============================================================
// Dashboard Layout — Sidebar + Topbar
// ============================================================

const NAV_ITEMS = [
  { href: '/dashboard',    icon: '📊', label: 'Dashboard'   },
  { href: '/lahan',        icon: '🗺️',  label: 'Lahan'       },
  { href: '/produksi',     icon: '🌾', label: 'Produksi'    },
  { href: '/marketplace',  icon: '🛒', label: 'Marketplace' },
  { href: '/agrowisata',   icon: '🌿', label: 'Agrowisata'  },
  { href: '/komunitas',    icon: '👥', label: 'Komunitas'   },
  { href: '/edukasi',      icon: '📚', label: 'Edukasi'     },
  { href: '/pengguna',     icon: '👤', label: 'Pengguna'    },
];

const ADMIN_ITEMS = [
  { href: '/pengaturan', icon: '⚙️', label: 'Pengaturan' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className={cn(
        'flex flex-col bg-white border-r border-gray-200 transition-all duration-300 shrink-0',
        sidebarOpen ? 'w-56' : 'w-16',
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-bs-hijau flex items-center justify-center shrink-0">
            <span className="text-lg">🌿</span>
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-900 whitespace-nowrap">Buruan Sae</p>
              <p className="text-xs text-gray-400 whitespace-nowrap">Admin Panel</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                      active
                        ? 'bg-bs-hijau/10 text-bs-hijau font-medium'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                    )}
                    title={!sidebarOpen ? item.label : undefined}
                  >
                    <span className="text-base shrink-0">{item.icon}</span>
                    {sidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 pt-4 border-t border-gray-100 px-2">
            <p className={cn('text-xs text-gray-400 px-3 mb-1', !sidebarOpen && 'hidden')}>
              Admin
            </p>
            <ul className="space-y-1">
              {ADMIN_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
                  >
                    <span className="text-base shrink-0">{item.icon}</span>
                    {sidebarOpen && <span>{item.label}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* User */}
        <div className="border-t border-gray-100 p-3">
          <div className={cn('flex items-center gap-2', !sidebarOpen && 'justify-center')}>
            <div className="w-8 h-8 rounded-full bg-bs-hijau/20 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-bs-hijau">
                {session?.user?.name?.[0] ?? 'A'}
              </span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">
                  {session?.user?.name ?? 'Admin'}
                </p>
                <button
                  onClick={() => signOut({ callbackUrl: '/auth/login' })}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-4 shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            title="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1" />

          {/* Notifikasi */}
          <button className="relative p-1.5 rounded-lg text-gray-500 hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>

          {/* Profile chip */}
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <div className="w-7 h-7 rounded-full bg-bs-hijau/20 flex items-center justify-center">
              <span className="text-xs font-bold text-bs-hijau">
                {session?.user?.name?.[0] ?? 'A'}
              </span>
            </div>
            <span className="hidden sm:block font-medium">{session?.user?.name ?? 'Admin'}</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
