'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { icaStores, type IcaStore } from '@/lib/ingested/ica-stores';

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/bright';
const SWEDEN_CENTER: [number, number] = [15.5, 62.0];
const listStores = icaStores.slice(0, 12);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function storeLocationLabel(store: IcaStore): string {
  return [store.address, store.city].filter(Boolean).join(' - ') || 'Sweden';
}

function toIcaFeatureCollection(): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: icaStores.map((store) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [store.lng, store.lat] },
      properties: {
        slug: store.slug,
        name: store.name,
        brand: store.brand,
        city: store.city,
        address: store.address,
        lat: store.lat,
        lng: store.lng,
      },
    })),
  };
}

export function IcaStoreMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [selectedStoreSlug, setSelectedStoreSlug] = useState(listStores[0]?.slug ?? '');

  function focusStore(store: IcaStore) {
    setSelectedStoreSlug(store.slug);
    mapRef.current?.easeTo({
      center: [store.lng, store.lat],
      zoom: 13,
      duration: 700,
    });
  }

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: SWEDEN_CENTER,
      zoom: 4.4,
      attributionControl: false,
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: 'OpenStreetMap contributors; tiles by OpenFreeMap',
      }),
      'bottom-right',
    );

    const popup = new maplibregl.Popup({ closeButton: true, closeOnClick: true, maxWidth: '280px' });

    map.on('load', () => {
      map.addSource('ica-stores', {
        type: 'geojson',
        data: toIcaFeatureCollection(),
        cluster: true,
        clusterRadius: 44,
        clusterMaxZoom: 12,
      });

      map.addLayer({
        id: 'ica-store-clusters',
        type: 'circle',
        source: 'ica-stores',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#E2001A',
          'circle-opacity': 0.88,
          'circle-radius': ['step', ['get', 'point_count'], 16, 25, 22, 100, 30],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      });
      map.addLayer({
        id: 'ica-store-cluster-count',
        type: 'symbol',
        source: 'ica-stores',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['Noto Sans Bold', 'Open Sans Bold'],
          'text-size': 13,
        },
        paint: { 'text-color': '#ffffff' },
      });
      map.addLayer({
        id: 'ica-store-points',
        type: 'circle',
        source: 'ica-stores',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#E2001A',
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 4, 11, 7, 15, 10],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.5,
        },
      });

      map.on('click', 'ica-store-clusters', (event) => {
        const feature = map.queryRenderedFeatures(event.point, { layers: ['ica-store-clusters'] })[0];
        if (!feature) return;
        const source = map.getSource('ica-stores') as maplibregl.GeoJSONSource;
        source.getClusterExpansionZoom(feature.properties?.cluster_id).then((zoom) => {
          const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates;
          map.easeTo({ center: [lng, lat], zoom });
        });
      });

      map.on('click', 'ica-store-points', (event) => {
        const feature = event.features?.[0];
        if (!feature) return;
        const properties = feature.properties as Record<string, string>;
        setSelectedStoreSlug(String(properties.slug ?? ''));
        const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates;
        const directions = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        const where = [escapeHtml(properties.address || ''), escapeHtml(properties.city || '')]
          .filter(Boolean)
          .join(' - ');
        popup
          .setLngLat([lng, lat])
          .setHTML(
            `<div style="font-family:inherit;min-width:180px">
              <strong style="font-size:14px">${escapeHtml(properties.name || 'ICA store')}</strong>
              <div style="font-size:12px;color:#475569;margin-top:2px">${escapeHtml(properties.brand || 'ICA')}</div>
              ${where ? `<div style="font-size:12px;color:#64748b;margin-top:2px">${where}</div>` : ''}
              <a href="${directions}" target="_blank" rel="noopener noreferrer"
                style="display:inline-block;margin-top:8px;font-size:12px;font-weight:600;color:#E2001A">
                Directions</a>
            </div>`,
          )
          .addTo(map);
      });

      for (const layer of ['ica-store-clusters', 'ica-store-points']) {
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
    <div className="relative min-h-[42rem] overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
      <div ref={containerRef} className="absolute inset-0" />
      <div className="absolute left-3 top-3 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs font-bold text-slate-700 shadow-sm backdrop-blur">
        {icaStores.length.toLocaleString()} ICA stores from Overpass
      </div>
      <div className="absolute bottom-3 right-3 top-3 flex w-[min(22rem,calc(100%-1.5rem))] flex-col rounded-lg border border-white/70 bg-white/95 p-3 text-slate-950 shadow-2xl backdrop-blur">
        <div className="rounded-lg bg-[#E2001A] px-4 py-3 text-white">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/75">ICA branch locator</p>
          <h2 className="mt-1 text-lg font-black">Map and branch list</h2>
        </div>
        <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {listStores.map((store) => {
            const selected = selectedStoreSlug === store.slug;
            return (
              <button
                aria-pressed={selected}
                className={`w-full rounded-lg border p-3 text-left transition ${
                  selected
                    ? 'border-red-300 bg-red-50 shadow-sm ring-2 ring-red-100'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
                data-ica-store-slug={store.slug}
                key={store.slug}
                onClick={() => focusStore(store)}
                type="button"
              >
                <p className="font-black leading-5 text-slate-950">{store.name}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{storeLocationLabel(store)}</p>
                <p className="mt-2 text-[11px] font-black uppercase tracking-[0.12em] text-red-700">{store.brand}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
