import Link from 'next/link';
import { PriceDropDiscoveryRail } from '@/app/page-sections/trending';
import { PageShell } from '@/components/data-ui';
import { getHomePageData } from '@/lib/mvp/data';
import { formatDate, formatSek } from '@/lib/mvp/format';
import { categoryMarketHref, productRoute } from '@/lib/mvp/routes';
import { MvpPageHeader } from './mvp-page-header';
import { MvpSectionCard } from './mvp-section-card';
import { MvpProductCard } from './product-card';
import { NoVerifiedDataPanel } from './no-verified-data-panel';
import { DealBadge } from './deal-badge';
import { EvidenceStrip } from './evidence-strip';
export function MvpHomePage() {
  const data = getHomePageData();
  return (
    <PageShell>
      <MvpPageHeader
        eyebrow="Verified grocery intelligence"
        title="Compare Swedish grocery prices with evidence, not guesswork"
        subtitle="GroceryView shows observed prices, deal quality, market indexes, and store coverage from verified ingestion pipelines. Missing data stays hidden instead of being invented."
        actions={
          <>
            <Link className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white" href="/search">
              Search products
            </Link>
            <Link className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-900" href="/browse">
              Browse categories
            </Link>
            <Link className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-900" href="/deals">
              See deals
            </Link>
          </>
        }
        evidence={
          <p className="text-sm font-semibold text-slate-600">
            Snapshot {formatDate(data.snapshotGeneratedAt)} · {data.productCount.toLocaleString('sv-SE')} verified products ·{' '}
            {data.categoryCount.toLocaleString('sv-SE')} categories with observations
          </p>
        }
      />

      <form action="/search" className="mt-6 flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="mvp-home-search">
          Search groceries
        </label>
        <input
          className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-950 shadow-sm"
          id="mvp-home-search"
          name="q"
          placeholder="Search milk, bread, coffee…"
          type="search"
        />
        <button className="rounded-2xl bg-emerald-800 px-5 py-3 text-sm font-black text-white" type="submit">
          Search
        </button>
      </form>

      <div className="mt-6">
        <PriceDropDiscoveryRail />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <MvpSectionCard title="Today's best deals">
          {data.dealsPreview.length > 0 ? (
            <div className="grid gap-3">
              {data.dealsPreview.map((deal) => (
                <Link className="rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:bg-white" href={productRoute(deal.product.id)} key={deal.id}>
                  <div className="flex items-center justify-between gap-2">
                    <DealBadge label={deal.dealLabel} />
                    <span className="text-lg font-black text-emerald-800">{formatSek(deal.currentPrice)}</span>
                  </div>
                  <p className="mt-2 font-black text-slate-950">{deal.product.name}</p>
                  <EvidenceStrip evidence={deal} />
                </Link>
              ))}
              <Link className="text-sm font-black text-emerald-800 underline" href="/deals">
                Open full deals feed →
              </Link>
            </div>
          ) : (
            <NoVerifiedDataPanel title="No verified deal leaders yet" />
          )}
        </MvpSectionCard>

        <MvpSectionCard title="Featured products">
          {data.featuredProducts.length > 0 ? (
            <div className="grid gap-3">
              {data.featuredProducts.map((product) => (
                <MvpProductCard key={product.slug} product={product} />
              ))}
            </div>
          ) : (
            <NoVerifiedDataPanel />
          )}
        </MvpSectionCard>
      </div>

      <MvpSectionCard className="mt-6" title="Market snapshot">
        {data.marketSnapshot.categoryIndexRows.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    <th className="py-2 pr-4">Category</th>
                    <th className="py-2 pr-4">Weekly</th>
                    <th className="py-2 pr-4">Observations</th>
                    <th className="py-2">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {data.marketSnapshot.categoryIndexRows.slice(0, 6).map((row) => (
                    <tr className="border-b border-slate-100" key={row.categorySlug}>
                      <td className="py-3 pr-4 font-black">
                        <Link className="text-emerald-800 underline" href={categoryMarketHref(row.categorySlug)}>
                          {row.categoryName}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 font-semibold">{row.weeklyChangePct !== undefined ? `${row.weeklyChangePct.toFixed(1)}%` : '—'}</td>
                      <td className="py-3 pr-4 font-semibold">{row.observationCount}</td>
                      <td className="py-3 font-semibold">{row.confidenceLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Link className="mt-4 inline-block text-sm font-black text-emerald-800 underline" href="/market">
              Open market overview →
            </Link>
          </>
        ) : (
          <NoVerifiedDataPanel />
        )}
      </MvpSectionCard>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <MvpSectionCard title="Price map preview">
          {data.mapPreviewStores.length > 0 ? (
            <ul className="space-y-2">
              {data.mapPreviewStores.map((store) => (
                <li className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2" key={store.slug}>
                  <Link className="font-black text-slate-950 underline" href={`/stores/${store.slug}`}>
                    {store.name}
                  </Link>
                  <span className="text-xs font-black uppercase text-slate-500">{store.chain}</span>
                </li>
              ))}
              <Link className="text-sm font-black text-emerald-800 underline" href="/map">
                Open price map →
              </Link>
            </ul>
          ) : (
            <NoVerifiedDataPanel title="Store map layer unavailable" message="Verified store coordinates are not available for this snapshot yet." />
          )}
        </MvpSectionCard>

        <MvpSectionCard title="How it works">
          <ol className="space-y-3 text-sm font-semibold leading-6 text-slate-700">
            <li>1. Daily ingestion writes price observations into PostgreSQL for each configured chain.</li>
            <li>2. The site snapshot exports latest verified prices with source, freshness, and confidence metadata.</li>
            <li>3. Deal labels compare current prices with historic and nearby evidence—never synthetic placeholders.</li>
            <li>4. Panels without enough observations show a fail-closed state instead of fabricated numbers.</li>
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-900" href="/methodology">
              Methodology
            </Link>
            <Link className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-900" href="/data-sources">
              Data sources
            </Link>
            <Link className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-900" href="/coverage">
              Coverage
            </Link>
          </div>
        </MvpSectionCard>
      </div>
    </PageShell>
  );
}
