'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { formatWaktuRelatif, formatAngka, cn } from '@/lib/utils';

// ============================================================
// Halaman Komunitas Admin — Web Admin Buruan Sae 2.0
// ============================================================

export default function KomunitasPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['postingan-admin'],
    queryFn: () =>
      apiClient.get('/komunitas/postingan', { params: { limit: 30, admin: true } })
        .then((r) => r.data.data),
  });

  const hapusMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/komunitas/postingan/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['postingan-admin'] }),
  });

  const postingan: any[] = data?.items ?? [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Komunitas</h1>
        <p className="text-sm text-gray-500 mt-0.5">Moderasi postingan & komentar</p>
      </div>

      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))
          : postingan.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        p.kategori === 'TIPS' ? 'bg-blue-50 text-blue-700' :
                        p.kategori === 'CERITA' ? 'bg-purple-50 text-purple-700' :
                        'bg-gray-100 text-gray-600',
                      )}>
                        {p.kategori}
                      </span>
                      <span className="text-xs text-gray-400">{formatWaktuRelatif(p.created_at)}</span>
                    </div>
                    <h3 className="font-medium text-gray-900 truncate">{p.judul}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.konten}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>👤 {p.penulis?.nama_lengkap}</span>
                      <span>💬 {p._count?.komentar ?? 0} komentar</span>
                      <span>❤️ {p._count?.likes ?? 0} suka</span>
                      <span>👁️ {formatAngka(p.view_count)} dilihat</span>
                    </div>
                  </div>
                  {p.foto_url && (
                    <img src={p.foto_url} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                  )}
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => hapusMutation.mutate(p.id)}
                    className="text-xs px-3 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    🗑️ Hapus
                  </button>
                  {p.is_pinned ? (
                    <button className="text-xs px-3 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200">
                      📌 Unpin
                    </button>
                  ) : (
                    <button className="text-xs px-3 py-1 rounded-md bg-yellow-50 text-yellow-700 hover:bg-yellow-100">
                      📌 Pin
                    </button>
                  )}
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
