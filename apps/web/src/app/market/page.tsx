import Link from 'next/link';
import { PageShell } from '@/components/data-ui';
import { MvpBreadcrumbs } from '@/components/mvp/mvp-breadcrumbs';
import { MvpPageHeader } from '@/components/mvp/mvp-page-header';
import { MvpSectionCard } from '@/components/mvp/mvp-section-card';
import { NoVerifiedDataPanel } from '@/components/mvp/no-verified-data-panel';
import { EvidenceStrip } from '@/components/mvp/evidence-strip';
import { getMarketOverviewData } from '@/lib/mvp/data';
import { categoryBrowseHref, categoryMarketHref, productSlugHref } from '@/lib/mvp/routes';
import { routeMetadata } from '@/lib/seo';

type SearchParams = Record<string, string | string[] | undefined>;

export function generateMetadata() {
  return routeMetadata('/market');
}

export default async function MarketPage({ searchParams }: Readonly<{ searchParams?: Promise<SearchParams> }>) {
  const resolved = await (searchParams ?? Promise.resolve({}));
  const data = getMarketOverviewData(resolved);
  return (
    <PageShell>
      <MvpBreadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Market' }]} />
      <MvpPageHeader
        eyebrow="Market overview"
        title="Chain and category price indexes from verified observations"
        subtitle="Indexes replay dated observations through the same chain-index engine used on chain-index pages. Missing history stays labelled instead of interpolated."
        evidence={<EvidenceStrip evidence={buildMarketEvidence(data)} />}
      />

      <form className="mt-6 flex flex-wrap gap-2">
        {[
          { key: 'region', label: 'Region', value: data.selectedRegion, options: ['stockholm', 'goteborg', 'malmo'] },
          { key: 'index', label: 'Index', value: data.selectedIndexType, options: ['chain-price', 'category-price'] }
        ].map((field) => (
          <label className="text-sm font-black text-slate-700" key={field.key}>
            {field.label}
            <select className="ml-2 rounded-full border border-slate-200 bg-white px-3 py-2" defaultValue={field.value} name={field.key}>
              {field.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ))}
        <button className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white" type="submit">
          Apply
        </button>
      </form>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_18rem]">
        <div className="space-y-6">
          <MvpSectionCard title="Chain price index">
            {data.chainIndexSeries.length > 0 ? (
              <div className="space-y-4">
                {data.chainIndexSeries.map((series) => (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4" key={`${series.chain}-${series.indexType}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-black text-slate-950">{series.chain}</p>
                      <p className="text-sm font-semibold text-slate-600">
                        Latest {series.points.at(-1)?.value.toFixed(1) ?? '—'} · weekly{' '}
                        {series.weeklyChangePct !== undefined ? `${series.weeklyChangePct.toFixed(1)}%` : '—'}
                      </p>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      {series.points.length} dated index points · {series.sourceLabel}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <NoVerifiedDataPanel title="Chain index chart unavailable" message="Not enough dated index points to render a chart for the selected filters." />
            )}
          </MvpSectionCard>

          <MvpSectionCard title="Category index table">
            {data.categoryIndexRows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      <th className="py-2 pr-4">Category</th>
                      <th className="py-2 pr-4">Weekly</th>
                      <th className="py-2 pr-4">Observations</th>
                      <th className="py-2 pr-4">Freshness</th>
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
                        <td className="py-3 pr-4 font-semibold">{row.observationCount}</td>
                        <td className="py-3 pr-4 font-semibold">{row.freshnessLabel}</td>
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
          <MvpSectionCard title="Watchlist">
            <p className="text-sm font-semibold leading-6 text-slate-700">Sign in to save products, stores, and category market views. Until then, watchlist panels stay empty rather than showing sample rows.</p>
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
