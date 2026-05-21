'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { osmStores, type OsmStore } from '@/lib/osm-stores';

// Free, no-API-key vector tiles (© OpenMapTiles / OpenFreeMap, data © OSM).
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/bright';
// Stockholm county centre.
const STOCKHOLM: [number, number] = [18.0686, 59.3293];

type ChainColor = { match: RegExp; label: string; color: string };

// Distinct hue per Swedish grocery chain family so markers read at a glance.
const CHAIN_COLORS: ChainColor[] = [
  { match: /ica|maxi/i, label: 'ICA', color: '#E2001A' },
  { match: /coop|stora coop|x:?tra/i, label: 'Coop', color: '#1D8649' },
  { match: /willys/i, label: 'Willys', color: '#F59E0B' },
  { match: /lidl/i, label: 'Lidl', color: '#2563EB' },
  { match: /hemk[oö]p/i, label: 'Hemköp', color: '#D6249F' },
  { match: /city gross/i, label: 'City Gross', color: '#7C3AED' },
  { match: /tempo|handlarn|matöppet|matoppet/i, label: 'Tempo / local', color: '#0EA5E9' },
];
const OTHER_COLOR = '#64748B';

function chainColor(brand: string): string {
  for (const c of CHAIN_COLORS) if (c.match.test(brand)) return c.color;
  return OTHER_COLOR;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toFeatureCollection(): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: osmStores
      .filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng))
      .map((s) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
        properties: {
          name: s.name,
          brand: s.brand || 'Other',
          format: s.format || 'store',
          district: s.district || s.city || '',
          address: s.address || '',
          color: chainColor(s.brand || ''),
          lat: s.lat,
          lng: s.lng,
        },
      })),
  };
}

export function StoreMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [storeCount, setStoreCount] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const data = toFeatureCollection();
    setStoreCount(data.features.length);

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: STOCKHOLM,
      zoom: 9.5,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(
      new maplibregl.GeolocateControl({ trackUserLocation: true, showUserLocation: true }),
      'top-right',
    );
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution:
          '© OpenStreetMap contributors · Tiles © OpenFreeMap',
      }),
      'bottom-right',
    );

    const popup = new maplibregl.Popup({ closeButton: true, closeOnClick: true, maxWidth: '280px' });

    map.on('load', () => {
      map.addSource('stores', {
        type: 'geojson',
        data,
        cluster: true,
        clusterRadius: 48,
        clusterMaxZoom: 13,
      });

      // Cluster bubbles.
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'stores',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#101617',
          'circle-opacity': 0.9,
          'circle-radius': ['step', ['get', 'point_count'], 16, 25, 22, 100, 30],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'stores',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['Noto Sans Bold', 'Open Sans Bold'],
          'text-size': 13,
        },
        paint: { 'text-color': '#ffffff' },
      });

      // Individual stores, coloured by chain.
      map.addLayer({
        id: 'store-points',
        type: 'circle',
        source: 'stores',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 4, 13, 7, 16, 10],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff',
        },
      });

      // Zoom into a cluster on click.
      map.on('click', 'clusters', (e) => {
        const feature = map.queryRenderedFeatures(e.point, { layers: ['clusters'] })[0];
        if (!feature) return;
        const clusterId = feature.properties?.cluster_id;
        const source = map.getSource('stores') as maplibregl.GeoJSONSource;
        source.getClusterExpansionZoom(clusterId).then((zoom) => {
          const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates;
          map.easeTo({ center: [lng, lat], zoom });
        });
      });

      // Store detail popup.
      map.on('click', 'store-points', (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const p = f.properties as Record<string, string>;
        const [lng, lat] = (f.geometry as GeoJSON.Point).coordinates;
        const directions = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        const where = [escapeHtml(p.address || ''), escapeHtml(p.district || '')]
          .filter(Boolean)
          .join(' · ');
        popup
          .setLngLat([lng, lat])
          .setHTML(
            `<div style="font-family:inherit;min-width:180px">
               <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
                 <span style="width:10px;height:10px;border-radius:50%;background:${escapeHtml(p.color)};display:inline-block"></span>
                 <strong style="font-size:14px">${escapeHtml(p.name)}</strong>
               </div>
               <div style="font-size:12px;color:#475569">${escapeHtml(p.brand)} · ${escapeHtml(p.format)}</div>
               ${where ? `<div style="font-size:12px;color:#64748b;margin-top:2px">${where}</div>` : ''}
               <a href="${directions}" target="_blank" rel="noopener noreferrer"
                  style="display:inline-block;margin-top:8px;font-size:12px;font-weight:600;color:#1D8649">
                  Directions →</a>
             </div>`,
          )
          .addTo(map);
      });

      for (const layer of ['clusters', 'store-points']) {
        map.on('mouseenter', layer, () => (map.getCanvas().style.cursor = 'pointer'));
        map.on('mouseleave', layer, () => (map.getCanvas().style.cursor = ''));
      }
    });

    return () => map.remove();
  }, []);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      {/* Chain legend */}
      <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-market-ink/10 bg-white/95 px-3 py-2 text-xs shadow-sm backdrop-blur">
        <div className="mb-1 font-bold uppercase tracking-wide text-market-ink/55">
          {storeCount.toLocaleString()} stores
        </div>
        <ul className="space-y-0.5">
          {CHAIN_COLORS.map((c) => (
            <li key={c.label} className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
              <span className="text-market-ink/70">{c.label}</span>
            </li>
          ))}
          <li className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: OTHER_COLOR }} />
            <span className="text-market-ink/70">Other</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export type { OsmStore };
