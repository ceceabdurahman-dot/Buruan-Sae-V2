'use client';

import { useEffect, useRef } from 'react';

// ============================================================
// LahanMap — Leaflet Map Component for Lahan Visualization
// NOTE: This component must be loaded with dynamic import + ssr:false
// ============================================================

type LahanMapItem = {
    id: string;
    nama?: string;
    nama_lahan?: string;
    status: string;
    geojson?: {
      type: string;
      coordinates: number[][][];
    } | null;
    koordinat_geojson?: {
      type: string;
      coordinates: number[][][];
    } | null;
    lat?: number;
    lng?: number;
    pemilik?: {
      nama_lengkap: string;
    };
    luas_m2?: number;
  };

interface LahanMapProps {
  lahan?: LahanMapItem[];
  geojson?: {
    type: 'FeatureCollection';
    features: Array<{
      type: 'Feature';
      geometry: {
        type: string;
        coordinates: number[][][];
      } | null;
      properties?: {
        id?: string;
        nama?: string;
        status?: string;
        luas_m2?: number;
      };
    }>;
  };
  onSelect?: (lahanId: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  AKTIF: '#4CAF50',
  DALAM_REVIEW: '#FFC107',
  DITOLAK: '#F44336',
  NONAKTIF: '#9E9E9E',
};

export default function LahanMap({ lahan, geojson, onSelect }: LahanMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamically load Leaflet (SSR-safe)
    const initMap = async () => {
      const L = (await import('leaflet')).default;

      // Fix Leaflet default icon path issues in Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Kota Bandung center
      const map = L.map(mapRef.current!, {
        center: [-6.9175, 107.6191],
        zoom: 12,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      const normalizedLahan: LahanMapItem[] = lahan ?? geojson?.features.map((feature) => ({
        id: feature.properties?.id ?? '',
        nama: feature.properties?.nama ?? 'Lahan',
        status: feature.properties?.status ?? 'AKTIF',
        luas_m2: feature.properties?.luas_m2,
        geojson: feature.geometry,
      })) ?? [];

      const renderedLayers: any[] = [];

      // Render lahan
      normalizedLahan.forEach((item) => {
        const color = STATUS_COLORS[item.status] ?? '#9E9E9E';
        const nama = item.nama_lahan ?? item.nama ?? 'Lahan';
        const geometry = item.koordinat_geojson ?? item.geojson;
        const popupContent = `
          <div style="min-width:160px">
            <strong>${nama}</strong><br/>
            <span style="color:${color};font-weight:600">${item.status.replace('_', ' ')}</span><br/>
            ${item.pemilik?.nama_lengkap ? `Pemilik: ${item.pemilik.nama_lengkap}<br/>` : ''}
            ${item.luas_m2 ? `Luas: ${item.luas_m2} m²` : ''}
          </div>
        `;

        if (geometry?.coordinates) {
          // Render polygon
          const coords = geometry.coordinates[0].map(
            ([lng, lat]: number[]) => [lat, lng] as [number, number]
          );
          const polygon = L.polygon(coords, {
            color,
            fillColor: color,
            fillOpacity: 0.35,
            weight: 2,
          });
          polygon.bindPopup(popupContent);
          if (onSelect) {
            polygon.on('click', () => onSelect(item.id));
          }
          polygon.addTo(map);
          renderedLayers.push(polygon);
        } else if (item.lat && item.lng) {
          // Fallback: point marker
          const marker = L.circleMarker([item.lat, item.lng], {
            radius: 10,
            color,
            fillColor: color,
            fillOpacity: 0.7,
            weight: 2,
          });
          marker.bindPopup(popupContent);
          if (onSelect) {
            marker.on('click', () => onSelect(item.id));
          }
          marker.addTo(map);
          renderedLayers.push(marker);
        }
      });

      // Fit bounds if we have any lahan
      if (renderedLayers.length > 0) {
        const group = L.featureGroup(renderedLayers);
        try {
          map.fitBounds(group.getBounds(), { padding: [20, 20] });
        } catch {
          // ignore if no layers with bounds
        }
      }
    };

    initMap().catch(console.error);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render lahan when data changes (after initial mount)
  useEffect(() => {
    // Map re-initialization on data change is handled by parent
    // For production, implement incremental layer update here
  }, [lahan]);

  return (
    <div
      ref={mapRef}
      style={{ width: '100%', height: '100%', minHeight: '400px', borderRadius: '8px' }}
    />
  );
}
