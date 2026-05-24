'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { osmStores, type OsmStore } from '@/lib/osm-stores';
import { cheapestMapChain, mapChainIndexScores } from '@/lib/map-chain-index';

// Free, no-API-key vector tiles (© OpenMapTiles / OpenFreeMap, data © OSM).
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/bright';
// Stockholm county centre.
const STOCKHOLM: [number, number] = [18.0686, 59.3293];

type ChainColor = { match: RegExp; label: string; color: string };
type PermissionState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported';

type GeolocateErrorEvent = {
  error?: {
    code?: number;
    message?: string;
  };
  message?: string;
};

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

function toFeatureCollection(): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: osmStores
      .filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lng))
      .map((s) => ({
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
        },
      })),
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

function buildStoreSelectionAnnouncement(store: OsmStore): string {
  return `${store.name} selected. ${storeLocationLabel(store)}. ${chainIndexLabel(store)}.`;
}

export function StoreMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const listButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [storeCount, setStoreCount] = useState(0);
  const [selectedStoreSlug, setSelectedStoreSlug] = useState(syncedMapListStores[0]?.slug ?? '');
  const [selectedStoreIndex, setSelectedStoreIndex] = useState(syncedMapListStores[0] ? 0 : -1);
  const [permissionState, setPermissionState] = useState<PermissionState>('idle');
  const [permissionMessage, setPermissionMessage] = useState('Location permission has not been requested yet.');
  const [selectionMessage, setSelectionMessage] = useState(() =>
    syncedMapListStores[0]
      ? buildStoreSelectionAnnouncement(syncedMapListStores[0])
      : 'No synced stores are available in the nearby map list.',
  );

  function focusStoreByIndex(nextIndex: number, moveFocus: boolean) {
    const store = syncedMapListStores[nextIndex];
    if (!store) return;

    setSelectedStoreIndex(nextIndex);
    setSelectedStoreSlug(store.slug);
    setSelectionMessage(buildStoreSelectionAnnouncement(store));

    mapRef.current?.easeTo({
      center: [store.lng, store.lat],
      zoom: 14,
      duration: 700,
    });

    if (moveFocus) {
      listButtonRefs.current[nextIndex]?.focus();
    }
  }

  function handleStoreKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (syncedMapListStores.length === 0) return;

    const lastIndex = syncedMapListStores.length - 1;
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        focusStoreByIndex((index + 1 + syncedMapListStores.length) % syncedMapListStores.length, true);
        return;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        focusStoreByIndex((index - 1 + syncedMapListStores.length) % syncedMapListStores.length, true);
        return;
      case 'Home':
        event.preventDefault();
        focusStoreByIndex(0, true);
        return;
      case 'End':
        event.preventDefault();
        focusStoreByIndex(lastIndex, true);
        return;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        focusStoreByIndex(index, true);
        return;
      }
      default:
        break;
    }

    if (index !== selectedStoreIndex) {
      focusStoreByIndex(index, false);
    }
  }

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
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    const geolocateControl = new maplibregl.GeolocateControl({ trackUserLocation: true, showUserLocation: true });
    map.addControl(geolocateControl, 'top-right');

    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: '© OpenStreetMap contributors · Tiles © OpenFreeMap',
      }),
      'bottom-right',
    );

    const popup = new maplibregl.Popup({ closeButton: true, closeOnClick: true, maxWidth: '280px' });

    const geolocationSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;
    if (!geolocationSupported) {
      setPermissionState('unsupported');
      setPermissionMessage('Geolocation is not available in this browser. The nearby-store panel remains usable without permission controls.');
    } else {
      setPermissionMessage('Location permission has not been requested yet.');
    }

    geolocateControl.on('trackuserlocationstart', () => {
      setPermissionState('requesting');
      setPermissionMessage('Requesting permission to access your current location.');
    });

    geolocateControl.on('geolocate', () => {
      setPermissionState('granted');
      setPermissionMessage('Location permission granted. Nearby-store map can use your current position.');
    });

    geolocateControl.on('trackuserlocationend', () => {
      setPermissionState('granted');
      setPermissionMessage('Location updates are active in the nearby-stores map.');
    });

    geolocateControl.on('error', (event: GeolocateErrorEvent) => {
      const errorCode = event.error?.code;
      if (errorCode === 1) {
        setPermissionState('denied');
        setPermissionMessage('Location permission was denied. The map remains usable in read-only browsing mode.');
      } else {
        setPermissionState('unsupported');
        const eventMessage = event.error?.message || event.message || 'Unable to access location. The map remains in read-only mode.';
        setPermissionMessage(eventMessage);
      }
    });

    map.on('load', () => {
      const geolocateButton = map.getContainer().querySelector('.maplibregl-ctrl-geolocate button');
      if (geolocateButton instanceof HTMLButtonElement) {
        geolocateButton.setAttribute('aria-label', 'Enable location access for nearby stores map');
      }
      const zoomIn = map.getContainer().querySelector('.maplibregl-ctrl-zoom-in');
      const zoomOut = map.getContainer().querySelector('.maplibregl-ctrl-zoom-out');
      if (zoomIn instanceof HTMLButtonElement) {
        zoomIn.setAttribute('aria-label', 'Zoom in map');
      }
      if (zoomOut instanceof HTMLButtonElement) {
        zoomOut.setAttribute('aria-label', 'Zoom out map');
      }

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
        const slug = String(p.slug ?? '');
        const selectedIndex = syncedMapListStores.findIndex((store) => store.slug === slug);
        if (selectedIndex >= 0) {
          focusStoreByIndex(selectedIndex, false);
        }

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

  return (
    <div className="relative h-full w-full" role="region" aria-label="Nearby stores map panel">
      <div
        ref={containerRef}
        className="h-full w-full"
        role="application"
        aria-label="Nearby stores interactive map"
        tabIndex={0}
      />

      <p id="nearby-store-permission-status" className="sr-only" aria-live="polite" aria-atomic="true">
        Permission state: {permissionState}. {permissionMessage}
      </p>
      <p id="nearby-store-selection-status" className="sr-only" aria-live="polite" aria-atomic="true">
        {selectionMessage}
      </p>

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
          <div>
            {cheapestMapChain ? `${cheapestMapChain.chainId} · index ${cheapestMapChain.overallIndex.toFixed(1)}` : 'Awaiting index coverage'}
          </div>
          <div className="mt-1">Green &lt; 96 · amber 96-103 · red &gt; 103</div>
        </div>
      </div>

      <div
        className="absolute bottom-3 right-3 top-3 flex w-[min(22rem,calc(100%-1.5rem))] flex-col rounded-2xl border border-white/70 bg-white/95 p-3 text-slate-950 shadow-2xl backdrop-blur"
        role="region"
        aria-label="Nearby stores list panel"
        aria-labelledby="nearby-store-map-label"
        aria-describedby="nearby-store-permission-status nearby-store-list-instructions"
      >
        <div className="rounded-xl bg-slate-950 px-4 py-3 text-white">
          <p id="nearby-store-map-label" className="text-xs font-black uppercase tracking-[0.22em] text-emerald-200">
            Synced map + list
          </p>
          <h3 className="mt-1 text-lg font-black">Linked store selection</h3>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-200">
            Use the list to move keyboard focus between stores. Selecting a row pans the map; selecting a marker updates the list.
          </p>
          <p id="nearby-store-list-instructions" className="sr-only">
            Use up/down arrows to move through stores and press Enter or Space to focus a store on the map. Home and End jump to the first and last stores.
          </p>
        </div>

        <div
          role="listbox"
          aria-label="Nearby stores"
          aria-activedescendant={selectedStoreSlug ? `store-${selectedStoreSlug}` : undefined}
          className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1"
        >
          {syncedMapListStores.map((store, index) => {
            const selected = selectedStoreIndex === index;
            const score = chainIndexScore(store.brand || '');
            return (
              <button
                key={store.slug}
                role="option"
                id={`store-${store.slug}`}
                aria-selected={selected}
                aria-label={`${store.name}, ${storeLocationLabel(store)}. ${chainIndexLabel(store)}. Press Enter to focus this store on the map.`}
                ref={(button) => {
                  listButtonRefs.current[index] = button;
                }}
                className={`w-full rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 ${
                  selected
                    ? 'border-emerald-400 bg-emerald-50 shadow-sm ring-2 ring-emerald-200'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
                tabIndex={selected ? 0 : -1}
                onClick={() => {
                  focusStoreByIndex(index, true);
                }}
                onKeyDown={(event) => {
                  handleStoreKeyDown(event, index);
                }}
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
