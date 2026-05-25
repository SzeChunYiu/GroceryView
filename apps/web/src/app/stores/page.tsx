import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { storeUniverse } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

type SearchParams = {
  hours?: string | string[];
};

type HoursFilter = 'all' | 'open-now' | 'open-evening' | '24h';

const hoursFilters: Array<{ id: HoursFilter; label: string; detail: string }> = [
  { id: 'all', label: 'All stores', detail: 'Show every mapped branch.' },
  { id: 'open-now', label: 'Open now', detail: 'Hide branches outside their planned trading window.' },
  { id: 'open-evening', label: 'Open this evening', detail: 'Keep stores planned to trade into the evening.' },
  { id: '24h', label: '24h', detail: 'Show branches marked as around-the-clock candidates.' }
];

function resolveHoursFilter(searchParams: SearchParams): HoursFilter {
  const value = Array.isArray(searchParams.hours) ? searchParams.hours[0] : searchParams.hours;
  return value === 'open-now' || value === 'open-evening' || value === '24h' ? value : 'all';
}

function buildHoursProfile(store: { brand: string; name: string }) {
  const label = `${store.brand} ${store.name}`.toLowerCase();
  const is24h = /24\s*\/\s*7|24h|dygnet runt|circle k|7-eleven/.test(label);
  const opensAt = /lidl|tempo/.test(label) ? 8 : /city gross|hemköp|hemkop|willys|coop|ica/.test(label) ? 7 : 9;
  const closesAt = is24h ? 24 : /tempo/.test(label) ? 20 : /lidl/.test(label) ? 21 : /city gross|hemköp|hemkop|willys|coop|ica/.test(label) ? 22 : 20;
  return { is24h, opensAt, closesAt, label: is24h ? 'Open 24h' : `${String(opensAt).padStart(2, '0')}:00-${String(closesAt).padStart(2, '0')}:00` };
}

function matchesHoursFilter(store: { brand: string; name: string }, filter: HoursFilter) {
  if (filter === 'all') return true;
  const profile = buildHoursProfile(store);
  if (filter === '24h') return profile.is24h;
  if (filter === 'open-evening') return profile.is24h || profile.closesAt >= 21;
  const hour = new Date().getHours();
  return profile.is24h || (hour >= profile.opensAt && hour < profile.closesAt);
}

export function generateMetadata() {
  return routeMetadata('/stores');
}

export default async function StoresIndexPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const resolvedSearchParams = await (searchParams ?? Promise.resolve({}));
  const hoursFilter = resolveHoursFilter(resolvedSearchParams);
  const filteredStores = storeUniverse.filter((store) => matchesHoursFilter(store, hoursFilter));
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
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">Operating-hours filters</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">Filter planning views to avoid routes against branches that are likely closed.</p>
            </div>
            <p className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800">{filteredStores.length} eligible</p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {hoursFilters.map((filter) => (
              <Link
                className={filter.id === hoursFilter ? 'rounded-2xl border border-emerald-700 bg-emerald-50 p-4 text-emerald-950' : 'rounded-2xl border border-slate-200 p-4 hover:border-emerald-700'}
                href={filter.id === 'all' ? '/stores' : `/stores?hours=${filter.id}`}
                key={filter.id}
              >
                <p className="font-black">{filter.label}</p>
                <p className="mt-1 text-xs font-semibold opacity-75">{filter.detail}</p>
              </Link>
            ))}
          </div>
        </Card>
        <Card><h2 className="text-2xl font-black">Stores with coordinates</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{filteredStores.slice(0, 60).map((store) => { const hours = buildHoursProfile(store); return <Link className="rounded-2xl border border-slate-200 p-4 hover:border-emerald-700" href={`/stores/${store.slug}`} key={store.slug}><p className="font-black">{store.name}</p><p className="text-sm text-slate-600">{store.brand} · {store.city || store.district || 'City not reported'}</p><p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-700">{hours.label}</p></Link>; })}</div></Card>
      </div>
    </PageShell>
  );
}
