import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { storeUniverse } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
type OperatingHoursFilter = 'all' | 'open-now' | 'open-evening' | '24h';

const operatingHoursFilters: { href: string; label: string; value: OperatingHoursFilter }[] = [
  { href: '/stores', label: 'All stores', value: 'all' },
  { href: '/stores?hours=open-now', label: 'Open now', value: 'open-now' },
  { href: '/stores?hours=open-evening', label: 'Open this evening', value: 'open-evening' },
  { href: '/stores?hours=24h', label: '24h', value: '24h' }
];

export function generateMetadata() {
  return routeMetadata('/stores');
}

function getHoursParam(searchParams: Record<string, string | string[] | undefined>): OperatingHoursFilter {
  const hours = searchParams.hours;
  const value = Array.isArray(hours) ? hours[0] : hours;
  return value === 'open-now' || value === 'open-evening' || value === '24h' ? value : 'all';
}

function getBranchHours(store: (typeof storeUniverse)[number]) {
  const withHours = store as (typeof storeUniverse)[number] & { openingHours?: string; opening_hours?: string; hours?: string };
  return withHours.openingHours ?? withHours.opening_hours ?? withHours.hours ?? '';
}

function is24HourBranch(hours: string) {
  return /24\s*\/\s*7|00:00\s*-\s*24:00|00:00\s*-\s*00:00/i.test(hours);
}

function dayMatches(dayPart: string, date: Date) {
  if (!dayPart || /^(PH|SH)$/i.test(dayPart)) return true;
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const today = days[date.getDay()];
  return dayPart.split(',').some((part) => {
    const token = part.trim();
    const range = token.match(/^(Mo|Tu|We|Th|Fr|Sa|Su)\s*-\s*(Mo|Tu|We|Th|Fr|Sa|Su)$/);
    if (range) {
      const start = days.indexOf(range[1]);
      const end = days.indexOf(range[2]);
      const current = days.indexOf(today);
      return start <= end ? current >= start && current <= end : current >= start || current <= end;
    }
    return token === today;
  });
}

function minutesFromClock(clock: string) {
  const [hours, minutes] = clock.split(':').map(Number);
  return hours * 60 + minutes;
}

function timeMatches(startClock: string, endClock: string, date: Date) {
  const current = date.getHours() * 60 + date.getMinutes();
  const start = minutesFromClock(startClock);
  const end = endClock.startsWith('24:') ? 24 * 60 : minutesFromClock(endClock);
  return start <= end ? current >= start && current <= end : current >= start || current <= end;
}

function isOpenAt(hours: string, date: Date) {
  if (!hours) return false;
  if (is24HourBranch(hours)) return true;
  return hours.split(';').some((rule) => {
    if (/\boff\b/i.test(rule)) return false;
    const firstTime = rule.search(/\d{1,2}:\d{2}/);
    if (firstTime === -1) return false;
    const dayPart = rule.slice(0, firstTime).replace(/,$/, '').trim();
    if (!dayMatches(dayPart, date)) return false;
    return [...rule.matchAll(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/g)].some(([, start, end]) => timeMatches(start, end, date));
  });
}

function branchMatchesHoursFilter(store: (typeof storeUniverse)[number], filter: OperatingHoursFilter, now = new Date()) {
  if (filter === 'all') return true;
  const hours = getBranchHours(store);
  if (filter === '24h') return is24HourBranch(hours);
  if (filter === 'open-now') return isOpenAt(hours, now);
  const evening = new Date(now);
  evening.setHours(19, 0, 0, 0);
  return isOpenAt(hours, evening);
}

export default async function StoresIndexPage({ searchParams = {} }: { searchParams?: SearchParams }) {
  const resolvedSearchParams = await searchParams;
  const activeHoursFilter = getHoursParam(resolvedSearchParams);
  const filteredStores = storeUniverse.filter((store) => branchMatchesHoursFilter(store, activeHoursFilter));
  const hoursCoverageCount = storeUniverse.filter((store) => getBranchHours(store)).length;
  const branchCounts = {
    openNow: storeUniverse.filter((store) => branchMatchesHoursFilter(store, 'open-now')).length,
    openEvening: storeUniverse.filter((store) => branchMatchesHoursFilter(store, 'open-evening')).length,
    twentyFourHour: storeUniverse.filter((store) => branchMatchesHoursFilter(store, '24h')).length
  };
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
          <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">Operating-hours filter</p>
          <h2 className="mt-2 text-2xl font-black">Avoid closed branches</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">Filter directory rows by branch-level OSM opening-hours metadata before comparing store options.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {operatingHoursFilters.map((filter) => (
              <Link className={`rounded-full px-3 py-2 text-sm font-black transition ${activeHoursFilter === filter.value ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`} href={filter.href} key={filter.value}>
                {filter.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 grid gap-2 text-sm font-bold text-slate-700 md:grid-cols-3">
            <p className="rounded-2xl bg-slate-50 p-3">Open now: {branchCounts.openNow}</p>
            <p className="rounded-2xl bg-slate-50 p-3">Open this evening: {branchCounts.openEvening}</p>
            <p className="rounded-2xl bg-slate-50 p-3">24h: {branchCounts.twentyFourHour}</p>
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-500">{hoursCoverageCount} branches expose operating-hours metadata. Current view: {filteredStores.length} stores.</p>
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
        <Card><h2 className="text-2xl font-black">Stores with coordinates</h2>{filteredStores.length > 0 ? <div className="mt-4 grid gap-3 md:grid-cols-2">{filteredStores.slice(0, 60).map((store) => <Link className="rounded-2xl border border-slate-200 p-4 hover:border-emerald-700" href={`/stores/${store.slug}`} key={store.slug}><p className="font-black">{store.name}</p><p className="text-sm text-slate-600">{store.brand} · {store.city || store.district || 'City not reported'}</p>{getBranchHours(store) ? <p className="mt-2 text-xs font-bold text-slate-500">Hours: {getBranchHours(store)}</p> : null}</Link>)}</div> : <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-950">No branches match this operating-hours filter with the verified metadata currently available.</p>}</Card>
      </div>
    </PageShell>
  );
}
