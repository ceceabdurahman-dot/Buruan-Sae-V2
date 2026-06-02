import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    template: '%s | Buruan Sae 2.0',
    default: 'Buruan Sae 2.0 — Portal Pertanian Perkotaan Kota Bandung',
  },
  description:
    'Platform digital ekosistem pertanian perkotaan Bandung. Peta lahan, marketplace lokal, agrowisata edukasi, dan modul belajar dalam satu sistem terbuka dan terukur.',
  keywords: [
    'Buruan Sae',
    'pertanian perkotaan',
    'Bandung',
    'urban farming',
    'peta lahan',
    'marketplace tani',
    'agrowisata',
  ],
  authors: [{ name: 'Dinas Ketahanan Pangan & Pertanian Kota Bandung' }],
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'Buruan Sae 2.0 — Portal Pertanian Perkotaan Kota Bandung',
    description:
      'Menghubungkan peta lahan, produksi komunitas, UMKM, agrowisata, dan edukasi dalam satu sistem terbuka yang terukur.',
    type: 'website',
    locale: 'id_ID',
    siteName: 'Buruan Sae 2.0',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
