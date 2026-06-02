import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ============================================================
// Utility Functions — Web Admin Buruan Sae 2.0
// ============================================================

/**
 * Gabungkan class Tailwind (menghindari konflik)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format angka ke format Indonesia (titik ribuan)
 */
export function formatAngka(nilai: number): string {
  return new Intl.NumberFormat('id-ID').format(nilai);
}

/**
 * Format ke Rupiah
 */
export function formatRupiah(nilai: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(nilai);
}

/**
 * Format tanggal ke lokal Indonesia
 */
export function formatTanggal(dateStr: string | Date, format: 'short' | 'long' = 'short'): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: format === 'long' ? 'long' : 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Format waktu relatif (misalnya "2 jam yang lalu")
 */
export function formatWaktuRelatif(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const rtf = new Intl.RelativeTimeFormat('id', { numeric: 'auto' });
  const diff = (date.getTime() - Date.now()) / 1000;

  if (Math.abs(diff) < 60) return rtf.format(Math.round(diff), 'second');
  if (Math.abs(diff) < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (Math.abs(diff) < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  if (Math.abs(diff) < 2592000) return rtf.format(Math.round(diff / 86400), 'day');
  return formatTanggal(date);
}

/**
 * Singkat label status pesanan
 */
export function labelStatus(status: string): string {
  const map: Record<string, string> = {
    MENUNGGU_PEMBAYARAN: 'Menunggu Bayar',
    DIBAYAR: 'Dibayar',
    DIPROSES: 'Diproses',
    DIKIRIM: 'Dikirim',
    SELESAI: 'Selesai',
    DIBATALKAN: 'Dibatalkan',
    DALAM_REVIEW: 'Dalam Review',
    AKTIF: 'Aktif',
    TIDAK_AKTIF: 'Tidak Aktif',
    DITOLAK: 'Ditolak',
    DIKONFIRMASI: 'Dikonfirmasi',
  };
  return map[status] ?? status;
}

/**
 * Warna badge status
 */
export function warnaStatus(status: string): string {
  const map: Record<string, string> = {
    AKTIF: 'bg-green-100 text-green-700',
    DIKONFIRMASI: 'bg-green-100 text-green-700',
    SELESAI: 'bg-green-100 text-green-700',
    DIBAYAR: 'bg-blue-100 text-blue-700',
    DIPROSES: 'bg-blue-100 text-blue-700',
    DIKIRIM: 'bg-purple-100 text-purple-700',
    DALAM_REVIEW: 'bg-yellow-100 text-yellow-700',
    MENUNGGU_PEMBAYARAN: 'bg-yellow-100 text-yellow-700',
    MENUNGGU_KONFIRMASI: 'bg-yellow-100 text-yellow-700',
    DIBATALKAN: 'bg-red-100 text-red-700',
    DITOLAK: 'bg-red-100 text-red-700',
    TIDAK_AKTIF: 'bg-gray-100 text-gray-600',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600';
}

/**
 * Potong teks panjang
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Konversi m² ke hektar jika > 10.000
 */
export function formatLuas(m2: number): string {
  if (m2 >= 10_000) {
    return `${(m2 / 10_000).toFixed(2)} ha`;
  }
  return `${formatAngka(Math.round(m2))} m²`;
}
