import Link from 'next/link';
import { calculateChainPriceIndex, type ChainCategoryIndex, type ChainPriceIndex } from '@groceryview/core';
import { ConfidenceBadge } from '@/components/confidence-badge';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { buildChainPriceObservations, buildMatchedBasketChainPriceObservations } from '@/lib/chain-index-data';
import { priceStateToken } from '@/lib/color-vision-palette';
import { categorySummaries } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata({
    path: '/heatmap',
    title: 'Grocery chain price heatmap | GroceryView',
    description: 'Scan category-by-chain grocery index cells built from verified chain price observations and confidence-labelled index coverage.'
  });
}

const groceryIndex = calculateChainPriceIndex([
  ...buildChainPriceObservations(),
  ...buildMatchedBasketChainPriceObservations()
]);

const categoryIndexMatchers: Record<string, string[]> = {
  alcohol: ['Beverages'],
  baby: ['Baby'],
  beverages: ['Beverages'],
  bread: ['Bread & bakery'],
  breakfast: ['Coffee & tea', 'Dairy & eggs', 'Pantry & dry'],
  'coffee-tea': ['Coffee & tea'],
  dairy: ['Dairy & eggs'],
  fish: ['Meat & fish'],
  frozen: ['Frozen'],
  household: ['Household'],
  meat: ['Meat & fish'],
  pantry: ['Pantry & dry'],
  'personal-care': ['Personal care'],
  pet: ['Pet'],
  'plant-based': ['Dairy & eggs', 'Pantry & dry'],
  produce: ['Fruit & veg'],
  snacks: ['Snacks & sweets'],
  sweets: ['Snacks & sweets']
};

type HeatmapCell = {
  index: number;
  observations: number;
  confidence: 'high' | 'medium' | 'low';
  estimated: boolean;
};

function matchedCategoryCells(chain: ChainPriceIndex, categorySlug: string): ChainCategoryIndex[] {
  const matchers = categoryIndexMatchers[categorySlug] ?? [];
  return chain.byCategory.filter((category) => matchers.some((matcher) => category.category.startsWith(matcher)));
}

function weightedCellIndex(chain: ChainPriceIndex, categorySlug: string): HeatmapCell | null {
  const matches = matchedCategoryCells(chain, categorySlug);
  const observations = matches.reduce((sum, category) => sum + category.observations, 0);
  if (matches.length === 0 || observations === 0) return null;

  const index = matches.reduce((sum, category) => sum + category.index * category.observations, 0) / observations;
  const confidence = observations >= 12 ? 'high' : observations >= 4 ? 'medium' : 'low';
  return {
    index,
    observations,
    confidence,
    estimated: matches.some((category) => category.estimated)
  };
}

function indexTone(value: number | null) {
  if (value === null) return 'border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:bg-slate-50';
  if (value < 96) return 'border-emerald-300 bg-emerald-100 text-emerald-950 hover:bg-emerald-200';
  if (value <= 103) return 'border-amber-300 bg-amber-100 text-amber-950 hover:bg-amber-200';
  return 'border-red-300 bg-red-100 text-red-950 hover:bg-red-200';
}

function indexSymbol(chainId: string, categorySlug: string) {
  return `${chainId}-${categorySlug}`
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const matrixRows = categorySummaries.map((category) => ({
  ...category,
  cells: groceryIndex.chains.map((chain) => ({
    chain,
    cell: weightedCellIndex(chain, category.slug)
  }))
}));

const coveredCellCount = matrixRows.reduce((sum, row) => sum + row.cells.filter(({ cell }) => cell !== null).length, 0);
const totalCellCount = matrixRows.length * groceryIndex.chains.length;

export default function HeatmapPage() {
  return (
    <PageShell>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Eyebrow>TradingView-style heatmap</Eyebrow>
          <h1 className="mt-2 text-4xl font-black tracking-tight">Category x chain price index grid</h1>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
            Rows are verified categorySummaries, columns are calculateChainPriceIndex chains, and each covered cell links to its index symbol. Each cell pairs color with a text/state marker: ↓ cheaper than market below 96, → market range from 96-103, and ↑ more expensive above 103 on the 100-centred market scale.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ConfidenceBadge level={coveredCellCount === totalCellCount ? 'high' : coveredCellCount > 0 ? 'medium' : 'low'} label="matrix coverage" sampleSize={coveredCellCount} />
          <ConfidenceBadge level={groceryIndex.chains[0]?.confidence ?? 'low'} label="chain index" sampleSize={groceryIndex.generatedFrom} />
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Rows</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{categorySummaries.length}</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">Verified category summaries</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Columns</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{groceryIndex.chains.length}</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">Chains from calculateChainPriceIndex</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Covered cells</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{coveredCellCount}/{totalCellCount}</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">Cells with chain-category observations</p>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 min-w-56 border-b border-r border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-600">
                  Category
                </th>
                {groceryIndex.chains.map((chain) => (
                  <th className="min-w-40 border-b border-slate-200 bg-slate-50 px-3 py-3 align-top" key={chain.chainId}>
                    <div className="flex flex-col gap-2">
                      <span className="text-sm font-black text-slate-950">{chain.chainId}</span>
                      <span className="text-xs font-bold text-slate-600">{chain.overallIndex.toFixed(1)} overall</span>
                      <ConfidenceBadge level={chain.confidence} label={chain.confidence} sampleSize={chain.observations} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrixRows.map((row) => (
                <tr key={row.slug}>
                  <th className="sticky left-0 z-10 border-b border-r border-slate-200 bg-white px-4 py-3 align-middle">
                    <Link className="font-black text-slate-950 hover:text-emerald-800" href={`/categories/${row.slug}`}>
                      {row.label}
                    </Link>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{row.openPriceRows + row.chainRows} verified rows</p>
                  </th>
                  {row.cells.map(({ chain, cell }) => {
                    const symbol = indexSymbol(chain.chainId, row.slug);
                    const stateToken = priceStateToken(cell?.index);
                    return (
                      <td className="border-b border-slate-200 bg-slate-50 p-1.5" key={`${row.slug}-${chain.chainId}`}>
                        <Link
                          aria-label={`${row.label} ${chain.chainId} index ${cell ? cell.index.toFixed(1) : 'not available'}: ${stateToken.label}. ${stateToken.meaning}.`}
                          className={`block min-h-24 rounded-lg border p-3 transition ${indexTone(cell?.index ?? null)}`}
                          href={`/index/${symbol}`}
                        >
                          <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-white/75 px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em]">
                            <span aria-hidden="true">{stateToken.indicator}</span>
                            {stateToken.label}
                          </span>
                          <span className="block text-2xl font-black">{cell ? cell.index.toFixed(1) : 'n/a'}</span>
                          {cell ? (
                            <>
                              <span className="mt-2 block">
                                <ConfidenceBadge level={cell.confidence} label={cell.confidence} sampleSize={cell.observations} />
                              </span>
                              <span className="mt-2 block text-xs font-semibold opacity-80">
                                {cell.observations} rows{cell.estimated ? ' · estimated' : ''}
                              </span>
                            </>
                          ) : (
                            <span className="mt-2 block text-xs font-bold uppercase tracking-wide">No indexed coverage</span>
                          )}
                        </Link>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageShell>
  );
}
