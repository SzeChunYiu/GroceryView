import Link from 'next/link';
import { BrandArtMarketAccent } from '@/components/brand-art';
import { GroceryViewSurfaceAnalytics } from '@/components/analytics/groceryview-surface-analytics';
import { CategoryPreviewDrawer } from '@/components/preview/category-preview-drawer';
import { PublicAdSlot } from '@/components/public-ad-slot';
import { PageShell } from '@/components/data-ui';
import { PageQuestionHeader, PanelPurpose } from '@/components/mvp/handoff-content';
import { MvpBreadcrumbs } from '@/components/mvp/mvp-breadcrumbs';
import { MvpSectionCard } from '@/components/mvp/mvp-section-card';
import { NoVerifiedDataPanel } from '@/components/mvp/no-verified-data-panel';
import { EvidenceStrip } from '@/components/mvp/evidence-strip';
import { ChartEmptyState, ChartShell, ChartTableFallback, HeatmapMatrix, KpiCard, MultiLineChart } from '@/components/mvp/visual-intelligence';
import { getMarketOverviewData } from '@/lib/mvp/data';
import { categoryBrowseHref, categoryMarketHref, productSlugHref } from '@/lib/mvp/routes';
import { routeMetadata } from '@/lib/seo';

type SearchParams = Record<string, string | string[] | undefined>;

export function generateMetadata() {
  return routeMetadata('/market');
}

type MarketIndexSeries = ReturnType<typeof getMarketOverviewData>['chainIndexSeries'][number];

function linePath(points: MarketIndexSeries['points']) {
  if (points.length === 0) return '';
  const width = 520;
  const height = 180;
  const padding = 18;
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  return points
    .map((point, index) => {
      const x = padding + (index / Math.max(1, points.length - 1)) * (width - padding * 2);
      const y = height - padding - ((point.value - min) / span) * (height - padding * 2);
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

function areaPath(points: MarketIndexSeries['points']) {
  const path = linePath(points);
  if (!path) return '';
  const width = 520;
  const height = 180;
  return `${path} L ${width - 18} ${height - 18} L 18 ${height - 18} Z`;
}

function MarketIndexChart({ series }: Readonly<{ series: MarketIndexSeries }>) {
  const latest = series.points.at(-1);
  const previous = series.points.at(-2);
  const isUp = latest && previous ? latest.value >= previous.value : true;
  const stroke = isUp ? '#047857' : '#be123c';
  const gradientId = `market-index-fill-${series.chain.replace(/[^a-z0-9_-]+/gi, '-').toLowerCase()}`;

  return (
    <article className="overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{series.indexType} · {series.region}</p>
          <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{series.chain}</h3>
        </div>
        <div className="text-right">
          <p className="font-mono text-3xl font-black text-slate-950">{latest?.value.toFixed(1) ?? '—'}</p>
          <p className={`text-sm font-black ${isUp ? 'text-emerald-700' : 'text-rose-700'}`}>
            {series.weeklyChangePct !== undefined ? `${series.weeklyChangePct >= 0 ? '+' : ''}${series.weeklyChangePct.toFixed(1)}% weekly` : 'weekly —'}
          </p>
        </div>
      </div>
      <div className="p-4">
        <svg className="h-48 w-full" role="img" viewBox="0 0 520 180" aria-label={`${series.chain} price index movement`}>
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.24" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[42, 78, 114, 150].map((y) => (
            <line key={y} x1="18" x2="502" y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 8" />
          ))}
          <path d={areaPath(series.points)} fill={`url(#${gradientId})`} />
          <path d={linePath(series.points)} fill="none" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
          {series.points.map((point, index) => {
            const values = series.points.map((entry) => entry.value);
            const min = Math.min(...values);
            const max = Math.max(...values);
            const span = Math.max(1, max - min);
            const x = 18 + (index / Math.max(1, series.points.length - 1)) * (520 - 36);
            const y = 180 - 18 - ((point.value - min) / span) * (180 - 36);
            return <circle cx={x} cy={y} fill="#fff" key={`${point.date}-${point.value}`} r="4" stroke={stroke} strokeWidth="3" />;
          })}
        </svg>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-500">
          <span>{series.points[0]?.date ?? 'Start date unknown'}</span>
          <span>{series.points.length} dated points · {series.sourceLabel}</span>
          <span>{latest?.date ?? 'Latest date unknown'}</span>
        </div>
      </div>
    </article>
  );
}

export default async function MarketPage({ searchParams }: Readonly<{ searchParams?: Promise<SearchParams> }>) {
  const resolved = await (searchParams ?? Promise.resolve({}));
  const data = getMarketOverviewData(resolved);
  return (
    <PageShell data-gv-surface="market">
      <GroceryViewSurfaceAnalytics surface="market" />
      <MvpBreadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Market' }]} />
      <BrandArtMarketAccent />
      <PageQuestionHeader
        eyebrow="Market overview"
        question="Which grocery prices are rising or falling?"
        title="Grocery market overview"
        subtitle="Track price changes across chains, categories, and regions. Click any category to drill down into products and deals."
        evidence={<EvidenceStrip evidence={buildMarketEvidence(data)} />}
      />

      <section className="mt-6 grid gap-4 md:grid-cols-4" aria-label="Market KPI cards">
        {[
          { label: 'Categories tracked', value: data.categoryIndexRows.length.toLocaleString('sv-SE'), href: '/browse', detail: 'Verified categories with market rows.' },
          { label: 'Chain index series', value: data.chainIndexSeries.length.toLocaleString('sv-SE'), href: '/market?index=chain-price', detail: 'Dated chain-level index lines.' },
          { label: 'Biggest movers', value: data.biggestMovers.length.toLocaleString('sv-SE'), href: '/market?sort=movers', detail: 'Products with observed price movement.' },
          { label: 'Confidence', value: data.confidenceLabel, href: '/methodology#confidence-labels', detail: 'Source and freshness confidence boundary.' }
        ].map((kpi) => (
          <KpiCard detail={kpi.detail} href={kpi.href} key={kpi.label} label={kpi.label} value={kpi.value} />
        ))}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[18rem_1fr_20rem]">
        <PanelPurpose
          description="Switch between index type, region, category, chain, time-range, and confidence views. Missing or stale data stays visible instead of guessed."
          question="Choose what to compare"
          title="Market controls"
        >
          <form className="grid gap-3">
            {[
              { key: 'region', label: 'Region', value: data.selectedRegion, options: ['stockholm', 'goteborg', 'malmo'] },
              { key: 'index', label: 'Index', value: data.selectedIndexType, options: ['chain-price', 'category-price'] },
              { key: 'category', label: 'Category', value: 'all', options: ['all', ...data.categoryIndexRows.slice(0, 8).map((row) => row.categorySlug)] },
              { key: 'chain', label: 'Chain', value: 'all', options: ['all', ...data.chainIndexSeries.map((series) => series.chain.toLowerCase())] },
              { key: 'range', label: 'Time range', value: 'weekly', options: ['weekly', '3m', '1y'] },
              { key: 'confidence', label: 'Confidence', value: 'all', options: ['all', 'high', 'medium', 'low'] }
            ].map((field) => (
              <label className="text-sm font-black text-slate-700" key={field.key}>
                {field.label}
                <select className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2" defaultValue={field.value} name={field.key}>
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            <button className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white" data-gv-event="market_filter_changed" type="submit">
              Apply
            </button>
          </form>
        </PanelPurpose>
        <div className="space-y-6">
          <MvpSectionCard title="Chain price index">
            <p className="mb-4 text-sm font-semibold leading-6 text-slate-600">
              Compare how grocery prices are moving across chains. Use the filters to switch region, category, or time range.
            </p>
            <ChartShell
              actionHref="/market?index=chain-price"
              actionLabel="Open chain index"
              evidenceItems={[`${data.chainIndexSeries.length} chain series`, data.confidenceLabel, data.selectedRegion]}
              hasData={data.chainIndexSeries.length > 0}
              insightTitle="Chain index movement"
              plainSummary="Line movement compares observed chain index values without forecasting missing prices."
              userQuestion="Which chains are moving up or down?"
              emptyState={<ChartEmptyState title="Not enough verified price history for this chart yet" message="Try another region, category, or time range." />}
              fallback={
                <ChartTableFallback
                  caption="Chain price index table"
                  columns={[
                    { key: 'chain', label: 'Chain', render: (row: MarketIndexSeries) => row.chain },
                    { key: 'latest', label: 'Latest', render: (row: MarketIndexSeries) => row.points.at(-1)?.value.toFixed(1) ?? '—' },
                    { key: 'weekly', label: 'Weekly', render: (row: MarketIndexSeries) => row.weeklyChangePct !== undefined ? `${row.weeklyChangePct.toFixed(1)}%` : '—' }
                  ]}
                  rows={data.chainIndexSeries}
                />
              }
            >
              <MultiLineChart
                ariaLabel="Chain price index movement"
                series={data.chainIndexSeries.map((series) => ({ label: series.chain, points: series.points, tone: (series.weeklyChangePct ?? 0) >= 0 ? 'up' : 'down' }))}
              />
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {data.chainIndexSeries.map((series) => (
                  <MarketIndexChart key={`${series.chain}-${series.indexType}`} series={series} />
                ))}
              </div>
            </ChartShell>
          </MvpSectionCard>

          <MvpSectionCard title="Price movement by category">
            <p className="mb-4 text-sm font-semibold leading-6 text-slate-600">
              See which categories are getting more expensive or cheaper. Click a category to inspect the trend, or browse products in that category.
            </p>
            {data.categoryIndexRows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      <th className="py-2 pr-4">Category</th>
                      <th className="py-2 pr-4">Weekly</th>
                      <th className="py-2 pr-4">3M</th>
                      <th className="py-2 pr-4">1Y</th>
                      <th className="py-2 pr-4">Trend</th>
                      <th className="py-2 pr-4">Cheapest chain</th>
                      <th className="py-2 pr-4">Confidence</th>
                      <th className="py-2">Browse</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.categoryIndexRows.map((row) => (
                      <tr className="border-b border-slate-100" key={row.categorySlug}>
                        <td className="py-3 pr-4">
                          <Link className="font-black text-emerald-800 underline" href={categoryMarketHref(row.categorySlug)}>
                            {row.categoryName}
                          </Link>
                        </td>
                        <td className="py-3 pr-4 font-semibold">{row.weeklyChangePct !== undefined ? `${row.weeklyChangePct.toFixed(1)}%` : '—'}</td>
                        <td className="py-3 pr-4 font-semibold">{row.threeMonthChangePct !== undefined ? `${row.threeMonthChangePct.toFixed(1)}%` : '—'}</td>
                        <td className="py-3 pr-4 font-semibold">{row.oneYearChangePct !== undefined ? `${row.oneYearChangePct.toFixed(1)}%` : '—'}</td>
                        <td className="py-3 pr-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <CategoryPreviewDrawer row={row} triggerLabel="Preview trend" />
                            <Link className="font-mono text-xs font-black text-slate-700 underline" href={categoryMarketHref(row.categorySlug)}>
                              {row.sparkline.map((point) => point.value.toFixed(0)).join(' → ') || 'Open chart'}
                            </Link>
                          </div>
                        </td>
                        <td className="py-3 pr-4 font-semibold">
                          <Link className="underline" href={`/search?chain=${encodeURIComponent(row.cheapestChain ?? '')}&category=${encodeURIComponent(row.categorySlug)}`}>
                            {row.cheapestChain ?? '—'}
                          </Link>
                        </td>
                        <td className="py-3 pr-4 font-semibold">{row.confidenceLabel} · {row.observationCount}</td>
                        <td className="py-3">
                          <Link className="text-sm font-black text-emerald-800 underline" href={categoryBrowseHref(row.categorySlug)}>
                            Browse
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <NoVerifiedDataPanel />
            )}
          </MvpSectionCard>

          <MvpSectionCard title="Chain × category heatmap">
            <HeatmapMatrix
              cells={data.categoryIndexRows.slice(0, 6).flatMap((row) => data.chainIndexSeries.slice(0, 3).map((series) => ({
                row: row.categoryName,
                column: series.chain,
                valueLabel: row.weeklyChangePct !== undefined ? `${row.weeklyChangePct.toFixed(1)}% weekly` : 'trend pending',
                signal: row.confidenceLabel,
                tone: row.weeklyChangePct === undefined ? 'medium' : row.weeklyChangePct > 1 ? 'high' : 'low',
                href: `/search?chain=${encodeURIComponent(series.chain.toLowerCase())}&category=${encodeURIComponent(row.categorySlug)}`,
                entityType: 'category',
                entityId: row.categorySlug,
                analyticsEvent: 'market_heatmap_cell_clicked'
              })))}
            />
          </MvpSectionCard>

          <MvpSectionCard title="Deal opportunity panel">
            <div className="grid gap-3 md:grid-cols-2">
              {data.biggestMovers.slice(0, 4).map((mover) => (
                <Link className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4" href={productSlugHref(mover.productSlug)} key={`opportunity-${mover.productSlug}`}>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-800">{mover.categoryLabel} · {mover.confidenceLabel}</p>
                  <h3 className="mt-2 font-black text-emerald-950">{mover.productName}</h3>
                  <p className="mt-1 text-sm font-bold text-emerald-900">{mover.changePercent.toFixed(1)}% move · {mover.latestPrice.toFixed(2)} SEK</p>
                </Link>
              ))}
            </div>
          </MvpSectionCard>

          <MvpSectionCard title="Data quality panel">
            <div className="grid gap-3 md:grid-cols-3">
              {data.categoryIndexRows.slice(0, 6).map((row) => (
                <Link className="rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-700" href={categoryBrowseHref(row.categorySlug)} key={`quality-${row.categorySlug}`}>
                  <span className="block font-black text-slate-950">{row.categoryName}</span>
                  <span className="block">{row.observationCount.toLocaleString('sv-SE')} observations</span>
                  <span className="block">{row.freshnessLabel} · {row.confidenceLabel}</span>
                </Link>
              ))}
            </div>
          </MvpSectionCard>

          <MvpSectionCard title="Biggest movers">
            {data.biggestMovers.length > 0 ? (
              <ul className="space-y-3">
                {data.biggestMovers.map((mover) => (
                  <li className="rounded-2xl border border-slate-100 bg-slate-50 p-4" key={mover.productSlug}>
                    <Link className="font-black text-emerald-900 underline" href={productSlugHref(mover.productSlug)}>
                      {mover.productName}
                    </Link>
                    <p className="text-sm font-semibold text-slate-600">
                      {mover.categoryLabel} · {mover.changePercent.toFixed(1)}% · {mover.sourceLabel}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <NoVerifiedDataPanel title="No verified movers in window" />
            )}
          </MvpSectionCard>
        </div>

        <aside className="space-y-4">
          <MvpSectionCard title="Your market watchlist">
            <p className="text-sm font-semibold leading-6 text-slate-700">Sign in to track products, stores, categories, and saved market views. Until then, watchlist panels stay empty rather than showing sample rows.</p>
            <Link className="mt-3 inline-block rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white" href="/watchlist">
              Open watchlist
            </Link>
          </MvpSectionCard>
          <MvpSectionCard title="Methodology">
            <Link className="text-sm font-black text-emerald-800 underline" href="/methodology">
              How indexes and deal labels are calculated →
            </Link>
          </MvpSectionCard>
        </aside>
      </div>

      <div className="mx-auto mt-8 w-full max-w-6xl">
        <PublicAdSlot slotId="market_bottom" />
      </div>
    </PageShell>
  );
}

function buildMarketEvidence(data: ReturnType<typeof getMarketOverviewData>) {
  const observations = data.categoryIndexRows.reduce((sum, row) => sum + row.observationCount, 0);
  return {
    sourceLabel: 'OpenPrices + matched chain catalogue',
    lastObservedAt: data.lastUpdatedAt,
    freshnessLabel: 'aging' as const,
    confidence: observations > 100 ? 0.8 : observations > 0 ? 0.55 : 0,
    confidenceLabel: data.confidenceLabel,
    observationCount: observations
  };
}
