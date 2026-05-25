import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { calculateChainPriceIndex, calculateFixedBasketIndex, type ChainPriceIndex, type FixedBasketIndex } from '@groceryview/core';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { ConfidenceBadge } from '@/components/confidence-badge';
import { PriceChartTerminal, type PriceChartTerminalModel, type PriceChartTerminalWindow } from '@/components/price-chart-terminal';
import { axfoodProducts, type AxfoodProduct } from '@/lib/axfood-products';
import { buildChainIndexTrendSeries, buildChainPriceObservations, buildMatchedBasketChainPriceObservations } from '@/lib/chain-index-data';
import { formatPct, formatSek } from '@/lib/verified-data';

type CategorySymbol = 'grocery' | 'dairy' | 'produce' | 'meat' | 'bakery';

type CategoryDefinition = {
  symbol: CategorySymbol;
  label: string;
  categorySlugs: string[];
  description: string;
};

type CategoryConstituent = {
  id: string;
  productName: string;
  brand: string;
  baselineLabel: string;
  currentLabel: string;
  baseUnitPrice: number;
  currentUnitPrice: number;
  weight: number;
  movementPercent: number;
};

const categoryDefinitions: CategoryDefinition[] = [
  {
    symbol: 'grocery',
    label: 'Grocery matched basket',
    categorySlugs: [],
    description: 'All visible Willys/Hemköp matched products with both current chain prices.'
  },
  {
    symbol: 'dairy',
    label: 'Dairy index',
    categorySlugs: ['mejeri-ost-och-agg'],
    description: 'Milk, cheese, egg, yoghurt, and adjacent dairy rows from the Axfood matched catalog.'
  },
  {
    symbol: 'produce',
    label: 'Produce index',
    categorySlugs: ['frukt-och-gront'],
    description: 'Fruit and vegetable rows with direct Willys/Hemkop product-code matches.'
  },
  {
    symbol: 'meat',
    label: 'Meat and fish index',
    categorySlugs: ['kott-fagel-och-chark', 'fisk-och-skaldjur'],
    description: 'Meat, poultry, deli, and seafood rows with two-chain Axfood coverage.'
  },
  {
    symbol: 'bakery',
    label: 'Bakery index',
    categorySlugs: ['brod-och-kakor'],
    description: 'Bread, crackers, and bakery rows with verified matched chain prices.'
  }
];

const fixedBasketBaseDate = '2026-05-20';
const fixedBasketCurrentDate = '2026-05-21';
const chartWindowLabels = ['1W', '1M', '3M', '1Y', 'ALL'] as const;

const chainIndexReport = calculateChainPriceIndex([
  ...buildChainPriceObservations(),
  ...buildMatchedBasketChainPriceObservations()
]);
const chainIndexTrend = buildChainIndexTrendSeries();

function chainSlug(chainId: string) {
  return chainId
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const chainsBySlug = new Map(chainIndexReport.chains.map((chain) => [chainSlug(chain.chainId), chain]));
const categoryBySymbol = new Map(categoryDefinitions.map((definition) => [definition.symbol, definition]));

export function generateStaticParams() {
  return [
    ...categoryDefinitions.map((definition) => ({ symbol: definition.symbol })),
    ...chainIndexReport.chains.map((chain) => ({ symbol: chainSlug(chain.chainId) }))
  ];
}

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ symbol: string }> }>): Promise<Metadata> {
  const { symbol } = await params;
  const category = categoryBySymbol.get(symbol as CategorySymbol);
  const chain = chainsBySlug.get(symbol);
  if (!category && !chain) notFound();

  const label = category?.label ?? `${chain?.chainId ?? symbol} chain index`;
  return {
    title: `${label} | GroceryView`,
    description: 'Observed GroceryView price index page with fixed-basket and chain-price index calculations.'
  };
}

function pricedMatchedProducts(definition: CategoryDefinition): AxfoodProduct[] {
  return axfoodProducts
    .filter((product) => {
      if (definition.categorySlugs.length > 0 && !definition.categorySlugs.includes(product.category)) return false;
      return product.chains.willys?.price != null && product.chains.hemkop?.price != null;
    })
    .sort((a, b) => b.spreadPct - a.spreadPct);
}

function constituentRows(products: AxfoodProduct[]): CategoryConstituent[] {
  return products.map((product) => {
    const willysPrice = product.chains.willys?.price ?? product.lowestPrice;
    const hemkopPrice = product.chains.hemkop?.price ?? product.highestPrice;
    const baseUnitPrice = Math.max(willysPrice, hemkopPrice);
    const currentUnitPrice = Math.min(willysPrice, hemkopPrice);
    return {
      id: product.code,
      productName: product.name,
      brand: product.brand || 'Brand not reported',
      baselineLabel: willysPrice >= hemkopPrice ? 'Willys' : 'Hemkop',
      currentLabel: willysPrice < hemkopPrice ? 'Willys' : 'Hemkop',
      baseUnitPrice,
      currentUnitPrice,
      weight: 1,
      movementPercent: ((currentUnitPrice - baseUnitPrice) / baseUnitPrice) * 100
    };
  });
}

function fixedBasketFor(definition: CategoryDefinition): { index: FixedBasketIndex; rows: CategoryConstituent[] } | null {
  const rows = constituentRows(pricedMatchedProducts(definition));
  if (rows.length === 0) return null;

  return {
    rows,
    index: calculateFixedBasketIndex({
      id: definition.symbol,
      label: definition.label,
      baseDate: fixedBasketBaseDate,
      currentDate: fixedBasketCurrentDate,
      components: rows.map((row) => ({
        productId: row.id,
        baseUnitPrice: row.baseUnitPrice,
        currentUnitPrice: row.currentUnitPrice,
        weight: row.weight
      }))
    })
  };
}

function indexTone(value: number) {
  if (value < 95) return 'text-emerald-800';
  if (value > 105) return 'text-rose-800';
  return 'text-slate-950';
}

function confidenceLabel(level: 'high' | 'medium' | 'low') {
  return `${level} confidence`;
}

function fixedBasketForChain(chain: ChainPriceIndex): FixedBasketIndex {
  return calculateFixedBasketIndex({
    id: chainSlug(chain.chainId),
    label: `${chain.chainId} category basket`,
    baseDate: fixedBasketBaseDate,
    currentDate: fixedBasketCurrentDate,
    components: chain.byCategory.map((row) => ({
      productId: row.category,
      baseUnitPrice: row.marketReference,
      currentUnitPrice: row.marketReference * (row.index / 100),
      weight: row.observations
    }))
  });
}

function emptyWindow(label: PriceChartTerminalWindow['label'], rangeLabel: string): PriceChartTerminalWindow {
  return {
    label,
    rangeLabel,
    pointCount: 0,
    markerCount: 0,
    latestValueLabel: 'No dated points',
    lowValueLabel: 'n/a',
    highValueLabel: 'n/a',
    series: []
  };
}

function fixedBasketChart(index: FixedBasketIndex, rows: CategoryConstituent[]): PriceChartTerminalModel {
  const points = [
    { time: index.baseDate, value: 100, confidence: 0.82, provenanceLabel: 'Higher matched chain price baseline' },
    { time: index.currentDate, value: index.value, confidence: 0.82, provenanceLabel: 'Lowest matched chain price basket' }
  ];
  const window: PriceChartTerminalWindow = {
    label: 'ALL',
    rangeLabel: `${index.baseDate} to ${index.currentDate}`,
    windowStart: index.baseDate,
    windowEnd: index.currentDate,
    pointCount: points.length,
    markerCount: 1,
    latestValueLabel: index.value.toFixed(1),
    latestObservedAt: index.currentDate,
    lowValueLabel: Math.min(...points.map((point) => point.value)).toFixed(1),
    highValueLabel: Math.max(...points.map((point) => point.value)).toFixed(1),
    series: [
      {
        id: index.id,
        storeName: index.label,
        sourceType: 'matched Axfood catalog',
        lineStyle: 'solid',
        points,
        markers: [
          {
            time: index.currentDate,
            text: `${rows.length} constituents`,
            color: '#047857',
            provenanceLabel: 'calculateFixedBasketIndex'
          }
        ]
      }
    ]
  };

  return {
    available: true,
    title: `${index.label} terminal`,
    sourceLabel: 'Axfood matched Willys/Hemkop product prices',
    confidenceLabel: `${index.confidence} confidence from ${rows.length} matched rows`,
    caveat: 'Fixed-basket points compare the highest visible matched chain price baseline with the lowest visible matched chain price for the same product codes. No forecast or unmatched SKU estimate is rendered.',
    defaultWindow: 'ALL',
    windows: chartWindowLabels.map((label) => (label === 'ALL' ? window : emptyWindow(label, 'fixed basket comparison')))
  };
}

function chainChart(chain: ChainPriceIndex): PriceChartTerminalModel {
  const series = chainIndexTrend.series.find((entry) => entry.chainId === chain.chainId);
  if (!series) {
    return {
      available: false,
      title: `${chain.chainId} chain index terminal`,
      sourceLabel: 'Normalized chain observations plus matched Axfood rows',
      confidenceLabel: `${chain.confidence} confidence from ${chain.observations} rows`,
      caveat: 'This chain has a current calculateChainPriceIndex score, but no dated campaign trend points in the verified trend tape.',
      defaultWindow: 'ALL',
      windows: chartWindowLabels.map((label) => emptyWindow(label, 'no dated campaign trend'))
    };
  }

  const points = series.points.map((point) => ({
    time: point.date,
    value: point.value,
    confidence: point.confidence === 'high' ? 0.9 : point.confidence === 'medium' ? 0.72 : 0.55,
    provenanceLabel: `${point.observations} observations`
  }));
  const values = points.map((point) => point.value);
  const window: PriceChartTerminalWindow = {
    label: 'ALL',
    rangeLabel: chainIndexTrend.chartWindowLabel,
    windowStart: points[0]?.time,
    windowEnd: points.at(-1)?.time,
    pointCount: points.length,
    markerCount: 1,
    latestValueLabel: series.latestIndex.toFixed(1),
    latestObservedAt: series.latestDate,
    lowValueLabel: Math.min(...values).toFixed(1),
    highValueLabel: Math.max(...values).toFixed(1),
    series: [
      {
        id: chainSlug(chain.chainId),
        storeName: chain.chainId,
        sourceType: 'campaign index',
        lineStyle: 'solid',
        points,
        markers: [
          {
            time: series.latestDate,
            text: `${series.movementFromFirst >= 0 ? '+' : ''}${series.movementFromFirst.toFixed(1)} vs first`,
            color: '#047857',
            provenanceLabel: 'calculateChainPriceIndex trend'
          }
        ]
      }
    ]
  };

  return {
    available: true,
    title: `${chain.chainId} chain index terminal`,
    sourceLabel: chainIndexTrend.sourceLabel,
    confidenceLabel: `${chain.confidence} current confidence; ${series.coverageLabel}`,
    caveat: 'Trend points replay dated weekly campaign rows through calculateChainPriceIndex. The current hero number uses the broader normalized chain feed plus matched Axfood rows.',
    defaultWindow: 'ALL',
    windows: chartWindowLabels.map((label) => (label === 'ALL' ? window : emptyWindow(label, 'campaign trend comparison')))
  };
}

function CategoryIndexPage({ definition, index, rows }: Readonly<{ definition: CategoryDefinition; index: FixedBasketIndex; rows: CategoryConstituent[] }>) {
  const averageSaving = rows.reduce((sum, row) => sum + Math.abs(row.movementPercent), 0) / rows.length;
  return (
    <PageShell>
      <Eyebrow>Index symbol</Eyebrow>
      <div className="mt-2 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight">{definition.label}</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">{definition.description}</p>
        </div>
        <div className="rounded-[1.75rem] border border-emerald-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-800">Index value</p>
          <p className={`mt-2 text-6xl font-black tracking-tight ${indexTone(index.value)}`}>{index.value.toFixed(1)}</p>
          <div className="mt-3"><ConfidenceBadge level={index.confidence} label={confidenceLabel(index.confidence)} sampleSize={rows.length} /></div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm font-black text-slate-600">Constituents</p>
          <p className="mt-2 text-4xl font-black text-slate-950">{rows.length.toLocaleString('sv-SE')}</p>
        </Card>
        <Card>
          <p className="text-sm font-black text-slate-600">Average visible saving</p>
          <p className="mt-2 text-4xl font-black text-emerald-800">{formatPct(averageSaving)}</p>
        </Card>
        <Card>
          <p className="text-sm font-black text-slate-600">Calculation</p>
          <p className="mt-2 text-base font-black text-slate-950">calculateFixedBasketIndex</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">Equal-weighted matched product rows.</p>
        </Card>
      </div>

      <PriceChartTerminal chart={fixedBasketChart(index, rows)} />

      <Card className="mt-6">
        <Eyebrow>Constituents</Eyebrow>
        <h2 className="mt-2 text-2xl font-black tracking-tight">Fixed-basket rows</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="py-3 pr-4">Product</th>
                <th className="py-3 pr-4">Baseline</th>
                <th className="py-3 pr-4">Current</th>
                <th className="py-3 pr-4">Weight</th>
                <th className="py-3 pr-4">Move</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.slice(0, 36).map((row) => (
                <tr key={row.id}>
                  <td className="py-3 pr-4">
                    <p className="font-black text-slate-950">{row.productName}</p>
                    <p className="text-xs font-semibold text-slate-500">{row.brand}</p>
                  </td>
                  <td className="py-3 pr-4 font-bold text-slate-700">{row.baselineLabel} {formatSek(row.baseUnitPrice)}</td>
                  <td className="py-3 pr-4 font-bold text-emerald-800">{row.currentLabel} {formatSek(row.currentUnitPrice)}</td>
                  <td className="py-3 pr-4 font-bold text-slate-700">{row.weight.toFixed(1)}</td>
                  <td className="py-3 pr-4 font-black text-emerald-800">{formatPct(Math.abs(row.movementPercent))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageShell>
  );
}

function EmptyCategoryIndexPage({ definition }: Readonly<{ definition: CategoryDefinition }>) {
  return (
    <PageShell>
      <Eyebrow>Index symbol</Eyebrow>
      <Card className="mt-4 text-center">
        <div className="text-5xl" aria-hidden="true">🧺</div>
        <h1 className="mt-4 text-3xl font-black tracking-tight">No products in {definition.label} yet</h1>
        <p className="mt-3 text-base font-semibold text-slate-600">Try another GroceryView index while matched products are added.</p>
      </Card>
    </PageShell>
  );
}

function ChainIndexPage({ chain }: Readonly<{ chain: ChainPriceIndex }>) {
  const fixedBasketMirror = fixedBasketForChain(chain);

  return (
    <PageShell>
      <Eyebrow>Index symbol</Eyebrow>
      <div className="mt-2 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight">{chain.chainId} chain index</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
            Current normalized chain score from calculateChainPriceIndex across real chain observations and matched Axfood rows.
          </p>
        </div>
        <div className="rounded-[1.75rem] border border-emerald-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-800">Index value</p>
          <p className={`mt-2 text-6xl font-black tracking-tight ${indexTone(chain.overallIndex)}`}>{chain.overallIndex.toFixed(1)}</p>
          <div className="mt-3"><ConfidenceBadge level={chain.confidence} label={confidenceLabel(chain.confidence)} sampleSize={chain.observations} /></div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Card>
          <p className="text-sm font-black text-slate-600">Categories covered</p>
          <p className="mt-2 text-4xl font-black text-slate-950">{chain.categoriesCovered}</p>
        </Card>
        <Card>
          <p className="text-sm font-black text-slate-600">Observations</p>
          <p className="mt-2 text-4xl font-black text-slate-950">{chain.observations.toLocaleString('sv-SE')}</p>
        </Card>
        <Card>
          <p className="text-sm font-black text-slate-600">Calculation</p>
          <p className="mt-2 text-base font-black text-slate-950">calculateChainPriceIndex</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">Lower than 100 means cheaper than market reference.</p>
        </Card>
        <Card>
          <p className="text-sm font-black text-slate-600">Fixed-basket mirror</p>
          <p className={`mt-2 text-4xl font-black ${indexTone(fixedBasketMirror.value)}`}>{fixedBasketMirror.value.toFixed(1)}</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">calculateFixedBasketIndex over category constituents.</p>
        </Card>
      </div>

      <PriceChartTerminal chart={chainChart(chain)} />

      <Card className="mt-6">
        <Eyebrow>Constituents</Eyebrow>
        <h2 className="mt-2 text-2xl font-black tracking-tight">Chain category rows</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="py-3 pr-4">Category</th>
                <th className="py-3 pr-4">Index</th>
                <th className="py-3 pr-4">Market reference</th>
                <th className="py-3 pr-4">Rows</th>
                <th className="py-3 pr-4">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {chain.byCategory.map((row) => (
                <tr key={row.category}>
                  <td className="py-3 pr-4 font-black text-slate-950">{row.category}</td>
                  <td className={`py-3 pr-4 font-black ${indexTone(row.index)}`}>{row.index.toFixed(1)}</td>
                  <td className="py-3 pr-4 font-bold text-slate-700">{formatSek(row.marketReference)}</td>
                  <td className="py-3 pr-4 font-bold text-slate-700">{row.observations}</td>
                  <td className="py-3 pr-4">
                    <ConfidenceBadge level={row.confidence} label={row.estimated ? 'estimated cell' : confidenceLabel(row.confidence)} sampleSize={row.observations} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageShell>
  );
}

export default async function IndexSymbolPage({ params }: Readonly<{ params: Promise<{ symbol: string }> }>) {
  const { symbol } = await params;
  const category = categoryBySymbol.get(symbol as CategorySymbol);
  if (category) {
    const fixedBasket = fixedBasketFor(category);
    if (!fixedBasket) return <EmptyCategoryIndexPage definition={category} />;
    return <CategoryIndexPage definition={category} index={fixedBasket.index} rows={fixedBasket.rows} />;
  }

  const chain = chainsBySlug.get(symbol);
  if (!chain) notFound();
  return <ChainIndexPage chain={chain} />;
}
