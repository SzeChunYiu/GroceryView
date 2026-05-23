'use client';

import { MapPin } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { Card, Eyebrow } from './data-ui';
import { useGeolocation } from '@/hooks/useGeolocation';

const METERS_PER_DEGREE_LAT = 111_320;
const PREFERRED_FALLBACK_STORES = 3;

type NearbyStore = {
  slug: string;
  name: string;
  mobileRoute?: string;
  district?: string;
  format?: string;
  lat?: number;
  lng?: number;
  distanceLabel?: string;
};

type StoreWithDistance = NearbyStore & { distanceKm: number; marker: { x: number; y: number } };

function asFiniteCoordinate(value: number | undefined) {
  return Number.isFinite(value) ? value : null;
}

function clamp(value: number) {
  if (!Number.isFinite(value)) return 50;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

function kmLabel(distanceKm: number) {
  if (!Number.isFinite(distanceKm)) return 'distance unknown';
  if (distanceKm < 1) return `${Math.max(distanceKm, 0).toFixed(1)} km`;
  return `${distanceKm.toFixed(1)} km away`;
}

function toMeters(pointA: { latitude: number; longitude: number }, pointB: { latitude: number; longitude: number }) {
  const latDiff = pointB.latitude - pointA.latitude;
  const lngDiff = pointB.longitude - pointA.longitude;
  const metresPerDegreeLng = METERS_PER_DEGREE_LAT * Math.cos((pointA.latitude * Math.PI) / 180);
  const xMeters = lngDiff * metresPerDegreeLng;
  const yMeters = latDiff * METERS_PER_DEGREE_LAT;
  const distanceKm = Math.sqrt(xMeters * xMeters + yMeters * yMeters) / 1000;

  return { xMeters, yMeters, distanceKm };
}

function markerPosition(storeDistanceKm: number, dxMeters: number, dyMeters: number) {
  const maxSpanMeters = Math.max(storeDistanceKm * 1000 * 1.75, 800);
  const x = 50 + (dxMeters / maxSpanMeters) * 45;
  const y = 50 - (dyMeters / maxSpanMeters) * 45;
  return {
    x: clamp(x),
    y: clamp(y)
  };
}

export default function NearbyStoresWidget({ stores }: Readonly<{ stores: NearbyStore[] }>) {
  const { status, coords, error, requestLocation } = useGeolocation();

  const nearestStores = useMemo<StoreWithDistance[]>(() => {
    if (!coords) return [];

    const candidateStores = stores
      .map((store) => {
        const lat = asFiniteCoordinate(store.lat);
        const lng = asFiniteCoordinate(store.lng);
        if (lat === null || lng === null) return null;

        const pointA = { latitude: lat, longitude: lng };
        const pointB = { latitude: coords.latitude, longitude: coords.longitude };
        const { xMeters, yMeters, distanceKm } = toMeters(pointA, pointB);
        const marker = markerPosition(distanceKm, xMeters, yMeters);
        return { ...store, distanceKm, marker };
      })
      .filter((store): store is StoreWithDistance => Boolean(store))
      .sort((left, right) => left.distanceKm - right.distanceKm)
      .slice(0, 3);

    return candidateStores;
  }, [coords, stores]);

  if (status === 'unsupported') {
    return (
      <Card className="border-slate-200 bg-white">
        <Eyebrow>Nearby stores</Eyebrow>
        <h2 className="mt-2 text-2xl font-black tracking-tight">Find nearby stores once geolocation is enabled</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{error ?? 'This browser does not expose geolocation.'}</p>
        <div className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-950">
          Add location permissions to show a live distance map and nearest-store links.
        </div>
      </Card>
    );
  }

  if (status === 'idle' || status === 'denied' || status === 'error') {
    return (
      <Card className="border-slate-200 bg-white">
        <Eyebrow>Nearby stores</Eyebrow>
        <h2 className="mt-2 text-2xl font-black tracking-tight">Your closest 3 stores</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {status === 'denied'
            ? 'Location permission was not granted. Grant access to pinpoint the three closest stores.'
            : 'Enable location to pinpoint the three closest stores and jump straight to their store pages.'}
        </p>
        <button
          className="mt-4 inline-flex rounded-full bg-emerald-700 px-4 py-2 text-sm font-black text-white"
          onClick={requestLocation}
          type="button"
        >
          {status === 'denied' ? 'Retry location permission' : 'Enable location'}
        </button>
        <p className="mt-3 text-sm text-slate-500">{error ?? 'No location yet'} · Showing fixtures below requires permission.</p>
      </Card>
    );
  }

  if (!coords || nearestStores.length === 0 || status === 'requesting') {
    return (
      <Card className="border-slate-200 bg-white">
        <Eyebrow>Nearby stores</Eyebrow>
        <h2 className="mt-2 text-2xl font-black tracking-tight">Locating your position</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">Waiting for your location to calculate the three nearest stores.</p>
        <div className="mt-4 h-44 rounded-2xl bg-slate-100 p-4">
          <div className="h-full rounded-2xl border border-dashed border-slate-300" />
        </div>
      </Card>
    );
  }

  const fallbackStores = stores
    .filter((store) => store.distanceLabel)
    .slice(0, PREFERRED_FALLBACK_STORES);

  return (
    <Card className="border-emerald-200 bg-emerald-50">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Eyebrow>Nearby stores</Eyebrow>
          <h2 className="mt-2 text-2xl font-black tracking-tight">3 closest stores</h2>
          <p className="mt-3 text-sm leading-6 text-emerald-950">Locations are computed live from your browser geolocation and linked directly to each store profile.</p>
        </div>
        <button
          className="rounded-full border border-emerald-800 bg-white px-4 py-2 text-sm font-black text-emerald-800"
          onClick={requestLocation}
          type="button"
        >
          Refresh location
        </button>
      </div>

      <div className="mt-5 rounded-2xl bg-white p-3">
        <div className="relative h-44 overflow-hidden rounded-2xl bg-slate-100">
          <div
            className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-emerald-700 shadow"
            title="Your position"
          />
          {nearestStores.map((store, index) => {
            const left = `${store.marker.x}%`;
            const top = `${store.marker.y}%`;
            return (
              <div
                className="absolute flex items-center gap-1"
                key={store.slug}
                style={{ left, top }}
              >
                <MapPin className="h-5 w-5 text-rose-700" />
                <div className="rounded-full border border-white bg-white px-1.5 py-0.5 text-xs font-black text-slate-900 shadow">
                  #{index + 1}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {nearestStores.map((store) => (
            <Link
              className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3"
              href={`/stores/${store.slug}`}
              key={store.slug}
            >
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Store {store.slug}</p>
              <p className="mt-1 text-sm font-black text-slate-950">{store.name}</p>
              <p className="text-xs text-slate-600">
                {store.format ?? 'Store'} · {store.district ?? 'District not reported'}
              </p>
              <p className="mt-2 rounded-xl bg-white p-2 text-xs font-black text-emerald-900">{kmLabel(store.distanceKm)}</p>
            </Link>
          ))}
        </div>
      </div>

      {fallbackStores.length > 0 ? (
        <div className="mt-4 grid gap-2 text-sm text-emerald-950 md:grid-cols-3">
          {fallbackStores.map((store) => (
            <p className="rounded-2xl bg-white/80 p-3 text-xs font-bold" key={`fallback-${store.slug}`}>
              {store.distanceLabel}
            </p>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
