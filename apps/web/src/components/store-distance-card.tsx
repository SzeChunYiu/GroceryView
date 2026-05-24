'use client';

import { useMemo } from 'react';
import { osmStores, type OsmStore } from '@/lib/osm-stores';
import { nearestRecord, type Coordinate, formatDistanceKm } from '@/lib/distance';
import { useGeolocation } from '@/hooks/useGeolocation';

type Props = {
  chain: string;
  chainLabel: string;
  productBrand?: string;
  chainPrice?: number;
  chainPriceLabel: string;
};

function normalizeForMatch(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').trim();
}

function chainStoreAliases(chain: string): string[] {
  if (chain === 'hemkop') return ['hemkop', 'hemköp'];
  return [chain];
}

function isStoreForChain(store: OsmStore, chain: string) {
  const normalizedStoreBrand = normalizeForMatch(store.brand);
  return chainStoreAliases(chain).some((alias) => {
    const normalizedAlias = normalizeForMatch(alias);
    return normalizedStoreBrand.includes(normalizedAlias) || normalizedStoreBrand.includes(normalizedAlias.replace('sverige', ''));
  });
}

function storeDistanceState(chain: string, position: Coordinate | null) {
  if (!position) return null;
  const candidateStores = osmStores.filter((store) => isStoreForChain(store, chain));
  if (candidateStores.length === 0) return null;

  const nearest = nearestRecord(candidateStores, position);
  if (!nearest) return null;

  return {
    distance: nearest.distanceKm,
    store: nearest.record,
    totalCandidates: candidateStores.length
  };
}

export function StoreDistanceCard({ chain, chainLabel, productBrand, chainPrice, chainPriceLabel }: Props) {
  const { latitude, longitude, accuracy, error, status, requestLocation } = useGeolocation({ autoRequest: false });
  const hasLocation = latitude !== null && longitude !== null;

  const nearestStore = useMemo(() => {
    if (!hasLocation) return null;
    return storeDistanceState(chain, { lat: latitude, lng: longitude });
  }, [chain, hasLocation, latitude, longitude]);

  const accuracyLabel = accuracy === null || !Number.isFinite(accuracy) ? 'not reported' : `${Math.round(accuracy)} m`;
  const chainPriceIsAvailable = typeof chainPrice === 'number' && Number.isFinite(chainPrice);
  const chainPriceTextAvailable = chainPriceLabel.trim().length > 0;

  if (!chainPriceIsAvailable || !chainPriceTextAvailable) return null;

  return (
    <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-800">Nearest {chainLabel} store</p>
      <h2 className="mt-2 text-2xl font-black text-slate-950">Store distance</h2>
      {status === 'idle' && (
        <div className="mt-3">
          <p className="text-sm text-slate-700">No private location is read by default.</p>
          <button
            className="mt-3 rounded-full bg-white px-4 py-2 text-sm font-black text-cyan-800"
            onClick={requestLocation}
            type="button"
          >
            Show nearest {chainLabel} store distance
          </button>
          <p className="mt-2 text-xs font-semibold text-slate-500">
            Distance is calculated from OSM store coordinates and your device location only when you allow permission.
          </p>
        </div>
      )}
      {status === 'prompting' && <p className="mt-3 text-sm text-slate-700">Getting location...</p>}
      {status === 'unsupported' && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-950">This device does not expose geolocation in this browser.</p>}
      {(status === 'permission-denied' || status === 'error') && error ? (
        <div className="mt-3">
          <p className="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-900">{error.message}</p>
          <p className="mt-2 text-xs font-semibold text-slate-600">Location is required to estimate nearest-store distance.</p>
        </div>
      ) : null}
      {status === 'success' && hasLocation ? (
        nearestStore ? (
          <div className="mt-3 rounded-xl bg-white p-3">
            <p className="font-black text-slate-900">{nearestStore.store.name}</p>
            <p className="mt-1 text-sm font-bold text-slate-700">{nearestStore.store.address || `${nearestStore.store.city}, ${nearestStore.store.district}`}</p>
            <p className="mt-2 text-sm font-black text-emerald-900">{formatDistanceKm(nearestStore.distance)} from your location</p>
            <p className="mt-2 text-xs font-semibold text-slate-500">
              Based on nearest of {nearestStore.totalCandidates.toLocaleString('sv-SE')} {chainLabel} OSM store(s) · location accuracy {accuracyLabel}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">Best for chain: {chainPriceLabel}</p>
            {(productBrand ? <p className="mt-1 text-xs font-semibold text-slate-500">Matched item brand: {productBrand}</p> : null)}
          </div>
        ) : (
          <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-950">No matching {chainLabel} stores are present in the current OSM directory.</p>
        )
      ) : null}
    </div>
  );
}
