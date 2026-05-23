import Link from 'next/link';
import { Card, Eyebrow, PageShell, SourceCoverage } from '@/components/data-ui';
import { ConfidenceBadge } from '@/components/confidence-badge';
import {
  categoryDealLeaders,
  formatPct,
  formatSek,
  labelFromSlug,
  normalizeComparableUnitPrice,
  priceDropMoversBoard,
  snapshot,
  topChainSpreads
} from '@/lib/verified-data';
import { SCREENER_DEFAULT_CATEGORY, SCREENER_SORT_OPTIONS, normalizeScreenerCategory, normalizeScreenerSort, type ScreenerSortMode, screenerCategoryHref, screenerSortHref } from '@/lib/screener-query';
import { routeMetadata } from '@/lib/seo';

type SortMode = ScreenerSortMode;

type SearchParams = Record<string, string | string[] | undefined>;

type ScreenerRow = {
  id: string;
  productName: string;
  productSlug: string;
  categoryLabel: string;
  categorySlug: string;
  source: 'priceDropMoversBoard' | 'categoryDealLeaders' | 'topChainSpreads';
  metricLabel: string;
  priceLabel: string;
  compareLabel: string;
  evidenceLabel: string;
  sortValues: Record<SortMode, number>;
  confidence: {
    level: 'high' | 'medium' | 'low';
    label: string;
    sampleSize: number;
  };
};

const sortOptions = SCREENER_SORT_OPTIONS;

export function generateMetadata() {
  return routeMetadata('/screener');
}

function paramValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function selectedMode(value: string | undefined): SortMode {
  return normalizeScreenerSort(value);
}

function modeHref(mode: SortMode, category: string) {
  return screenerSortHref(mode, category);
}

function categoryHref(category: string, mode: SortMode) {
  return screenerCategoryHref(category, mode);
}

function formatUnitPrice(value: number, unitLabel: string) {
  return `${formatSek(value)}/${unitLabel.replace('kr/', '')}`;
}

function confidenceForSamples(sampleSize: number, mediumAt: number) {
  if (sampleSize >= mediumAt * 2) return 'high';
  if (sampleSize >= mediumAt) return 'medium';
  return 'low';
}

function slugFromLabel(label: string) {
  return label.toLowerCase().replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const dropRows: ScreenerRow[] = priceDropMoversBoard.map((mover) => ({
  id: `drop-${mover.productSlug}`,
  productName: mover.productName,
  productSlug: mover.productSlug,
  categoryLabel: mover.categoryLabel,
  categorySlug: slugFromLabel(mover.categoryLabel),
  source: 'priceDropMoversBoard',
  metricLabel: `${formatPct(mover.changePercent)} latest move`,
  priceLabel: `${formatSek(mover.latestPrice)} now`,
  compareLabel: `${formatSek(mover.previousPrice)} previous`,
  evidenceLabel: `${mover.observedCount} dated points · ${mover.rawObservationCount} raw observations · ${mover.legalCopy}`,
  sortValues: {
    'biggest-drop': Math.abs(mover.changePercent),
    'cheapest-per-kg': Number.POSITIVE_INFINITY,
    'widest-spread': 0
  },
  confidence: {
    level: confidenceForSamples(mover.rawObservationCount, 4),
    label: 'OpenPrices history',
    sampleSize: mover.rawObservationCount
  }
}));

const cheapestKgRows: ScreenerRow[] = topChainSpreads.flatMap((product) => {
  const unit = normalizeComparableUnitPrice(product.lowestPrice, product.subline);
  if (!unit || unit.unitLabel !== 'kr/kg') return [];
  return [{
    id: `kg-${product.slug}`,
    productName: product.name,
    productSlug: product.slug,
    categoryLabel: labelFromSlug(product.category),
    categorySlug: product.category,
    source: 'topChainSpreads',
    metricLabel: formatUnitPrice(unit.unitPrice, unit.unitLabel),
    priceLabel: `${formatSek(product.lowestPrice)} at ${product.lowestChain}`,
    compareLabel: `${formatPct(product.spreadPct)} spread`,
    evidenceLabel: `${product.brand || 'Brand not reported'} · ${product.subline || unit.packageLabel} · ${product.inChains.length} matched chains`,
    sortValues: {
      'biggest-drop': 0,
      'cheapest-per-kg': unit.unitSortPrice,
      'widest-spread': product.spreadPct
    },
    confidence: {
      level: product.inChains.length > 1 ? 'high' : 'medium',
      label: 'Matched chain kg price',
      sampleSize: product.inChains.length
    }
  }];
});

const spreadRows: ScreenerRow[] = topChainSpreads.map((product) => ({
  id: `spread-${product.slug}`,
  productName: product.name,
  productSlug: product.slug,
  categoryLabel: labelFromSlug(product.category),
  categorySlug: product.category,
  source: 'topChainSpreads',
  metricLabel: `${formatPct(product.spreadPct)} spread`,
  priceLabel: `${formatSek(product.lowestPrice)} lowest`,
  compareLabel: `${formatSek(product.highestPrice)} highest`,
  evidenceLabel: `${product.lowestChain} lowest across ${product.inChains.join(' + ')} · ${product.subline || 'Package size not reported'}`,
  sortValues: {
    'biggest-drop': 0,
    'cheapest-per-kg': normalizeComparableUnitPrice(product.lowestPrice, product.subline)?.unitSortPrice ?? Number.POSITIVE_INFINITY,
    'widest-spread': product.spreadPct
  },
  confidence: {
    level: product.inChains.length > 1 ? 'high' : 'medium',
    label: 'Cross-chain match',
    sampleSize: product.inChains.length
  }
}));

const rowsByMode: Record<SortMode, ScreenerRow[]> = {
  'biggest-drop': dropRows,
  'cheapest-per-kg': cheapestKgRows,
  'widest-spread': spreadRows
};

const categoryOptions = [
  ...new Map(
    [...dropRows, ...cheapestKgRows, ...spreadRows, ...categoryDealLeaders.map((leader) => ({
      categorySlug: leader.categorySlug,
      categoryLabel: leader.categoryLabel
    }))]
      .map((row) => [row.categorySlug, { slug: row.categorySlug, label: row.categoryLabel }])
  ).values()
].sort((left, right) => left.label.localeCompare(right.label, 'sv'));

const leaderByCategory = new Map(categoryDealLeaders.map((leader) => [leader.categorySlug, leader]));

function sortedRows(mode: SortMode, category: string) {
  const filtered = rowsByMode[mode].filter((row) => category === SCREENER_DEFAULT_CATEGORY || row.categorySlug === category);
  return [...filtered].sort((left, right) => {
    if (mode === 'cheapest-per-kg') {
      return left.sortValues[mode] - right.sortValues[mode] || left.productName.localeCompare(right.productName, 'sv');
    }
    return right.sortValues[mode] - left.sortValues[mode] || left.productName.localeCompare(right.productName, 'sv');
  });
}

export default async function ScreenerPage({ searchParams }: Readonly<{ searchParams?: Promise<SearchParams> }>) {
  const params = (await searchParams) ?? {};
  const mode = selectedMode(paramValue(params.sort));
  const requestedCategory = paramValue(params.category) ?? SCREENER_DEFAULT_CATEGORY;
  const category = normalizeScreenerCategory(requestedCategory, categoryOptions.map((option) => option.slug));
  const visibleRows = sortedRows(mode, category);
  const selectedLeader = category !== SCREENER_DEFAULT_CATEGORY ? leaderByCategory.get(category) : null;

  return (
    <PageShell>
      <Eyebrow>Deal screener</Eyebrow>
      <div className="mt-2 grid gap-5 lg:grid-cols-[1fr_0.36fr] lg:items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Sort verified deals by the signal that matters now</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
            This table reuses priceDropMoversBoard, categoryDealLeaders, and topChainSpreads from the verified data module. It only ranks observed rows: no forecasted prices, scraped placeholders, or synthetic discounts are mixed in.
          </p>
        </div>
        <Card className="p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Snapshot</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{snapshot.retrievedLabel}</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{snapshot.axfoodSource}</p>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Sort</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {sortOptions.map((option) => (
                <Link
                  className={`rounded-lg border px-4 py-2 text-sm font-black ${mode === option.mode ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-emerald-700'}`}
                  href={modeHref(option.mode, category)}
                  key={option.mode}
                >
                  {option.label}
                </Link>
              ))}
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-600">
              {sortOptions.find((option) => option.mode === mode)?.detail}
            </p>
          </div>

          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Category filter</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                className={`rounded-lg border px-3 py-2 text-xs font-black ${category === SCREENER_DEFAULT_CATEGORY ? 'border-emerald-900 bg-emerald-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-emerald-700'}`}
                href={categoryHref(SCREENER_DEFAULT_CATEGORY, mode)}
              >
                All
              </Link>
              {categoryOptions.map((option) => (
                <Link
                  className={`rounded-lg border px-3 py-2 text-xs font-black ${category === option.slug ? 'border-emerald-900 bg-emerald-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-emerald-700'}`}
                  href={categoryHref(option.slug, mode)}
                  key={option.slug}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="mt-6 overflow-hidden p-0">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Ranked deal table</h2>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                Showing {visibleRows.length} rows sorted by {sortOptions.find((option) => option.mode === mode)?.label.toLowerCase()}.
              </p>
            </div>
            <ConfidenceBadge
              level={visibleRows.some((row) => row.confidence.level === 'low') ? 'medium' : 'high'}
              label="Verified source rows"
              sampleSize={visibleRows.reduce((sum, row) => sum + row.confidence.sampleSize, 0)}
            />
          </div>
        </div>

        <div className="overflow-hidden sm:overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-3 text-left text-sm sm:min-w-[920px] sm:border-collapse sm:border-spacing-y-0">
            <thead className="hidden bg-slate-50 text-xs font-black uppercase tracking-[0.16em] text-slate-500 sm:table-header-group">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Signal</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Comparison</th>
                <th className="px-5 py-3">Confidence</th>
              </tr>
            </thead>
            <tbody className="block sm:table-row-group sm:divide-y sm:divide-slate-200">
              {visibleRows.map((row) => (
                <tr className="block rounded-2xl border border-slate-200 bg-white p-4 align-top shadow-sm hover:bg-emerald-50/50 sm:table-row sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none" key={row.id}>
                  <td className="block px-0 py-2 sm:table-cell sm:px-5 sm:py-4">
                    <span className="mb-1 block text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500 sm:hidden">Product</span>
                    <Link className="text-base font-black text-slate-950 underline decoration-slate-300 underline-offset-4 hover:text-emerald-800" href={`/products/${row.productSlug}`}>
                      {row.productName}
                    </Link>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{row.categoryLabel}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-500">source: {row.source}</p>
                  </td>
                  <td className="block px-0 py-2 sm:table-cell sm:px-5 sm:py-4">
                    <span className="mb-1 block text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500 sm:hidden">Signal</span>
                    <p className="text-lg font-black text-emerald-800">{row.metricLabel}</p>
                    <p className="mt-2 max-w-xs text-xs font-semibold leading-5 text-slate-600">{row.evidenceLabel}</p>
                  </td>
                  <td className="block px-0 py-2 font-black text-slate-950 sm:table-cell sm:px-5 sm:py-4">
                    <span className="mb-1 block text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500 sm:hidden">Price</span>
                    {row.priceLabel}
                  </td>
                  <td className="block px-0 py-2 font-semibold text-slate-700 sm:table-cell sm:px-5 sm:py-4">
                    <span className="mb-1 block text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500 sm:hidden">Comparison</span>
                    {row.compareLabel}
                  </td>
                  <td className="block px-0 py-2 sm:table-cell sm:px-5 sm:py-4">
                    <span className="mb-1 block text-[0.68rem] font-black uppercase tracking-[0.16em] text-slate-500 sm:hidden">Confidence</span>
                    <ConfidenceBadge level={row.confidence.level} label={row.confidence.label} sampleSize={row.confidence.sampleSize} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.7fr_1fr]">
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Category leaders</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Deal leader context</h2>
          {selectedLeader ? (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-lg font-black text-slate-950">{selectedLeader.productName}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{selectedLeader.evidenceLabel}</p>
              <p className="mt-3 text-sm font-black text-emerald-900">{selectedLeader.signal} · dealScore {selectedLeader.dealScore}</p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {categoryDealLeaders.slice(0, 5).map((leader) => (
                <Link className="block rounded-lg border border-slate-200 bg-slate-50 p-3 hover:border-emerald-700" href={`/products/${leader.productSlug}`} key={`${leader.categorySlug}-${leader.productSlug}`}>
                  <p className="font-black text-slate-950">{leader.categoryLabel}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{leader.productName} · {leader.signal}</p>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Coverage guardrail</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">What the screener will and will not claim</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <p className="rounded-lg bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-700">
              Biggest drop rows come from dated OpenPrices observations and show observed lows only.
            </p>
            <p className="rounded-lg bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-700">
              Cheapest per kg rows require a parseable kg package size and a real matched chain price.
            </p>
            <p className="rounded-lg bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-700">
              Widest spread rows compare matched Willys and Hemkop products; unmatched SKUs stay out.
            </p>
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
