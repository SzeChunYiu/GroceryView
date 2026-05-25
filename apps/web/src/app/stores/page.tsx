import Link from 'next/link';
import { AddressSearch } from '@/components/AddressSearch';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { getStoreReliabilityScore } from '@/lib/freshness';
import { storeMatchesOperatingHoursFilter, type OperatingHoursFilter } from '@/lib/geolocation';
import { osmStoreHolidayWarningLabel, osmStoreOpeningHoursLabel } from '@/lib/osm-stores';
import { storeAssortmentOverviewForStore, storeUniverse } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

export const revalidate = 300;

export function generateMetadata() {
  return routeMetadata('/stores');
}

const operatingHoursFilters: Array<{ href: string; id: OperatingHoursFilter | null; label: string; detail: string }> = [
  { href: '/stores', id: null, label: 'All stores', detail: 'Keep stores with missing or source-specific hours visible.' },
  { href: '/stores?hours=open-now', id: 'open-now', label: 'Open now', detail: 'Only stores whose OSM hours match the current local time.' },
  { href: '/stores?hours=open-evening', id: 'open-evening', label: 'Open this evening', detail: 'Stores open around 18:00 or 20:00 today.' },
  { href: '/stores?hours=open-24h', id: 'open-24h', label: '24h', detail: 'Stores labelled 24/7 or 00:00-24:00.' }
];

function parseOperatingHoursFilter(value: string | string[] | undefined): OperatingHoursFilter | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === 'open-now' || raw === 'open-evening' || raw === 'open-24h' ? raw : null;
}

export default async function StoresIndexPage({ searchParams }: Readonly<{ searchParams?: Promise<Record<string, string | string[] | undefined>> }>) {
  const params = await (searchParams ?? Promise.resolve({}));
  const selectedHoursFilter = parseOperatingHoursFilter(params.hours);
  const filteredStores = storeUniverse.filter((store) => storeMatchesOperatingHoursFilter(store, selectedHoursFilter));
  const brandCounts = [...storeUniverse.reduce((map, store) => map.set(store.brand, (map.get(store.brand) ?? 0) + 1), new Map<string, number>())]
    .sort((a, b) => b[1] - a[1]);
  const hasIcaBrandCoverage = brandCounts.some(([brand]) => brand.toLowerCase().includes('ica'));
  const storesWithHours = storeUniverse.filter((store) => osmStoreOpeningHoursLabel(store) !== 'Hours not reported by OSM').length;
  const holidayWarning = osmStoreHolidayWarningLabel(storeUniverse[0]);
  const reliabilityRows = filteredStores.slice(0, 60).map((store) => {
    const assortment = storeAssortmentOverviewForStore(store);
    const reliability = getStoreReliabilityScore({
      feedRetrievedAt: store.retrievedDate,
      observedCategories: assortment.itemCount > 0 ? ['branch price feed'] : [],
      priceObservationCount: assortment.itemCount
    });

    return { reliability, store };
  });

  return (
    <PageShell>
      <Eyebrow>Stores</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Sweden store directory</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">Store rows come from OpenStreetMap. Prices are never inferred from store proximity, brand, or format.</p>
      <div className="mt-6">
        <AddressSearch stores={filteredStores} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
        <Card><h2 className="text-2xl font-black">Brand coverage</h2><p className="mt-3 text-sm font-bold text-slate-700">{storesWithHours.toLocaleString('sv-SE')} stores include explicit OSM opening hours. {holidayWarning}</p><div className="mt-4 flex flex-wrap gap-2">{brandCounts.slice(0, 18).map(([brand, count]) => <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-black" key={brand}>{brand}: {count}</span>)}</div></Card>
        <Card>
          <h2 className="text-2xl font-black">Operating-hours filter</h2>
          <p className="mt-3 text-sm font-bold text-slate-700">
            {filteredStores.length.toLocaleString('sv-SE')} stores match {selectedHoursFilter ? operatingHoursFilters.find((filter) => filter.id === selectedHoursFilter)?.label.toLowerCase() : 'all source rows'}.
            Missing hours stay excluded only when an explicit opening filter is selected.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {operatingHoursFilters.map((filter) => (
              <Link
                className={`rounded-full px-3 py-2 text-sm font-black ${filter.id === selectedHoursFilter ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-800 hover:bg-emerald-50'}`}
                href={filter.href}
                key={filter.label}
                title={filter.detail}
              >
                {filter.label}
              </Link>
            ))}
          </div>
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
        <Card><h2 className="text-2xl font-black">Stores with coordinates</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{reliabilityRows.map(({ reliability, store }) => <Link className="rounded-2xl border border-slate-200 p-4 hover:border-emerald-700" href={`/stores/${store.slug}`} key={store.slug}><p className="font-black">{store.name}</p><p className="text-sm text-slate-600">{store.brand} · {store.city || store.district || 'City not reported'}</p><p className="mt-2 text-xs font-bold text-slate-500">Hours: {osmStoreOpeningHoursLabel(store)} · {osmStoreHolidayWarningLabel(store)}</p><div className="mt-3 grid gap-2 rounded-2xl bg-slate-50 p-3 text-xs font-bold text-slate-700"><p>Feed freshness: {reliability.feedFreshness.label}</p><p>Price observations: {reliability.priceObservationCount.toLocaleString('sv-SE')}</p><p className={reliability.missingCategories.length > 0 ? 'text-amber-800' : 'text-emerald-800'}>{reliability.missingCategoryWarning}</p><p className="font-black uppercase tracking-[0.14em] text-slate-500">{reliability.scoreLabel}</p></div></Link>)}</div></Card>
      </div>
    </PageShell>
  );
}
