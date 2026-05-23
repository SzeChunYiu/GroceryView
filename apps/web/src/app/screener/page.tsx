import Link from 'next/link';
import { ConfidenceBadge } from '@/components/confidence-badge';
import { Card, Eyebrow, PageShell, SourceCoverage } from '@/components/data-ui';
import {
  categoryDealLeaders,
  formatPct,
  formatSek,
  normalizeComparableUnitPrice,
  priceDropMoversBoard,
  topChainSpreads
} from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

type SearchParams = Record<string, string | string[] | undefined>;
type ScreenerMode = 'biggest-drop' | 'cheapest-per-kg' | 'widest-spread';
type ConfidenceLevel = 'high' | 'medium' | 'low';

type ScreenerRow = {
  id: string;
  mode: ScreenerMode;
  productSlug: string;
  productName: string;
  categorySlug: string;
  categoryLabel: string;
  chainLabel: string;
  primaryMetric: string;
  secondaryMetric: string;
  priceLabel: string;
  evidence: string;
  confidence: ConfidenceLevel;
  confidenceLabel: string;
  sampleSize: number;
  sortValue: number;
};

const modes: Array<{ value: ScreenerMode; label: string; detail: string }> = [
  { value: 'biggest-drop', label: 'Biggest drop', detail: 'Latest observed OpenPrices decline' },
  { value: 'cheapest-per-kg', label: 'Cheapest per kg', detail: 'Lowest comparable kg price' },
  { value: 'widest-spread', label: 'Widest spread', detail: 'Largest Willys/Hemkop gap' }
];

export function generateMetadata() {
  return routeMetadata('/screener');
}

export const dynamic = 'force-static';

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function selectedMode(value: string | undefined): ScreenerMode {
  return modes.some((mode) => mode.value === value) ? (value as ScreenerMode) : 'biggest-drop';
}

function confidenceFromObservationCount(count: number): ConfidenceLevel {
  if (count >= 8) return 'high';
  if (count >= 4) return 'medium';
  return 'low';
}

function confidenceFromSourceScore(score: number): ConfidenceLevel {
  if (score >= 0.8) return 'high';
  if (score >= 0.6) return 'medium';
  return 'low';
}

function screenerHref(mode: ScreenerMode, category: string) {
  const params = new URLSearchParams({ sort: mode });
  if (category !== 'all') params.set('category', category);
  return `/screener?${params.toString()}`;
}

const leaderByProductSlug = new Map(categoryDealLeaders.map((leader) => [leader.productSlug, leader]));

const dropRows: ScreenerRow[] = priceDropMoversBoard.map((mover) => {
  const confidence = confidenceFromObservationCount(mover.rawObservationCount);
  const leader = leaderByProductSlug.get(mover.productSlug);
  return {
    id: `drop-${mover.productSlug}`,
    mode: 'biggest-drop',
    productSlug: mover.productSlug,
    productName: mover.productName,
    categorySlug: leader?.categorySlug ?? mover.categoryLabel.toLowerCase().replace(/\s+/g, '-'),
    categoryLabel: mover.categoryLabel,
    chainLabel: 'OpenPrices',
    primaryMetric: `${formatPct(mover.changePercent)} move`,
    secondaryMetric: mover.isNewLow ? 'New observed low' : `${formatSek(mover.previousPrice)} previous`,
    priceLabel: formatSek(mover.latestPrice),
    evidence: `${mover.observedCount} dated points; ${mover.rawObservationCount} raw observations; ${mover.legalCopy}`,
    confidence,
    confidenceLabel: `${confidence} confidence`,
    sampleSize: mover.rawObservationCount,
    sortValue: Math.abs(mover.changePercent)
  };
});

const cheapestPerKgRows: ScreenerRow[] = topChainSpreads.flatMap((product) => {
  const unit = normalizeComparableUnitPrice(product.lowestPrice, product.subline);
  if (!unit || unit.unitLabel !== 'kr/kg') return [];

  const leader = leaderByProductSlug.get(product.slug);
  const sourceConfidence = leader?.sourceConfidence ?? product.inChains.length / 2;
  const confidence = confidenceFromSourceScore(sourceConfidence);
  return [{
    id: `kg-${product.slug}`,
    mode: 'cheapest-per-kg',
    productSlug: product.slug,
    productName: product.name,
    categorySlug: product.category,
    categoryLabel: leader?.categoryLabel ?? product.category,
    chainLabel: product.lowestChain,
    primaryMetric: `${formatSek(unit.unitPrice)} / kg`,
    secondaryMetric: `${product.subline || unit.packageLabel} pack`,
    priceLabel: formatSek(product.lowestPrice),
    evidence: leader?.evidenceLabel ?? `${product.inChains.length} chain rows matched by product code`,
    confidence,
    confidenceLabel: `${confidence} confidence`,
    sampleSize: product.inChains.length,
    sortValue: unit.unitPrice
  }];
}).sort((left, right) => left.sortValue - right.sortValue || left.productName.localeCompare(right.productName, 'sv'));

const widestSpreadRows: ScreenerRow[] = topChainSpreads.map((product) => {
  const leader = leaderByProductSlug.get(product.slug);
  const sourceConfidence = leader?.sourceConfidence ?? product.inChains.length / 2;
  const confidence = confidenceFromSourceScore(sourceConfidence);
  return {
    id: `spread-${product.slug}`,
    mode: 'widest-spread',
    productSlug: product.slug,
    productName: product.name,
    categorySlug: product.category,
    categoryLabel: leader?.categoryLabel ?? product.category,
    chainLabel: product.lowestChain,
    primaryMetric: `${formatPct(product.spreadPct)} spread`,
    secondaryMetric: `Lowest at ${product.lowestChain}`,
    priceLabel: formatSek(product.lowestPrice),
    evidence: leader?.evidenceLabel ?? `${product.inChains.length} chain rows matched by product code`,
    confidence,
    confidenceLabel: `${confidence} confidence`,
    sampleSize: product.inChains.length,
    sortValue: product.spreadPct
  };
}).sort((left, right) => right.sortValue - left.sortValue || left.productName.localeCompare(right.productName, 'sv'));

const rowsByMode: Record<ScreenerMode, ScreenerRow[]> = {
  'biggest-drop': dropRows,
  'cheapest-per-kg': cheapestPerKgRows,
  'widest-spread': widestSpreadRows
};

const categoryFilters = [
  { slug: 'all', label: 'All categories', count: new Set([...dropRows, ...cheapestPerKgRows, ...widestSpreadRows].map((row) => row.productSlug)).size },
  ...categoryDealLeaders
    .map((leader) => ({
      slug: leader.categorySlug,
      label: leader.categoryLabel,
      count: [dropRows, cheapestPerKgRows, widestSpreadRows].flat().filter((row) => row.categorySlug === leader.categorySlug).length
    }))
    .filter((category, index, categories) => category.count > 0 && categories.findIndex((entry) => entry.slug === category.slug) === index)
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, 'sv'))
];

export default async function ScreenerPage({
  searchParams
}: Readonly<{ searchParams?: Promise<SearchParams> }>) {
  const params = (await searchParams) ?? {};
  const mode = selectedMode(firstParam(params.sort));
  const category = firstParam(params.category) ?? 'all';
  const selectedRows = rowsByMode[mode].filter((row) => category === 'all' || row.categorySlug === category);
  const activeMode = modes.find((item) => item.value === mode) ?? modes[0];

  return (
    <PageShell>
      <Eyebrow>Deal screener</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Sort verified deals by the signal that matters</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        This table reuses priceDropMoversBoard, categoryDealLeaders, and topChainSpreads from the verified data module. It ranks only observed price drops, matched chain spreads, and normalized kg prices; no synthetic deals are added.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Metric label="Observed drops" value={priceDropMoversBoard.length.toLocaleString('sv-SE')} detail="OpenPrices dated declines" />
        <Metric label="Category leaders" value={categoryDealLeaders.length.toLocaleString('sv-SE')} detail="Core deal leader output" />
        <Metric label="Matched spreads" value={topChainSpreads.length.toLocaleString('sv-SE')} detail="Willys/Hemkop product matches" />
      </div>

      <Card className="mt-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight">{activeMode.label}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{activeMode.detail}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {modes.map((item) => (
              <Link
                className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                  item.value === mode ? 'border-emerald-800 bg-emerald-800 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-700'
                }`}
                href={screenerHref(item.value, category)}
                key={item.value}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {categoryFilters.map((filter) => (
            <Link
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm font-black transition ${
                filter.slug === category ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-700'
              }`}
              href={screenerHref(mode, filter.slug)}
              key={filter.slug}
            >
              {filter.label}
              <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs text-slate-700">{filter.count}</span>
            </Link>
          ))}
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                <th className="py-3 pr-4">Product</th>
                <th className="px-4 py-3">Signal</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Chain/source</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="py-3 pl-4">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {selectedRows.map((row) => (
                <tr className="align-top hover:bg-emerald-50/60" key={row.id}>
                  <td className="py-4 pr-4">
                    <Link className="font-black text-slate-950 hover:text-emerald-800" href={`/products/${row.productSlug}`}>{row.productName}</Link>
                    <p className="mt-1 text-sm font-semibold text-slate-600">{row.categoryLabel}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-black text-emerald-800">{row.primaryMetric}</p>
                    <p className="mt-1 text-sm text-slate-600">{row.secondaryMetric}</p>
                  </td>
                  <td className="px-4 py-4 font-black text-slate-950">{row.priceLabel}</td>
                  <td className="px-4 py-4 capitalize text-slate-700">{row.chainLabel}</td>
                  <td className="px-4 py-4">
                    <ConfidenceBadge level={row.confidence} label={row.confidenceLabel} sampleSize={row.sampleSize} />
                  </td>
                  <td className="py-4 pl-4 text-sm leading-6 text-slate-600">{row.evidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedRows.length === 0 ? (
          <p className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-950">
            No verified rows match this category for the selected screener. Choose another category or sort mode.
          </p>
        ) : null}
      </Card>

      <Card className="mt-6 border-amber-200 bg-amber-50">
        <h2 className="text-2xl font-black tracking-tight text-amber-950">Claim boundary</h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-amber-950">
          The screener ranks visible evidence only. Price drops are dated OpenPrices observations, cheapest-per-kg rows are normalized from matched product package text, and spread rows compare matched Willys/Hemkop catalogue products rather than branch-level shelf availability.
        </p>
      </Card>

      <div className="mt-6">
        <SourceCoverage />
      </div>
    </PageShell>
  );
}

function Metric({ label, value, detail }: Readonly<{ label: string; value: string; detail: string }>) {
  return (
    <Card className="p-4">
      <p className="text-sm font-black text-slate-600">{label}</p>
      <p className="mt-2 text-3xl font-black text-emerald-800">{value}</p>
      <p className="mt-2 text-sm font-semibold text-slate-600">{detail}</p>
    </Card>
  );
}
