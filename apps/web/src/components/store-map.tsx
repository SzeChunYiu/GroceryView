'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { osmStoreHolidayWarningLabel, osmStoreOpeningHoursLabel, osmStores, type OsmStore } from '@/lib/osm-stores';
import { cheapestMapChain, mapChainIndexScores } from '@/lib/map-chain-index';
import { trackStoreDirectionsClick } from '@/lib/analytics';
import type { NearbyDealRecommendation, StoreDistanceRow } from '@/lib/store-distance';

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

function distanceKm(from: [number, number], to: [number, number]): number {
  const earthRadiusKm = 6371;
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(to[1] - from[1]);
  const dLng = toRad(to[0] - from[0]);
  const lat1 = toRad(from[1]);
  const lat2 = toRad(to[1]);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

function distanceMetersFromUser(userLocation: { lat: number; lng: number }, deal: NearbyDealRecommendation): number {
  return Math.round(distanceKm([userLocation.lng, userLocation.lat], [deal.mapLng, deal.mapLat]) * 1000);
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
          openHours: osmStoreOpeningHoursLabel(s),
          holidayWarning: osmStoreHolidayWarningLabel(s),
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

type RouteSavingsMapRow = StoreDistanceRow & { expectedBasketSavingsSek?: number };

export function StoreMap({
  nearbyDealRecommendations = [],
  routeRecommendations = []
}: Readonly<{ nearbyDealRecommendations?: NearbyDealRecommendation[]; routeRecommendations?: RouteSavingsMapRow[] }>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [storeCount, setStoreCount] = useState(0);
  const [selectedStoreSlug, setSelectedStoreSlug] = useState(syncedMapListStores[0]?.slug ?? '');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState('Using map-center distance until location is approved.');

  const rankedNearbyDeals = useMemo(() => {
    if (!userLocation) return nearbyDealRecommendations;
    return nearbyDealRecommendations
      .map((deal) => ({ ...deal, distanceMeters: distanceMetersFromUser(userLocation, deal) }))
      .sort((left, right) => left.distanceMeters - right.distanceMeters || right.savingsSek - left.savingsSek);
  }, [nearbyDealRecommendations, userLocation]);

  function focusStore(store: OsmStore) {
    setSelectedStoreSlug(store.slug);
    mapRef.current?.easeTo({
      center: [store.lng, store.lat],
      zoom: 14,
      duration: 700,
    });
  }

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoStatus('Browser geolocation is unavailable; showing map-center deal distance.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setGeoStatus('Sorted with your approved browser location.');
      },
      () => setGeoStatus('Location was not approved; showing map-center deal distance.'),
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 5000 },
    );
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const data = toFeatureCollection();
    setStoreCount(data.features.length);

    const handleDirectionsClick = (event: MouseEvent) => {
      const directionsLink = (event.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[data-store-directions]');
      if (!directionsLink) return;

      trackStoreDirectionsClick({
        brand: directionsLink.dataset.storeBrand ?? '',
        storeName: directionsLink.dataset.storeName ?? '',
        storeSlug: directionsLink.dataset.storeSlug ?? ''
      });
    };
    containerRef.current.addEventListener('click', handleDirectionsClick);

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
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff',
        },
      });

      // Zoom into a cluster on click.
      map.on('click', 'clusters', (e) => {
        const feature = map.queryRenderedFeatures(e.point, { layers: ['clusters'] })[0];
        if (!feature) return;
        const clusterId = feature.properties?.cluster_id;
        if (typeof clusterId !== 'number') return;
        const source = map.getSource('stores') as maplibregl.GeoJSONSource;
        const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates;
        const mapCenter = map.getCenter();
        const clusterCenter: [number, number] = [lng, lat];
        Promise.all([
          source.getClusterExpansionZoom(clusterId),
          source.getClusterLeaves(clusterId, 5, 0),
        ]).then(([zoom, leaves]) => {
          const radius = leaves.reduce((max, leaf) => {
            const coordinates = (leaf.geometry as GeoJSON.Point).coordinates as [number, number];
            return Math.max(max, distanceKm(clusterCenter, coordinates));
          }, 0);
          const list = leaves
            .map((leaf) => {
              const p = leaf.properties as Record<string, string | number | undefined>;
              const coordinates = (leaf.geometry as GeoJSON.Point).coordinates as [number, number];
              const distance = formatDistance(distanceKm(clusterCenter, coordinates));
              return `<li style="margin-top:6px">
                <strong>${escapeHtml(String(p.name ?? 'Store'))}</strong>
                <div style="color:#64748b">${distance} from cluster center · ${escapeHtml(String(p.openHours ?? 'Open-hours unavailable'))}</div>
                <div style="color:#92400e">${escapeHtml(String(p.holidayWarning ?? 'No current holiday closure warning'))}</div>
              </li>`;
            })
            .join('');
          popup
            .setLngLat(clusterCenter)
            .setHTML(
              `<div style="font-family:inherit;min-width:220px">
                <strong style="font-size:14px">${Number(feature.properties?.point_count ?? leaves.length).toLocaleString()} stores nearby</strong>
                <div style="font-size:12px;color:#475569;margin-top:2px">
                  ${formatDistance(distanceKm([mapCenter.lng, mapCenter.lat], clusterCenter))} from map center · ${formatDistance(radius)} visible sample radius
                </div>
                <ul style="font-size:12px;list-style:none;margin:8px 0 0;padding:0">${list}</ul>
                <div style="font-size:11px;color:#64748b;margin-top:8px">Click zooms into the cluster; hours are shown only when source data provides them.</div>
              </div>`,
            )
            .addTo(map);
          map.easeTo({ center: [lng, lat], zoom });
        });
      });

      // Store detail popup.
      map.on('click', 'store-points', (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const p = f.properties as Record<string, string | number | undefined>;
        setSelectedStoreSlug(String(p.slug ?? ''));
        const [lng, lat] = (f.geometry as GeoJSON.Point).coordinates;
        const directions = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        const mapCenter = map.getCenter();
        const where = [escapeHtml(String(p.address || '')), escapeHtml(String(p.district || ''))]
          .filter(Boolean)
          .join(' · ');
        popup
          .setLngLat([lng, lat])
          .setHTML(
            `<div style="font-family:inherit;min-width:180px">
               <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
                 <span style="width:10px;height:10px;border-radius:50%;background:${escapeHtml(String(p.color || OTHER_COLOR))};display:inline-block"></span>
                 <strong style="font-size:14px">${escapeHtml(String(p.name || 'Store'))}</strong>
               </div>
              <div style="font-size:12px;color:#475569">${escapeHtml(String(p.brand || 'Other'))} · ${escapeHtml(String(p.format || 'store'))}</div>
               ${p.chainIndex ? `<div style="font-size:12px;color:#475569;margin-top:2px">Chain index ${Number(p.chainIndex).toFixed(1)} (100 = market)</div>` : ''}
               ${where ? `<div style="font-size:12px;color:#64748b;margin-top:2px">${where}</div>` : ''}
               <div style="font-size:12px;color:#64748b;margin-top:2px">${formatDistance(distanceKm([mapCenter.lng, mapCenter.lat], [lng, lat]))} from map center</div>
               <div style="font-size:12px;color:#64748b;margin-top:2px">Hours: ${escapeHtml(String(p.openHours || 'Open-hours unavailable'))}</div>
               <div style="font-size:12px;color:#92400e;margin-top:2px">${escapeHtml(String(p.holidayWarning || 'No current holiday closure warning'))}</div>
               <a href="${directions}" target="_blank" rel="noopener noreferrer"
                  data-store-directions="true" data-store-slug="${escapeHtml(String(p.slug || ''))}" data-store-name="${escapeHtml(String(p.name || ''))}" data-store-brand="${escapeHtml(String(p.brand || ''))}"
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
      containerRef.current?.removeEventListener('click', handleDirectionsClick);
      mapRef.current = null;
      map.remove();
    };
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
        <div className="mt-2 border-t border-market-ink/10 pt-2 text-market-ink/70">
          <div className="font-bold uppercase tracking-wide text-market-ink/55">Cheapest chain near me</div>
          <div>{cheapestMapChain ? `${cheapestMapChain.chainId} · index ${cheapestMapChain.overallIndex.toFixed(1)}` : 'Awaiting index coverage'}</div>
          <div className="mt-1">Green &lt; 96 · amber 96-103 · red &gt; 103</div>
        </div>
        {routeRecommendations.length > 0 ? (
          <div className="mt-2 border-t border-market-ink/10 pt-2 text-market-ink/70" data-route-aware-map-legend="true">
            <div className="font-bold uppercase tracking-wide text-market-ink/55">Route-aware nearest</div>
            <div>{routeRecommendations[0]?.storeName} · {routeRecommendations[0]?.totalMinutes} min</div>
            <div className="mt-1">Rank combines distance, basket total, and opening status.</div>
          </div>
        ) : null}
        {rankedNearbyDeals.length > 0 ? (
          <div className="mt-2 border-t border-market-ink/10 pt-2 text-market-ink/70" data-nearby-deal-map-legend="true">
            <div className="font-bold uppercase tracking-wide text-market-ink/55">Nearby deal</div>
            <div>{rankedNearbyDeals[0]?.dealName} · save {rankedNearbyDeals[0]?.savingsSek.toFixed(0)} SEK</div>
            <div className="mt-1">{geoStatus}</div>
          </div>
        ) : null}
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
          {routeRecommendations.length > 0 ? (
            <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-3" data-route-aware-nearest-panel="true">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-800">Route-aware nearest stores</p>
              <div className="mt-2 space-y-2">
                {routeRecommendations.slice(0, 3).map((store, index) => (
                  <div className="rounded-xl bg-white/80 p-2 text-xs" key={store.id}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-black text-slate-950">#{index + 1} {store.storeName}</p>
                      <span className="font-black text-cyan-800">{store.routeScore.toFixed(0)}</span>
                    </div>
                    <p className="mt-1 font-semibold text-slate-600">
                      {store.totalMinutes} min · {store.basketTotalSek.toFixed(2)} SEK basket · {store.openingStatusLabel} · saves {(store.expectedBasketSavingsSek ?? 0).toFixed(2)} SEK
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {rankedNearbyDeals.length > 0 ? (
            <div className="rounded-2xl border border-fuchsia-100 bg-fuchsia-50 p-3" data-nearby-deals-panel="true">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-fuchsia-800">Deals near visible stores</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-fuchsia-900">{geoStatus}</p>
              <div className="mt-2 space-y-2">
                {rankedNearbyDeals.slice(0, 3).map((deal, index) => (
                  <div className="rounded-xl bg-white/80 p-2 text-xs" key={deal.id}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-black text-slate-950">#{index + 1} {deal.dealName}</p>
                      <span className="font-black text-fuchsia-800">-{deal.savingsSek.toFixed(0)} SEK</span>
                    </div>
                    <p className="mt-1 font-semibold text-slate-600">
                      {formatDistance(deal.distanceMeters / 1000)} · {deal.storeName} · {deal.offerMechanicText}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {syncedMapListStores.map((store) => {
            const selected = selectedStoreSlug === store.slug;
            const score = chainIndexScore(store.brand || '');
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
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-800">{osmStoreOpeningHoursLabel(store)}</span>
                  <span className="rounded-full bg-orange-100 px-2 py-1 text-orange-800">{osmStoreHolidayWarningLabel(store)}</span>
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
