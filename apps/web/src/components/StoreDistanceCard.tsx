'use client';

import { useGeolocation } from '@/hooks/useGeolocation';
import type { StoreReliabilityScore } from '@/lib/freshness';

type StoreDistanceCardProps = {
  fallbackLabel?: string;
  reliability?: StoreReliabilityScore;
  storeName?: string;
};

export function StoreDistanceCard({ fallbackLabel = 'Search by city or choose a store manually.', reliability, storeName = 'nearby store' }: StoreDistanceCardProps) {
  const { attempts, error, isLoading, position, requestLocation, retryGuidance } = useGeolocation();
  const showFallback = Boolean(error && attempts > 0);

  return (
    <section className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm" aria-live="polite">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">Store distance</p>
      <h2 className="mt-2 text-xl font-black text-slate-950">Check distance to {storeName}</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        Use your location to estimate nearby store distance, or fall back to manual search if permission, timeout, or browser support gets in the way.
      </p>
      <button className="mt-4 rounded-full bg-emerald-900 px-4 py-2 text-sm font-black text-white disabled:opacity-60" disabled={isLoading} onClick={requestLocation} type="button">
        {isLoading ? 'Checking location…' : attempts > 0 ? 'Retry location' : 'Use my location'}
      </button>
      {position ? (
        <p className="mt-3 rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-950">
          Location ready within {Math.round(position.accuracy)} m accuracy: {position.latitude.toFixed(4)}, {position.longitude.toFixed(4)}.
        </p>
      ) : null}
      {showFallback ? (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-950" role="alert">
          <p className="font-black">{error?.message}</p>
          <p className="mt-1">{retryGuidance}</p>
          <p className="mt-1">{fallbackLabel}</p>
        </div>
      ) : null}
      {reliability ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Price reliability</p>
          <dl className="mt-2 grid gap-2">
            <div className="flex justify-between gap-3">
              <dt>Feed freshness</dt>
              <dd className="font-black text-slate-950">{reliability.feedFreshness.label}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Price observations</dt>
              <dd className="font-black text-slate-950">{reliability.priceObservationCount.toLocaleString('sv-SE')}</dd>
            </div>
            <div>
              <dt>Missing-category warnings</dt>
              <dd className={reliability.missingCategories.length > 0 ? 'font-black text-amber-800' : 'font-black text-emerald-800'}>
                {reliability.missingCategoryWarning}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
    </section>
  );
}
