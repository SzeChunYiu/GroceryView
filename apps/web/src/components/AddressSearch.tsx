'use client';

import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { geocodeAddress, nearbyStores } from '@/lib/geocode';
import type { GeocodableStore, GeocodeResult } from '@/lib/geocode';

type AddressSearchProps = {
  stores: GeocodableStore[];
};

function formatDistance(value: number) {
  return value < 1 ? `${Math.round(value * 1000)} m` : `${value.toFixed(1)} km`;
}

function mapUrl(result: GeocodeResult) {
  const delta = 0.025;
  const bbox = [result.lng - delta, result.lat - delta, result.lng + delta, result.lat + delta].join('%2C');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${result.lat}%2C${result.lng}`;
}

export function AddressSearch({ stores }: Readonly<AddressSearchProps>) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<GeocodeResult | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'not-found' | 'error'>('idle');

  const closestStores = useMemo(() => (result ? nearbyStores(stores, result, 6) : []), [result, stores]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    try {
      const nextResult = await geocodeAddress(query);
      setResult(nextResult);
      setStatus(nextResult ? 'idle' : 'not-found');
    } catch {
      setResult(null);
      setStatus('error');
    }
  }

  return (
    <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
      <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-800">Find stores nearby</p>
      <h2 className="mt-2 text-2xl font-black text-slate-950">Search by address or postcode</h2>
      <p className="mt-2 text-sm leading-6 text-slate-700">Geocode a Swedish address to re-center the store map and rank the closest verified store coordinates.</p>

      <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor="store-address-search">Address or postcode</label>
        <input
          className="min-w-0 flex-1 rounded-full border border-emerald-200 px-4 py-3 text-sm font-semibold outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200"
          id="store-address-search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Sveavägen 46, Stockholm or 111 34"
          type="search"
          value={query}
        />
        <button className="rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400" disabled={status === 'loading' || !query.trim()} type="submit">
          {status === 'loading' ? 'Searching…' : 'Search stores'}
        </button>
      </form>

      {status === 'not-found' ? <p className="mt-3 text-sm font-bold text-amber-800">No Swedish address match found. Try a street, city, or postcode.</p> : null}
      {status === 'error' ? <p className="mt-3 text-sm font-bold text-red-700">Address lookup is unavailable right now. Try again shortly.</p> : null}

      {result ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <iframe
            className="h-72 w-full rounded-3xl border border-emerald-200 bg-white"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={mapUrl(result)}
            title={`Store map centered on ${result.label}`}
          />
          <div className="rounded-3xl bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Closest stores to</p>
            <p className="mt-1 text-sm font-black text-slate-950">{result.label}</p>
            <div className="mt-3 space-y-2">
              {closestStores.map((store) => (
                <a className="block rounded-2xl border border-slate-200 p-3 hover:border-emerald-700" href={`/stores/${store.slug}`} key={store.slug}>
                  <span className="block font-black text-slate-950">{store.name}</span>
                  <span className="mt-1 block text-sm text-slate-600">{store.brand} · {formatDistance(store.distanceKm)} away</span>
                  <span className="mt-1 block text-xs font-bold text-slate-500">{store.address || store.city || store.district || 'Address not reported'}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
