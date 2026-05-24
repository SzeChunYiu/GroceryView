'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { osmStores, type OsmStore } from '@/lib/osm-stores';
import { cheapestMapChain, mapChainIndexScores } from '@/lib/map-chain-index';
import {
  buildStoreQueueSnapshot,
  STORE_QUEUE_REFRESH_INTERVAL_MS,
  type StoreQueueEstimate,
} from '@/lib/store-queue';

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

function chainLabel(brand: string): string {
  for (const c of CHAIN_COLORS) if (c.match.test(brand)) return c.label.split(' / ')[0];
  return 'Other';
}

function chainIndexScore(brand: string): number | null {
  const label = chainLabel(brand);
  return mapChainIndexScores.find((score) => score.chainId.toLowerCase() === label.toLowerCase())?.overallIndex ?? null;
}

function chainIndexColor(score: number | null, fallback: string): string {
  if (score == null) return fallback;
  if (score < 96) return '#1D8649';
  if (score <= 103) return '#F59E0B';
  return '#D94F3D';
}

const syncedMapListStores = osmStores
  .filter((store) => Number.isFinite(store.lat) && Number.isFinite(store.lng))
  .slice(0, 8);

function storeLocationLabel(store: OsmStore): string {
  return [store.district || store.city, store.address].filter(Boolean).join(' · ') || 'Stockholm area';
}

function chainIndexLabel(store: OsmStore): string {
  const score = chainIndexScore(store.brand || '');
  if (score == null) return 'No chain-index coverage';
  if (score < 96) return `Index ${score.toFixed(1)} · cheaper chain signal`;
  if (score > 103) return `Index ${score.toFixed(1)} · higher-price chain signal`;
  return `Index ${score.toFixed(1)} · market band`;
}

function districtHeatColor(score: number): string {
  if (score < 96) return '#1D8649';
  if (score <= 103) return '#F59E0B';
  return '#D94F3D';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toFeatureCollection(queueSnapshot: Record<string, StoreQueueEstimate>): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: osmStores
      .filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng))
      .map((s) => {
        const queue = queueSnapshot[s.slug];
        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
          properties: {
            slug: s.slug,
            name: s.name,
            brand: s.brand || 'Other',
            chainIndex: chainIndexScore(s.brand || ''),
            format: s.format || 'store',
            district: s.district || s.city || '',
            address: s.address || '',
            color: chainIndexColor(chainIndexScore(s.brand || ''), chainColor(s.brand || '')),
            lat: s.lat,
            lng: s.lng,
            queueColor: queue?.color || '#1D8649',
            queueLabel: queue?.label || 'Queue pending',
            queueLevel: queue?.level || 'quiet',
            queueMinutes: queue?.minutes ?? 0,
            queueRefreshedAt: queue?.refreshedAt || '',
          },
        };
      }),
  };
}

function districtHeatCollection(): GeoJSON.FeatureCollection<GeoJSON.Point> {
  const byDistrict = new Map<string, { lng: number; lat: number; count: number; scoreSum: number; scored: number }>();
  for (const store of osmStores) {
    if (!Number.isFinite(store.lat) || !Number.isFinite(store.lng)) continue;
    const district = store.district || store.city || 'Stockholm';
    const score = chainIndexScore(store.brand || '');
    const current = byDistrict.get(district) ?? { lng: 0, lat: 0, count: 0, scoreSum: 0, scored: 0 };
    current.lng += store.lng;
    current.lat += store.lat;
    current.count += 1;
    if (score != null) {
      current.scoreSum += score;
      current.scored += 1;
    }
    byDistrict.set(district, current);
  }

  return {
    type: 'FeatureCollection',
    features: [...byDistrict.entries()]
      .filter(([, value]) => value.scored > 0)
      .map(([district, value]) => {
        const averageScore = value.scoreSum / value.scored;
        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [value.lng / value.count, value.lat / value.count] },
          properties: {
            district,
            storeCount: value.count,
            averageScore,
            heatColor: districtHeatColor(averageScore),
          },
        };
      }),
  };
}

export function StoreMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const initialQueueSnapshotRef = useRef(buildStoreQueueSnapshot(osmStores));
  const [storeCount, setStoreCount] = useState(0);
  const [queueSnapshot, setQueueSnapshot] = useState(initialQueueSnapshotRef.current);
  const [selectedStoreSlug, setSelectedStoreSlug] = useState(syncedMapListStores[0]?.slug ?? '');

  function focusStore(store: OsmStore) {
    setSelectedStoreSlug(store.slug);
    mapRef.current?.easeTo({
      center: [store.lng, store.lat],
      zoom: 14,
      duration: 700,
    });
  }

  useEffect(() => {
    if (!containerRef.current) return;

    const data = toFeatureCollection(initialQueueSnapshotRef.current);
    setStoreCount(data.features.length);

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: STOCKHOLM,
      zoom: 9.5,
      attributionControl: false,
    });
    mapRef.current = map;

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
      map.addSource('district-heat', {
        type: 'geojson',
        data: districtHeatCollection(),
      });
      map.addLayer({
        id: 'district-heat',
        type: 'circle',
        source: 'district-heat',
        paint: {
          'circle-color': ['get', 'heatColor'],
          'circle-opacity': 0.16,
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 24, 12, 72, 15, 130],
          'circle-blur': 0.7,
        },
      });

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
          'circle-stroke-width': ['case', ['==', ['get', 'queueLevel'], 'busy'], 3, 1.5],
          'circle-stroke-color': ['get', 'queueColor'],
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
        setSelectedStoreSlug(String(p.slug ?? ''));
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
               ${p.chainIndex ? `<div style="font-size:12px;color:#475569;margin-top:2px">Chain index ${Number(p.chainIndex).toFixed(1)} (100 = market)</div>` : ''}
               <div style="font-size:12px;color:${escapeHtml(p.queueColor || '#1D8649')};font-weight:700;margin-top:4px">${escapeHtml(p.queueLabel || 'Queue pending')} ${p.queueRefreshedAt ? `· refreshed ${escapeHtml(p.queueRefreshedAt)}` : ''}</div>
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

    return () => {
      mapRef.current = null;
      map.remove();
    };
  }, []);

  useEffect(() => {
    const refreshQueueSnapshot = () => setQueueSnapshot(buildStoreQueueSnapshot(osmStores));
    const intervalId = window.setInterval(refreshQueueSnapshot, STORE_QUEUE_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const source = mapRef.current?.getSource('stores') as maplibregl.GeoJSONSource | undefined;
    const data = toFeatureCollection(queueSnapshot);
    setStoreCount(data.features.length);
    source?.setData(data);
  }, [queueSnapshot]);

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
        <div className="mt-2 border-t border-market-ink/10 pt-2 text-market-ink/70">
          <div className="font-bold uppercase tracking-wide text-market-ink/55">Cheapest chain near me</div>
          <div>{cheapestMapChain ? `${cheapestMapChain.chainId} · index ${cheapestMapChain.overallIndex.toFixed(1)}` : 'Awaiting index coverage'}</div>
          <div className="mt-1">Green &lt; 96 · amber 96-103 · red &gt; 103</div>
          <div className="mt-1">Queue ring refreshes every {Math.round(STORE_QUEUE_REFRESH_INTERVAL_MS / 1000)}s</div>
        </div>
      </div>

      <div className="absolute bottom-3 right-3 top-3 flex w-[min(22rem,calc(100%-1.5rem))] flex-col rounded-2xl border border-white/70 bg-white/95 p-3 text-slate-950 shadow-2xl backdrop-blur">
        <div className="rounded-xl bg-slate-950 px-4 py-3 text-white">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">Synced map + list</p>
          <h3 className="mt-1 text-lg font-black">Linked store selection</h3>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-200">
            Click a list row to fly the map; click a marker to update the selected row.
          </p>
        </div>
        <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {syncedMapListStores.map((store) => {
            const selected = selectedStoreSlug === store.slug;
            const score = chainIndexScore(store.brand || '');
            const queue = queueSnapshot[store.slug];
            return (
              <button
                aria-pressed={selected}
                className={`w-full rounded-2xl border p-3 text-left transition ${
                  selected
                    ? 'border-emerald-400 bg-emerald-50 shadow-sm ring-2 ring-emerald-200'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
                data-store-slug={store.slug}
                key={store.slug}
                onClick={() => focusStore(store)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black leading-5 text-slate-950">{store.name}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{storeLocationLabel(store)}</p>
                  </div>
                  <span
                    aria-hidden="true"
                    className="mt-1 inline-block h-3 w-3 shrink-0 rounded-full"
                    style={{ background: chainIndexColor(score, chainColor(store.brand || '')) }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.12em]">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{store.brand || 'Other'}</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-800">{chainIndexLabel(store)}</span>
                  {queue ? <span className="rounded-full border px-2 py-1" style={{ borderColor: queue.color, color: queue.color }}>{queue.label}</span> : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export type { OsmStore };
