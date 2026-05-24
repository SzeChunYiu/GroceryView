import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { storeOpeningHoursLabel, storeUniverse } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/stores');
}

type SearchParams = {
  lat?: string | string[];
  lng?: string | string[];
  maxKm?: string | string[];
};

const defaultLocation = {
  lat: 59.3293,
  lng: 18.0686,
  label: 'Stockholm'
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function finiteParam(value: string | string[] | undefined, fallback: number) {
  const parsed = Number(firstParam(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function distanceKm(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) {
  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const deltaLat = toRadians(destination.lat - origin.lat);
  const deltaLng = toRadians(destination.lng - origin.lng);
  const originLat = toRadians(origin.lat);
  const destinationLat = toRadians(destination.lat);
  const halfChordLength =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(originLat) * Math.cos(destinationLat) * Math.sin(deltaLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(halfChordLength));
}

export default async function StoresIndexPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const resolvedSearchParams = (await (searchParams ?? Promise.resolve({}))) as SearchParams;
  const origin = {
    lat: finiteParam(resolvedSearchParams.lat, defaultLocation.lat),
    lng: finiteParam(resolvedSearchParams.lng, defaultLocation.lng)
  };
  const maxKm = Math.min(100, Math.max(0.5, finiteParam(resolvedSearchParams.maxKm, 5)));
  const nearestStores = storeUniverse
    .map((store) => ({ ...store, distanceKm: distanceKm(origin, store) }))
    .filter((store) => store.distanceKm <= maxKm)
    .sort((left, right) => left.distanceKm - right.distanceKm || left.name.localeCompare(right.name, 'sv'))
    .slice(0, 6);
  const brandCounts = [...storeUniverse.reduce((map, store) => map.set(store.brand, (map.get(store.brand) ?? 0) + 1), new Map<string, number>())]
    .sort((a, b) => b[1] - a[1]);
  const hasIcaBrandCoverage = brandCounts.some(([brand]) => brand.toLowerCase().includes('ica'));

  return (
    <PageShell>
      <Eyebrow>Stores</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Sweden store directory</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">Store rows come from OpenStreetMap. Prices are never inferred from store proximity, brand, or format.</p>
      <Card className="mt-6 border-emerald-200 bg-emerald-50/70">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">Nearest stores</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Prioritize distance before price hunting</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              Showing stores within {maxKm.toLocaleString('sv-SE')} km of {firstParam(resolvedSearchParams.lat) && firstParam(resolvedSearchParams.lng) ? 'your coordinates' : defaultLocation.label}.
              Adjust the max distance to compare convenience against late-day deal windows.
            </p>
          </div>
          <form className="grid gap-2 rounded-3xl border border-emerald-100 bg-white p-3 sm:grid-cols-[1fr_1fr_1fr_auto]" action="/stores">
            <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-600">
              Latitude
              <input className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm normal-case tracking-normal" name="lat" inputMode="decimal" defaultValue={origin.lat} />
            </label>
            <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-600">
              Longitude
              <input className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm normal-case tracking-normal" name="lng" inputMode="decimal" defaultValue={origin.lng} />
            </label>
            <label className="text-xs font-black uppercase tracking-[0.16em] text-slate-600">
              Max km
              <input className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm normal-case tracking-normal" name="maxKm" inputMode="decimal" defaultValue={maxKm} />
            </label>
            <button className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white sm:self-end" type="submit">Update</button>
          </form>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {nearestStores.length > 0 ? nearestStores.map((store) => (
            <Link className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm transition hover:border-emerald-700" href={`/stores/${store.slug}`} key={store.slug}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">{store.distanceKm.toFixed(1)} km away</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{store.name}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-700">{store.brand} · {store.city || store.district || 'City not reported'}</p>
              <p className="mt-2 text-sm text-slate-600">{store.address || 'Address not reported'}</p>
              <p className="mt-3 rounded-2xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700">Hours: {storeOpeningHoursLabel(store)}</p>
            </Link>
          )) : (
            <p className="rounded-3xl border border-amber-200 bg-white p-4 text-sm font-semibold text-amber-900 md:col-span-2 lg:col-span-3">
              No verified OSM stores fall within this distance. Increase max km or adjust the coordinates.
            </p>
          )}
        </div>
      </Card>
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
        <Card><h2 className="text-2xl font-black">Brand coverage</h2><div className="mt-4 flex flex-wrap gap-2">{brandCounts.slice(0, 18).map(([brand, count]) => <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-black" key={brand}>{brand}: {count}</span>)}</div></Card>
        {hasIcaBrandCoverage ? (
          <Card>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">ICA chain locator</p>
            <h2 className="mt-2 text-2xl font-black">Browse ICA stores</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">Jump directly to the ICA store locator for verified branch coordinates and list selection.</p>
            <Link className="mt-4 inline-flex rounded-full bg-emerald-700 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-800" href="/stores/ica">
              Open /stores/ica
            </Link>
          </Card>
        ) : null}
        <Card><h2 className="text-2xl font-black">Stores with coordinates</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{storeUniverse.slice(0, 60).map((store) => <Link className="rounded-2xl border border-slate-200 p-4 hover:border-emerald-700" href={`/stores/${store.slug}`} key={store.slug}><p className="font-black">{store.name}</p><p className="text-sm text-slate-600">{store.brand} · {store.city || store.district || 'City not reported'}</p></Link>)}</div></Card>
      </div>
    </PageShell>
  );
}
