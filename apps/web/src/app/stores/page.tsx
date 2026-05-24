import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { DEFAULT_MAX_STORE_DISTANCE_KM, STORE_DISTANCE_OPTIONS_KM, nearestStoresWithinDistance, normalizeMaxStoreDistanceKm, type StoreCoordinate } from '@/lib/store-distance';
import { storeUniverse } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/stores');
}

type StoreSearchParams = {
  lat?: string | string[];
  lng?: string | string[];
  maxDistanceKm?: string | string[];
};

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseCoordinatePair(lat: string | undefined, lng: string | undefined): StoreCoordinate | null {
  const latitude = Number(lat);
  const longitude = Number(lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

  return { lat: latitude, lng: longitude };
}

export default async function StoresIndexPage({ searchParams }: { searchParams?: Promise<StoreSearchParams> }) {
  const resolvedSearchParams = await searchParams;
  const latitudeParam = firstSearchParam(resolvedSearchParams?.lat);
  const longitudeParam = firstSearchParam(resolvedSearchParams?.lng);
  const maxDistanceKm = normalizeMaxStoreDistanceKm(firstSearchParam(resolvedSearchParams?.maxDistanceKm));
  const userLocation = parseCoordinatePair(latitudeParam, longitudeParam);
  const nearestStores = nearestStoresWithinDistance(storeUniverse, userLocation, maxDistanceKm);
  const brandCounts = [...storeUniverse.reduce((map, store) => map.set(store.brand, (map.get(store.brand) ?? 0) + 1), new Map<string, number>())]
    .sort((a, b) => b[1] - a[1]);
  const hasIcaBrandCoverage = brandCounts.some(([brand]) => brand.toLowerCase().includes('ica'));

  return (
    <PageShell>
      <Eyebrow>Stores</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Sweden store directory</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">Store rows come from OpenStreetMap. Prices are never inferred from store proximity, brand, or format.</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
        <Card><h2 className="text-2xl font-black">Brand coverage</h2><div className="mt-4 flex flex-wrap gap-2">{brandCounts.slice(0, 18).map(([brand, count]) => <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-black" key={brand}>{brand}: {count}</span>)}</div></Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Nearest stores</p>
          <h2 className="mt-2 text-2xl font-black">Find nearby grocery stops</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">Share your coordinates and choose a maximum distance to prioritize quick detours near closing time.</p>
          <form action="/stores" className="mt-4 grid gap-3 sm:grid-cols-3" id="nearest-store-form">
            <label className="grid gap-1 text-sm font-black text-slate-700">
              Latitude
              <input className="rounded-2xl border border-slate-200 px-3 py-2 font-normal" defaultValue={latitudeParam ?? ''} id="store-latitude" inputMode="decimal" name="lat" placeholder="59.3293" />
            </label>
            <label className="grid gap-1 text-sm font-black text-slate-700">
              Longitude
              <input className="rounded-2xl border border-slate-200 px-3 py-2 font-normal" defaultValue={longitudeParam ?? ''} id="store-longitude" inputMode="decimal" name="lng" placeholder="18.0686" />
            </label>
            <label className="grid gap-1 text-sm font-black text-slate-700">
              Max distance
              <select className="rounded-2xl border border-slate-200 px-3 py-2 font-normal" defaultValue={String(maxDistanceKm || DEFAULT_MAX_STORE_DISTANCE_KM)} name="maxDistanceKm">
                {STORE_DISTANCE_OPTIONS_KM.map((distanceKm) => <option key={distanceKm} value={distanceKm}>{distanceKm} km</option>)}
              </select>
            </label>
            <div className="flex flex-wrap gap-2 sm:col-span-3">
              <button className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-800" type="button" id="use-current-location">Use my location</button>
              <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-black text-slate-700 transition hover:border-emerald-700" type="submit">Find nearest stores</button>
            </div>
            <p className="text-sm leading-6 text-slate-600 sm:col-span-3" id="location-status">{userLocation ? `Showing stores within ${maxDistanceKm} km of ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}.` : 'Location stays in your browser until you submit the lookup.'}</p>
          </form>
          {userLocation ? (
            nearestStores.length > 0 ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {nearestStores.map(({ store, distanceKm }) => (
                  <Link className="rounded-2xl border border-slate-200 p-4 hover:border-emerald-700" href={`/stores/${store.slug}`} key={store.slug}>
                    <p className="font-black">{store.name}</p>
                    <p className="text-sm text-slate-600">{store.brand} · {store.city || store.district || 'City not reported'}</p>
                    <p className="mt-2 text-sm font-black text-emerald-700">{distanceKm.toFixed(1)} km away</p>
                  </Link>
                ))}
              </div>
            ) : <p className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm font-black text-slate-700">No stores found within {maxDistanceKm} km. Try a wider distance.</p>
          ) : null}
          <script dangerouslySetInnerHTML={{ __html: `
            (() => {
              const button = document.getElementById('use-current-location');
              const form = document.getElementById('nearest-store-form');
              const latitude = document.getElementById('store-latitude');
              const longitude = document.getElementById('store-longitude');
              const status = document.getElementById('location-status');
              if (!button || !form || !latitude || !longitude || !status) return;
              button.addEventListener('click', () => {
                if (!navigator.geolocation) {
                  status.textContent = 'Geolocation is unavailable in this browser. Enter coordinates manually.';
                  return;
                }
                status.textContent = 'Requesting your location…';
                navigator.geolocation.getCurrentPosition((position) => {
                  latitude.value = position.coords.latitude.toFixed(5);
                  longitude.value = position.coords.longitude.toFixed(5);
                  status.textContent = 'Location added. Updating nearest stores…';
                  form.requestSubmit();
                }, () => {
                  status.textContent = 'Unable to read your location. Enter coordinates manually.';
                }, { enableHighAccuracy: true, maximumAge: 300000, timeout: 10000 });
              });
            })();
          ` }} />
        </Card>
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
