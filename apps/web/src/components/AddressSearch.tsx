'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { geocodeAddress, nearbyStores, type GeocodableStore, type GeocodeResult, type NearbyStore } from '@/lib/geocode';
import { storeRatingSummaryForSlug } from '@/lib/store-ratings';

type AddressSearchProps = {
  stores: GeocodableStore[];
};

function locationLabel(store: GeocodableStore) {
  return [store.address, store.city || store.district].filter(Boolean).join(' · ') || 'Address not reported';
}

function matchLabel(result: GeocodeResult) {
  if (result.matchedBy === 'postcode') return 'postcode centroid';
  if (result.matchedBy === 'city') return 'city/district centroid';
  return 'matched store/address row';
}

export function AddressSearch({ stores }: AddressSearchProps) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<GeocodeResult | null>(null);
  const [submittedQuery, setSubmittedQuery] = useState('');

  const nearby = useMemo<NearbyStore[]>(() => (
    result ? nearbyStores(result, stores, 8) : stores.filter((store) => Number.isFinite(store.lat) && Number.isFinite(store.lng)).slice(0, 8).map((store) => ({ ...store, distanceKm: 0 }))
  ), [result, stores]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = geocodeAddress(query, stores);
    setSubmittedQuery(query.trim());
    setResult(next);
  }

  return (
    <section className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50/80 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-800">Address search</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Center the store map by address or postcode</h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-700">
            Search an OSM-backed address, district, city, or Swedish postcode to recenter the nearby-store list without inferring prices from proximity.
          </p>
        </div>
        <form className="flex w-full flex-col gap-2 sm:max-w-md sm:flex-row" onSubmit={submitSearch}>
          <label className="sr-only" htmlFor="store-address-search">Address or postcode</label>
          <input
            className="min-h-11 flex-1 rounded-full border border-emerald-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none ring-emerald-300 transition placeholder:text-slate-400 focus:ring-4"
            id="store-address-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. 111 22 or Stockholm"
            type="search"
            value={query}
          />
          <button className="rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800" type="submit">
            Search
          </button>
        </form>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-3xl border border-emerald-100 bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Map focus</p>
          {result ? (
            <>
              <p className="mt-2 text-3xl font-black text-slate-950">{result.label}</p>
              <p className="mt-2 text-sm font-semibold text-slate-600">Centered from {matchLabel(result)} at {result.lat.toFixed(4)}, {result.lng.toFixed(4)}.</p>
              <div className="mt-4 h-44 rounded-3xl border border-emerald-200 bg-[radial-gradient(circle_at_center,#34d399_0_10%,#d1fae5_10%_24%,#f8fafc_24%_100%)]" aria-label="Map recentered on searched address" role="img" />
            </>
          ) : (
            <>
              <p className="mt-2 text-2xl font-black text-slate-950">Search to recenter</p>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                {submittedQuery ? `No OSM-backed store match found for “${submittedQuery}”. Try a city, district, store address, or Swedish postcode.` : 'The default list shows the first coordinate-backed stores until a search is submitted.'}
              </p>
              <div className="mt-4 h-44 rounded-3xl border border-dashed border-slate-300 bg-white" aria-label="Map awaiting address search" role="img" />
            </>
          )}
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Nearby stores</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {nearby.map((store) => {
              const rating = storeRatingSummaryForSlug(store.slug);
              return (
                <Link className="rounded-2xl border border-slate-200 p-4 transition hover:border-emerald-700 hover:bg-emerald-50" href={`/stores/${store.slug}`} key={store.slug}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-950">{store.name}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-600">{store.brand} · {locationLabel(store)}</p>
                    </div>
                    <p className="rounded-full bg-yellow-50 px-3 py-1 text-sm font-black text-yellow-900" aria-label={`${rating.averageLabel} average rating`}>
                      {rating.averageLabel}
                    </p>
                  </div>
                  <p className="mt-2 text-sm font-black tracking-[0.14em] text-yellow-700">{rating.starLabel}</p>
                  {result ? <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-800">{store.distanceKm.toFixed(1)} km away</p> : null}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
