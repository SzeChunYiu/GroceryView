import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowUp, Bell, PackageSearch } from 'lucide-react';
import { Eyebrow, PageShell } from '@/components/data-ui';
import {
  formatPct,
  formatSek,
  marketMoverFilterOptions,
  weeklyPriceMoversBoard
} from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

type SearchParams = Record<string, string | string[] | undefined>;

export function generateMetadata() {
  return routeMetadata({
    path: '/movers',
    title: 'Weekly grocery price movers | GroceryView',
    description: 'Track observed weekly grocery price drops and rises with category, source, unit-price, and minimum-coverage filters.'
  });
}

function paramValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function intParam(value: string | string[] | undefined, fallback: number) {
  const parsed = Number.parseInt(paramValue(value) ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function moversHref(overrides: Record<string, string | null>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(overrides)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `/movers?${query}` : '/movers';
}

function filterHref(current: {
  category: string;
  chain: string;
  coverage: number;
  direction: string;
  unit: string;
}, overrides: Partial<Record<'category' | 'chain' | 'coverage' | 'direction' | 'unit', string | null>>) {
  return moversHref({
    category: overrides.category === null ? null : overrides.category ?? current.category,
    chain: overrides.chain === null ? null : overrides.chain ?? current.chain,
    coverage: overrides.coverage === null ? null : overrides.coverage ?? String(current.coverage),
    direction: overrides.direction === null ? null : overrides.direction ?? current.direction,
    unit: overrides.unit === null ? null : overrides.unit ?? current.unit
  });
}

function filterChipClass(active: boolean) {
  return `inline-flex items-center rounded-full border px-3 py-2 text-xs font-black transition ${
    active
      ? 'border-slate-950 bg-slate-950 text-white'
      : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-700 hover:text-emerald-900'
  }`;
}

export default async function MoversPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const resolved = (await (searchParams ?? Promise.resolve({}))) as SearchParams;
  const selectedDirection = paramValue(resolved.direction) ?? 'all';
  const selectedCategory = paramValue(resolved.category) ?? '';
  const selectedChain = paramValue(resolved.chain) ?? 'openprices';
  const selectedUnit = paramValue(resolved.unit) ?? 'all';
  const minimumCoverage = intParam(resolved.coverage, 2);
  const currentFilters = {
    category: selectedCategory,
    chain: selectedChain,
    coverage: minimumCoverage,
    direction: selectedDirection,
    unit: selectedUnit
  };
  const filteredMovers = weeklyPriceMoversBoard
    .filter((mover) => selectedDirection === 'all' || mover.direction === selectedDirection)
    .filter((mover) => !selectedCategory || mover.categorySlug === selectedCategory)
    .filter((mover) => !selectedChain || mover.chainId === selectedChain)
    .filter((mover) => selectedUnit !== 'unit' || mover.unitPrice !== null)
    .filter((mover) => mover.observedCount >= minimumCoverage);
  const drops = filteredMovers.filter((mover) => mover.direction === 'drop').length;
  const rises = filteredMovers.filter((mover) => mover.direction === 'rise').length;
  const topMove = filteredMovers[0];

  return (
    <PageShell>
      <Eyebrow>Market movers</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Weekly drops and rises from observed grocery history</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Movers are calculated from dated OpenPrices observations only. Rows without enough history stay out of the board, and unit-price filters only show products with parseable package quantities.
      </p>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-xs font-black uppercase text-emerald-800">Drops</p>
          <p className="mt-2 text-4xl font-black text-emerald-950">{drops}</p>
        </div>
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-5">
          <p className="text-xs font-black uppercase text-rose-800">Rises</p>
          <p className="mt-2 text-4xl font-black text-rose-950">{rises}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <p className="text-xs font-black uppercase text-slate-600">Minimum coverage</p>
          <p className="mt-2 text-4xl font-black text-slate-950">{minimumCoverage}</p>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <div className="grid gap-4 lg:grid-cols-5">
          <div>
            <p className="text-xs font-black uppercase text-slate-500">Direction</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {['all', 'drop', 'rise'].map((direction) => (
                <Link className={filterChipClass(selectedDirection === direction)} href={filterHref(currentFilters, { direction })} key={direction}>
                  {direction}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-black uppercase text-slate-500">Source</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {marketMoverFilterOptions.chains.map((chain) => (
                <Link className={filterChipClass(selectedChain === chain.value)} href={filterHref(currentFilters, { chain: chain.value })} key={chain.value}>
                  {chain.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2">
            <p className="text-xs font-black uppercase text-slate-500">Category</p>
            <div className="mt-3 flex max-h-24 flex-wrap gap-2 overflow-y-auto pr-1">
              <Link className={filterChipClass(!selectedCategory)} href={filterHref(currentFilters, { category: null })}>All</Link>
              {marketMoverFilterOptions.categories.map((category) => (
                <Link className={filterChipClass(selectedCategory === category.value)} href={filterHref(currentFilters, { category: category.value })} key={category.value}>
                  {category.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-black uppercase text-slate-500">Coverage and unit</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {marketMoverFilterOptions.coverage.map((coverage) => (
                <Link className={filterChipClass(minimumCoverage === coverage)} href={filterHref(currentFilters, { coverage: String(coverage) })} key={coverage}>
                  {coverage}+ pts
                </Link>
              ))}
              <Link className={filterChipClass(selectedUnit === 'unit')} href={filterHref(currentFilters, { unit: selectedUnit === 'unit' ? null : 'unit' })}>
                Unit price
              </Link>
            </div>
          </div>
        </div>
      </section>

      {topMove ? (
        <section className="mt-6 rounded-lg border border-indigo-200 bg-indigo-50 p-5">
          <p className="text-xs font-black uppercase text-indigo-800">Largest visible move</p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-indigo-950">{topMove.productName}</h2>
              <p className="mt-2 text-sm font-bold text-indigo-950">{formatSek(topMove.previousPrice)} to {formatSek(topMove.latestPrice)} · {formatPct(topMove.changePercent)}</p>
            </div>
            <Link className="inline-flex items-center gap-2 rounded-full bg-indigo-800 px-4 py-2 text-sm font-black text-white" href={`/products/${topMove.productSlug}`}>
              <PackageSearch className="h-4 w-4" aria-hidden="true" />
              Product
            </Link>
          </div>
        </section>
      ) : null}

      <section className="mt-6 grid gap-3">
        {filteredMovers.map((mover) => {
          const DirectionIcon = mover.direction === 'drop' ? ArrowDown : ArrowUp;
          const tone = mover.direction === 'drop'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
            : 'border-rose-200 bg-rose-50 text-rose-950';

          return (
            <article className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[5rem_1fr_auto]" data-market-mover={mover.productSlug} key={`${mover.direction}-${mover.productSlug}`}>
              <div className="relative h-20 w-20 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                {mover.imageUrl ? <Image alt={`${mover.productName} package`} className="object-contain p-1" fill sizes="80px" src={mover.imageUrl} /> : null}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-black ${tone}`}>
                    <DirectionIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    {formatPct(mover.changePercent)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-700">{mover.categoryLabel}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-700">{mover.chainLabel}</span>
                </div>
                <h3 className="mt-2 text-xl font-black text-slate-950">{mover.productName}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {formatSek(mover.previousPrice)} to {formatSek(mover.latestPrice)}
                  {mover.unitPrice !== null && mover.unitLabel ? ` · ${formatSek(mover.unitPrice)} ${mover.unitLabel.replace('kr/', 'per ')}` : ''}
                </p>
                <p className="mt-2 text-xs font-bold leading-5 text-slate-600">{mover.evidenceLabel} · {mover.packageLabel}</p>
              </div>
              <div className="flex flex-row gap-2 md:flex-col md:items-end">
                <Link className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" href={`/products/${mover.productSlug}`}>
                  <PackageSearch className="h-4 w-4" aria-hidden="true" />
                  View
                </Link>
                <Link className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-800" href={`/unit-price-alerts?product=${encodeURIComponent(mover.productSlug)}`}>
                  <Bell className="h-4 w-4" aria-hidden="true" />
                  Alert
                </Link>
              </div>
            </article>
          );
        })}
      </section>
    </PageShell>
  );
}
