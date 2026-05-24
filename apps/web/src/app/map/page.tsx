import Link from 'next/link';
import { calculateChainPriceIndex } from '@groceryview/core';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { StoreMap } from '@/components/store-map';
import { buildChainPriceObservations } from '@/lib/chain-index-data';
import { basketCostHeatmap } from '@/lib/map-basket-cost-heatmap';
import { formatPct, storePricePercentileRanks, storeUniverse } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
type OperatingHoursFilter = 'all' | 'open-now' | 'open-evening' | '24h';

const operatingHoursFilters: { href: string; label: string; value: OperatingHoursFilter }[] = [
  { href: '/map', label: 'All stores', value: 'all' },
  { href: '/map?hours=open-now', label: 'Open now', value: 'open-now' },
  { href: '/map?hours=open-evening', label: 'Open this evening', value: 'open-evening' },
  { href: '/map?hours=24h', label: '24h', value: '24h' }
];

export function generateMetadata() {
  return routeMetadata('/map');
}

const chainIndexSummary = calculateChainPriceIndex(buildChainPriceObservations());
const chainIndexByBrand = new Map(chainIndexSummary.chains.map((chain) => [chain.chainId.toLowerCase(), chain]));
const cheapestChainNearMe = chainIndexSummary.chains[0];
const cheapestBranchNearMe = storePricePercentileRanks[0] ?? null;
const districtHeatOverlay = buildDistrictHeatOverlay();
const regionalPriceStatisticsGate = buildRegionalPriceStatisticsGate();

function normaliseBrand(brand: string) {
  const lower = brand.toLowerCase();
  if (lower.includes('ica')) return 'ica';
  if (lower.includes('coop')) return 'coop';
  if (lower.includes('willys')) return 'willys';
  if (lower.includes('hemköp') || lower.includes('hemkop')) return 'hemköp';
  if (lower.includes('lidl')) return 'lidl';
  if (lower.includes('city gross')) return 'city gross';
  if (lower.includes('tempo')) return 'tempo';
  return lower;
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

function markerTone(index?: number) {
  if (index === undefined) return 'border-slate-200 bg-slate-50 text-slate-700';
  if (index < 96) return 'border-emerald-300 bg-emerald-50 text-emerald-950';
  if (index > 104) return 'border-rose-300 bg-rose-50 text-rose-950';
  return 'border-amber-300 bg-amber-50 text-amber-950';
}

function heatTone(index: number) {
  if (index < 96) return 'bg-emerald-100 text-emerald-950';
  if (index > 104) return 'bg-rose-100 text-rose-950';
  return 'bg-amber-100 text-amber-950';
}

function basketHeatTone(tone: string) {
  if (tone === 'cool') return 'border-emerald-200 bg-emerald-50 text-emerald-950';
  if (tone === 'hot') return 'border-rose-200 bg-rose-50 text-rose-950';
  return 'border-amber-200 bg-amber-50 text-amber-950';
}

function buildDistrictHeatOverlay() {
  const districts = new Map<string, { totalStores: number; coveredStores: number; indexTotal: number; chains: Set<string> }>();
  for (const store of storeUniverse) {
    const district = store.district || store.city || 'Unknown district';
    const current = districts.get(district) ?? { totalStores: 0, coveredStores: 0, indexTotal: 0, chains: new Set<string>() };
    current.totalStores += 1;
    const chain = chainIndexByBrand.get(normaliseBrand(store.brand));
    if (chain) {
      current.coveredStores += 1;
      current.indexTotal += chain.overallIndex;
      current.chains.add(chain.chainId);
    }
    districts.set(district, current);
  }

  return [...districts.entries()]
    .map(([district, row]) => ({
      district,
      totalStores: row.totalStores,
      coveredStores: row.coveredStores,
      averageIndex: row.coveredStores > 0 ? row.indexTotal / row.coveredStores : 100,
      chainCount: row.chains.size,
      coverageShare: row.totalStores > 0 ? row.coveredStores / row.totalStores : 0
    }))
    .filter((row) => row.coveredStores > 0)
    .sort((a, b) => a.averageIndex - b.averageIndex || b.coveredStores - a.coveredStores)
    .slice(0, 12);
}

function buildRegionalCoverageRows(scope: 'city' | 'district') {
  const cohorts = new Map<string, { totalStores: number; coveredStores: number; chains: Set<string> }>();
  for (const store of storeUniverse) {
    const label = scope === 'city' ? store.city || 'City not reported' : store.district || store.city || 'District not reported';
    const current = cohorts.get(label) ?? { totalStores: 0, coveredStores: 0, chains: new Set<string>() };
    current.totalStores += 1;
    const chain = chainIndexByBrand.get(normaliseBrand(store.brand));
    if (chain) {
      current.coveredStores += 1;
      current.chains.add(chain.chainId);
    }
    cohorts.set(label, current);
  }

  return [...cohorts.entries()]
    .map(([label, row]) => ({
      label,
      totalStores: row.totalStores,
      coveredStores: row.coveredStores,
      chainCount: row.chains.size,
      coverageShare: row.totalStores > 0 ? row.coveredStores / row.totalStores : 0,
      statisticLabel: 'Not calculated',
      detail: 'Coverage-only row: OSM locations and chain-index availability are visible, but no per-branch observations are attached to this region.'
    }))
    .sort((a, b) => b.coveredStores - a.coveredStores || b.totalStores - a.totalStores || a.label.localeCompare(b.label, 'sv'))
    .slice(0, 6);
}

function buildRegionalPriceStatisticsGate() {
  const cityPriceStatisticRows = buildRegionalCoverageRows('city');
  const districtPriceStatisticRows = buildRegionalCoverageRows('district');

  return {
    title: 'Regional / district / city price statistics',
    statusLabel: 'Not enough per-branch observations',
    cityPriceStatisticRows,
    districtPriceStatisticRows,
    requiredEvidence: [
      'per-branch observations for products or baskets inside each city, district, and kommun cohort',
      'stable city/district/kommun mapping for every store row before regional statistics are compared',
      'confidence/coverage thresholds that block sparse cohorts instead of ranking them as cheap or expensive'
    ],
    detail:
      'No regional price statistic is calculated without per-branch observations. The map can show OSM coverage and chain-index proxies today, but city, district, and kommun price statistics stay withheld until branch-level price tape exists.'
  };
}

export default async function MapPage({ searchParams = {} }: { searchParams?: SearchParams }) {
  const resolvedSearchParams = await searchParams;
  const activeHoursFilter = getHoursParam(resolvedSearchParams);
  const visibleStores = storeUniverse.filter((store) => branchMatchesHoursFilter(store, activeHoursFilter)).slice(0, 80);
  const hoursCoverageCount = storeUniverse.filter((store) => getBranchHours(store)).length;
  const branchCounts = {
    openNow: storeUniverse.filter((store) => branchMatchesHoursFilter(store, 'open-now')).length,
    openEvening: storeUniverse.filter((store) => branchMatchesHoursFilter(store, 'open-evening')).length,
    twentyFourHour: storeUniverse.filter((store) => branchMatchesHoursFilter(store, '24h')).length
  };
  return (
    <PageShell>
      <Eyebrow>Map data</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Store coordinates with chain-index signals</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        The website has verified latitude and longitude for OSM stores. Markers are colored by the chain-level price index only; branch-level prices, route times, and store quality scores are not invented.
      </p>

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">Operating-hours filter</p>
            <h2 className="mt-2 text-3xl font-black text-emerald-950">Compare branches that are open when you shop</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-emerald-900">
              The branch comparison cards below can be filtered by OSM opening-hours metadata for open now, open this evening, or 24h branches so route planning does not point at closed stores.
            </p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 text-right">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">Visible comparison rows</p>
            <p className="mt-2 text-4xl font-black text-emerald-950">{visibleStores.length}</p>
            <p className="mt-2 text-sm font-semibold text-emerald-900">{hoursCoverageCount} branches include hours metadata</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {operatingHoursFilters.map((filter) => (
            <Link className={`rounded-full px-3 py-2 text-sm font-black transition ${activeHoursFilter === filter.value ? 'bg-emerald-700 text-white' : 'bg-white/80 text-emerald-950 hover:bg-white'}`} href={filter.href} key={filter.value}>
              {filter.label}
            </Link>
          ))}
        </div>
        <div className="mt-4 grid gap-2 text-sm font-bold text-emerald-950 md:grid-cols-3">
          <p className="rounded-2xl bg-white/80 p-3">Open now: {branchCounts.openNow}</p>
          <p className="rounded-2xl bg-white/80 p-3">Open this evening: {branchCounts.openEvening}</p>
          <p className="rounded-2xl bg-white/80 p-3">24h: {branchCounts.twentyFourHour}</p>
        </div>
      </Card>

      <Card className="mt-6 overflow-hidden border-slate-200 bg-slate-950 p-0 text-white">
        <div className="grid gap-4 p-6 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-300">Synced map + list</p>
            <h2 className="mt-2 text-3xl font-black">Interactive store map with linked list selection</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
              The map ↔ list sync uses verified OSM coordinates and chain-index proxy colors. Selecting a list row moves the map; selecting a marker updates the linked row without inventing branch-level basket prices.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 text-right">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-200">Selection model</p>
            <p className="mt-2 text-2xl font-black text-white">Account-safe map UX</p>
            <p className="mt-2 text-sm font-semibold text-slate-200">No private shopper location is read by default.</p>
          </div>
        </div>
        <div className="h-[620px] overflow-hidden border-t border-white/10 bg-slate-900">
          <StoreMap />
        </div>
      </Card>

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">Cheapest chain near me</p>
            <h2 className="mt-2 text-3xl font-black text-emerald-950">{cheapestChainNearMe?.chainId ?? 'No chain index available'}</h2>
            <p className="mt-2 text-sm font-semibold text-emerald-900">
              Based on calculateChainPriceIndex over normalized chain observations, not individual branch checkout quotes.
            </p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 text-right">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">Index score</p>
            <p className="mt-2 text-4xl font-black text-emerald-950">{cheapestChainNearMe ? cheapestChainNearMe.overallIndex.toFixed(1) : 'n/a'}</p>
            <p className="mt-2 text-sm font-semibold text-emerald-900">{cheapestChainNearMe ? `${cheapestChainNearMe.confidence} confidence · ${cheapestChainNearMe.categoriesCovered} categories` : 'No coverage'}</p>
          </div>
        </div>
      </Card>

      <Card className="mt-6 border-lime-200 bg-lime-50">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-lime-700">Cheapest branch near me</p>
            <h2 className="mt-2 text-3xl font-black text-lime-950">
              {cheapestBranchNearMe?.storeName ?? 'No branch-level candidate yet'}
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-lime-900">
              This branch-level evidence uses per-branch Lidl offer observations matched to OSM store rows; it does not claim a shopper location or route time.
              No private location is read until the shopper explicitly approves location context.
            </p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 text-right">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-lime-700">Branch evidence</p>
            <p className="mt-2 text-2xl font-black text-lime-950">
              {cheapestBranchNearMe ? `${cheapestBranchNearMe.cheaperThanNationalLabel} cheaper than national cohort` : 'Blocked'}
            </p>
            <p className="mt-2 text-sm font-semibold text-lime-900">
              {cheapestBranchNearMe ? cheapestBranchNearMe.coverageLabel : 'No per-branch Lidl offer observations matched to OSM yet'}
            </p>
          </div>
        </div>
        {cheapestBranchNearMe ? (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-700">Kommun cohort</p>
              <p className="mt-2 text-lg font-black text-slate-950">{cheapestBranchNearMe.kommun}</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">{cheapestBranchNearMe.kommunCohortSize} stores · {cheapestBranchNearMe.cheaperThanKommunLabel} cheaper than kommun cohort</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-700">National percentile</p>
              <p className="mt-2 text-lg font-black text-slate-950">{cheapestBranchNearMe.nationalPricePercentileLabel}</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">{cheapestBranchNearMe.statusLabel}</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-700">Source confidence</p>
              <p className="mt-2 text-lg font-black text-slate-950">{cheapestBranchNearMe.confidenceLabel}</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">{cheapestBranchNearMe.source}</p>
            </div>
          </div>
        ) : null}
      </Card>

      <Card className="mt-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">District price heat overlay</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              District heat uses OSM store districts plus each store brand's chain-index proxy. It is not a branch-price claim; districts with missing chain coverage are excluded from the ranked overlay.
            </p>
          </div>
          <p className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-700">chain-index proxy</p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {districtHeatOverlay.map((district) => (
            <div className={`rounded-2xl p-4 ${heatTone(district.averageIndex)}`} key={district.district}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black">{district.district}</p>
                  <p className="mt-1 text-sm font-semibold opacity-80">{district.coveredStores} of {district.totalStores} stores covered · {district.chainCount} chains</p>
                </div>
                <p className="text-3xl font-black">{district.averageIndex.toFixed(1)}</p>
              </div>
              <p className="mt-3 text-xs font-semibold opacity-80">Coverage {formatPct(district.coverageShare * 100)} of OSM stores in district.</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-fuchsia-200 bg-fuchsia-50">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-fuchsia-800">{basketCostHeatmap.statusLabel}</p>
            <h2 className="mt-2 text-3xl font-black text-fuchsia-950">Basket-cost heatmap by area</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-fuchsia-900">
              The map now shows area rows from the visible weekly basket optimizer. compareBasketStrategies and summarizeStoreBasketCoverage price only known favorite-store rows, so missing basket products stay visible as coverage gaps. No branch-level basket quote is claimed.
            </p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 text-right">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-fuchsia-800">Basket rows</p>
            <p className="mt-2 text-3xl font-black text-fuchsia-950">{basketCostHeatmap.rows.length}</p>
            <p className="mt-2 text-sm font-semibold text-fuchsia-900">{basketCostHeatmap.basketLineCount} basket lines · {basketCostHeatmap.favoriteStoreCount} favorite stores</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {basketCostHeatmap.rows.map((row) => (
            <div className={`rounded-2xl border p-4 ${basketHeatTone(row.heatTone)}`} data-basket-cost-heatmap={row.area} key={row.storeId}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] opacity-70">{row.area}</p>
                  <p className="mt-2 text-lg font-black">{row.storeName}</p>
                </div>
                <p className="rounded-full bg-white/85 px-3 py-2 text-xl font-black">{row.relativeBasketIndex.toFixed(1)}</p>
              </div>
              <p className="mt-3 text-sm font-black">{row.knownBasketTotal.toFixed(2)} SEK known basket total</p>
              <p className="mt-1 text-xs font-semibold leading-5 opacity-80">
                Coverage {formatPct(row.coveragePercent)} · {row.pricedProductCount} priced · {row.missingProductCount} missing.
              </p>
              <p className="mt-3 rounded-xl bg-white/75 p-2 text-xs font-bold leading-5 opacity-80">{row.areaEvidence}</p>
            </div>
          ))}
        </div>
        <ul className="mt-4 grid gap-2 md:grid-cols-3">
          {basketCostHeatmap.guardrails.map((guardrail) => (
            <li className="rounded-2xl bg-white/80 p-3 text-xs font-bold leading-5 text-fuchsia-950" key={guardrail}>{guardrail}</li>
          ))}
        </ul>
      </Card>

      <Card className="mt-6 border-sky-200 bg-sky-50">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-700">{regionalPriceStatisticsGate.title}</p>
            <h2 className="mt-2 text-3xl font-black text-sky-950">Regional price statistics gate</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-sky-900">{regionalPriceStatisticsGate.detail}</p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 text-right">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-700">Status</p>
            <p className="mt-2 text-2xl font-black text-sky-950">{regionalPriceStatisticsGate.statusLabel}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-white/85 p-4">
            <h3 className="text-lg font-black text-sky-950">City statistics coverage</h3>
            <div className="mt-3 grid gap-3">
              {regionalPriceStatisticsGate.cityPriceStatisticRows.map((city) => (
                <div className="rounded-2xl border border-sky-100 p-3" key={city.label}>
                  <p className="font-black text-slate-950">{city.label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{city.coveredStores} of {city.totalStores} stores chain-index covered · {city.chainCount} chains</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Coverage {formatPct(city.coverageShare * 100)} · statistic {city.statisticLabel}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{city.detail}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-white/85 p-4">
            <h3 className="text-lg font-black text-sky-950">District statistics coverage</h3>
            <div className="mt-3 grid gap-3">
              {regionalPriceStatisticsGate.districtPriceStatisticRows.map((district) => (
                <div className="rounded-2xl border border-sky-100 p-3" key={district.label}>
                  <p className="font-black text-slate-950">{district.label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{district.coveredStores} of {district.totalStores} stores chain-index covered · {district.chainCount} chains</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Coverage {formatPct(district.coverageShare * 100)} · statistic {district.statisticLabel}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{district.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 rounded-2xl bg-white/85 p-4">
          <p className="text-sm font-black text-sky-950">Required confidence/coverage before regional stats unlock</p>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-sky-900">
            {regionalPriceStatisticsGate.requiredEvidence.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </Card>

      <Card className="mt-6">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {visibleStores.length > 0 ? visibleStores.map((store) => {
            const chain = chainIndexByBrand.get(normaliseBrand(store.brand));
            return (
              <div className={`rounded-2xl border p-4 ${markerTone(chain?.overallIndex)}`} key={store.slug}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{store.name}</p>
                    <p className="text-sm opacity-80">{store.lat.toFixed(5)}, {store.lng.toFixed(5)}</p>
                    <p className="text-sm opacity-80">{store.brand}</p>
                  </div>
                  <span className="rounded-full bg-white/80 px-2 py-1 text-xs font-black">{chain ? chain.overallIndex.toFixed(0) : '—'}</span>
                </div>
                <p className="mt-3 text-xs font-semibold opacity-80">{chain ? `${formatPct(chain.overallIndex - 100)} vs market index · ${chain.confidence} confidence` : 'No chain-index coverage for this brand'}</p>
              </div>
            );
          }) : <p className="rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-950">No branches match this operating-hours filter with the verified metadata currently available.</p>}
        </div>
      </Card>
    </PageShell>
  );
}
