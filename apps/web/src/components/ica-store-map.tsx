'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { icaLocatorStores, visibleIcaStores, type OsmStore } from '@/lib/ica-locator-stores';
import { mapListSyncAnnouncement } from '@/lib/screen-reader-announcements';

// Free, no-API-key vector tiles (© OpenMapTiles / OpenFreeMap, data © OSM).
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/bright';
const ICA_RED = '#E2001A';
const ICA_DARK = '#8F0010';
const STOCKHOLM: [number, number] = [18.0686, 59.3293];

type IcaFeatureProperties = {
  slug: string;
  name: string;
  brand: string;
  format: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
};

function locationLabel(store: OsmStore): string {
  return [store.district || store.city, store.address].filter(Boolean).join(' · ') || 'Sweden';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function icaFeatureCollection(): GeoJSON.FeatureCollection<GeoJSON.Point, IcaFeatureProperties> {
  return {
    type: 'FeatureCollection',
    features: icaLocatorStores.map((store) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [store.lng, store.lat] },
      properties: {
        slug: store.slug,
        name: store.name,
        brand: store.brand || 'ICA',
        format: store.format || 'store',
        district: store.district || store.city || '',
        address: store.address || '',
        lat: store.lat,
        lng: store.lng,
      },
    })),
  };
}

function initialCenter(): [number, number] {
  const stockholmIca = icaLocatorStores.find((store) => /stockholm/i.test(`${store.city} ${store.district}`));
  return stockholmIca ? [stockholmIca.lng, stockholmIca.lat] : STOCKHOLM;
}

export function IcaStoreMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [selectedStoreSlug, setSelectedStoreSlug] = useState(visibleIcaStores[0]?.slug ?? '');
  const featureCollection = useMemo(() => icaFeatureCollection(), []);
  const selectedStoreIndex = Math.max(0, visibleIcaStores.findIndex((store) => store.slug === selectedStoreSlug));
  const selectedStore = visibleIcaStores[selectedStoreIndex] ?? visibleIcaStores[0];
  const mapSyncAnnouncement = selectedStore ? mapListSyncAnnouncement({
    selectedStoreName: selectedStore.name,
    selectedStorePosition: selectedStoreIndex + 1,
    sourceCaveat: 'OSM location only; no shelf price or stock is inferred.',
    totalStores: visibleIcaStores.length
  }) : 'No ICA stores are available in the synced map list.';

  function focusStore(store: OsmStore) {
    setSelectedStoreSlug(store.slug);
    mapRef.current?.easeTo({
      center: [store.lng, store.lat],
      zoom: 13.5,
      duration: 600,
    });
  }

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: initialCenter(),
      zoom: 9.2,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: '© OpenStreetMap contributors · Tiles © OpenFreeMap',
      }),
      'bottom-right',
    );

    const popup = new maplibregl.Popup({ closeButton: true, closeOnClick: true, maxWidth: '280px' });

    map.on('load', () => {
      map.addSource('ica-stores', {
        type: 'geojson',
        data: featureCollection,
        cluster: true,
        clusterRadius: 42,
        clusterMaxZoom: 12,
      });

      map.addLayer({
        id: 'ica-clusters',
        type: 'circle',
        source: 'ica-stores',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': ICA_DARK,
          'circle-opacity': 0.92,
          'circle-radius': ['step', ['get', 'point_count'], 16, 25, 23, 100, 31],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      });
      map.addLayer({
        id: 'ica-cluster-count',
        type: 'symbol',
        source: 'ica-stores',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-size': 13,
          'text-font': ['Noto Sans Bold', 'Open Sans Bold'],
        },
        paint: { 'text-color': '#ffffff' },
      });
      map.addLayer({
        id: 'ica-store-points',
        type: 'circle',
        source: 'ica-stores',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ICA_RED,
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 4, 13, 8, 16, 11],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.8,
        },
      });

      map.on('click', 'ica-clusters', (event) => {
        const feature = map.queryRenderedFeatures(event.point, { layers: ['ica-clusters'] })[0];
        if (!feature) return;
        const clusterId = feature.properties?.cluster_id;
        const source = map.getSource('ica-stores') as maplibregl.GeoJSONSource;
        source.getClusterExpansionZoom(clusterId).then((zoom) => {
          const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates;
          map.easeTo({ center: [lng, lat], zoom });
        });
      });

      map.on('click', 'ica-store-points', (event) => {
        const feature = event.features?.[0];
        if (!feature) return;
        const props = feature.properties as IcaFeatureProperties;
        setSelectedStoreSlug(String(props.slug ?? ''));
        const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates;
        const where = [escapeHtml(props.address || ''), escapeHtml(props.district || '')].filter(Boolean).join(' · ');
        popup
          .setLngLat([lng, lat])
          .setHTML(
            `<div style="font-family:inherit;min-width:180px">
              <strong style="font-size:14px;color:#8F0010">${escapeHtml(props.name)}</strong>
              <div style="font-size:12px;color:#475569;margin-top:2px">${escapeHtml(props.brand)} · ${escapeHtml(props.format)}</div>
              ${where ? `<div style="font-size:12px;color:#64748b;margin-top:2px">${where}</div>` : ''}
            </div>`,
          )
          .addTo(map);
      });

      for (const layer of ['ica-clusters', 'ica-store-points']) {
        map.on('mouseenter', layer, () => (map.getCanvas().style.cursor = 'pointer'));
        map.on('mouseleave', layer, () => (map.getCanvas().style.cursor = ''));
      }
    });

    return () => {
      mapRef.current = null;
      map.remove();
    };
  }, [featureCollection]);

  return (
    <section
      aria-label="Interactive ICA store locator map and synced list"
      className="grid h-full min-h-[38rem] overflow-hidden rounded-[2rem] border border-red-100 bg-white shadow-2xl lg:grid-cols-[minmax(0,1fr)_23rem]"
      data-testid="ica-store-map"
    >
      <p aria-atomic="true" aria-live="polite" className="sr-only" role="status">{mapSyncAnnouncement}</p>
      <div className="relative min-h-[24rem] lg:min-h-0">
        <div ref={containerRef} aria-label="ICA locator MapLibre canvas" className="h-full min-h-[24rem] w-full" data-testid="ica-map-canvas-host" />
        <div className="pointer-events-none absolute left-4 top-4 rounded-2xl border border-white/80 bg-white/95 px-4 py-3 text-sm shadow-xl backdrop-blur">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-red-700">ICA locator</p>
          <p className="mt-1 font-black text-slate-950">{icaLocatorStores.length.toLocaleString('sv-SE')} OSM ICA rows</p>
          <p className="mt-1 max-w-52 text-xs font-semibold leading-5 text-slate-600">Map pins are location evidence only; no shelf price or stock is inferred.</p>
        </div>
      </div>
      <aside className="flex min-h-0 flex-col border-t border-red-100 bg-red-50/70 p-4 lg:border-l lg:border-t-0" data-testid="ica-store-list">
        <div className="rounded-2xl bg-red-950 px-4 py-3 text-white">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-200">Synced ICA list</p>
          <h2 className="mt-1 text-xl font-black">Browse ICA stores</h2>
          <p className="mt-2 text-xs font-semibold leading-5 text-red-100">Clicking a row focuses the MapLibre canvas without covering the list row.</p>
        </div>
        <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {visibleIcaStores.map((store) => {
            const selected = selectedStoreSlug === store.slug;
            return (
              <button
                aria-pressed={selected}
                className={`w-full rounded-2xl border p-3 text-left transition ${
                  selected
                    ? 'border-red-300 bg-white shadow-sm ring-2 ring-red-200'
                    : 'border-red-100 bg-white/80 hover:border-red-200 hover:bg-white'
                }`}
                data-store-slug={store.slug}
                data-testid="ica-store-list-row"
                key={store.slug}
                onClick={() => focusStore(store)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black leading-5 text-slate-950">{store.name}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{locationLabel(store)}</p>
                  </div>
                  <span aria-hidden="true" className="mt-1 inline-block h-3 w-3 shrink-0 rounded-full bg-red-600" />
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.12em]">
                  <span className="rounded-full bg-red-100 px-2 py-1 text-red-800">{store.brand || 'ICA'}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">OSM location only</span>
                </div>
              </button>
            );
          })}
        </div>
      </aside>
    </section>
  );
}
