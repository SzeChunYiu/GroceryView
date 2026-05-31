import Link from 'next/link';
import { PriceDropDiscoveryRail } from '@/app/page-sections/trending';
import { FeaturePlacementMap } from '@/components/feature-placement-map';
import { PageShell } from '@/components/data-ui';
import { getHomePageData } from '@/lib/mvp/data';
import { formatDate, formatSek, formatPercent } from '@/lib/mvp/format';
import { categoryMarketHref, productRoute } from '@/lib/mvp/routes';
import { MvpSectionCard } from '@/components/mvp/mvp-section-card';
import { MvpProductCard } from '@/components/mvp/product-card';
import { NoVerifiedDataPanel } from '@/components/mvp/no-verified-data-panel';
import { DealBadge } from '@/components/mvp/deal-badge';
import { EvidenceStrip } from '@/components/mvp/evidence-strip';
import { PublicAdSlot } from '@/components/public-ad-slot';
import { KpiCard } from '@/components/mvp/visual-intelligence';
import { GeometricHeroArt } from './geometric-hero-art';

/** SearchFirstHome — homepage redesign (feat/figma-homepage).
 *  Style A (Scandinavian clarity) with subtle Style C art in the hero band only.
 *  Server component — uses synchronous getHomePageData(), no client boundary needed.
 */
export function SearchFirstHome() {
  const data = getHomePageData();

  /* ── market ticker: up to 4 biggest movers from real data ── */
  const tickerItems = data.marketSnapshot.biggestMovers
    .filter((m) => Number.isFinite(m.changePercent) && Number.isFinite(m.latestPrice))
    .slice(0, 4);

  const tickerFallback = data.marketSnapshot.categoryIndexRows
    .filter((r) => r.weeklyChangePct !== undefined)
    .slice(0, 4);

  return (
    <PageShell>
      {/* ══════════════════════════════════════════════
          HERO BAND — search centerpiece + geometric art
      ══════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden rounded-[2rem] bg-[oklch(96.5%_0.012_78)]"
        style={{ minHeight: '280px' }}
        aria-label="Search groceries"
      >
        {/* Decorative geometric art — right-weighted, stays behind search */}
        <GeometricHeroArt />

        {/* Hero content — sits above art */}
        <div className="relative z-10 flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 md:max-w-[58%]">
          {/* Eyebrow */}
          <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-[oklch(48%_0.16_38)]">
            Verified grocery intelligence
          </p>

          {/* Headline */}
          <h1
            className="text-3xl font-semibold leading-tight tracking-tight text-[oklch(18%_0.020_250)] sm:text-4xl"
            style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}
          >
            Where can I save money on groceries today?
          </h1>

          <p className="mt-3 text-sm font-medium leading-6 text-[oklch(18%_0.020_250)] opacity-75">
            Compare prices across Swedish grocery chains using verified source data.
          </p>

          {/* ── Search form ── */}
          <form action="/search" className="mt-5 flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="hero-search">
              Search any product, store, or category
            </label>
            <input
              className="min-w-0 flex-1 rounded-2xl border border-[oklch(86%_0.014_78)] bg-white px-5 py-3.5 text-base font-semibold text-[oklch(18%_0.020_250)] shadow-sm placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[oklch(48%_0.16_38)]"
              id="hero-search"
              name="q"
              placeholder="Search any product, store, or category"
              type="search"
              autoComplete="off"
            />
            <button
              className="shrink-0 rounded-2xl bg-[oklch(48%_0.16_38)] px-6 py-3.5 text-sm font-black text-white shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[oklch(48%_0.16_38)] focus:ring-offset-2"
              type="submit"
            >
              Search
            </button>
          </form>

          {/* ── Quick links ── */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              className="rounded-full border border-[oklch(86%_0.014_78)] bg-white/80 px-3 py-1.5 text-xs font-black text-[oklch(18%_0.020_250)] hover:bg-white"
              href="/browse"
            >
              Browse categories
            </Link>
            <Link
              className="rounded-full border border-[oklch(86%_0.014_78)] bg-white/80 px-3 py-1.5 text-xs font-black text-[oklch(18%_0.020_250)] hover:bg-white"
              href="/deals"
            >
              Today&apos;s deals
            </Link>
            <Link
              className="rounded-full border border-[oklch(86%_0.014_78)] bg-white/80 px-3 py-1.5 text-xs font-black text-[oklch(18%_0.020_250)] hover:bg-white"
              href="/market"
            >
              Market overview
            </Link>
            <Link
              className="rounded-full border border-[oklch(86%_0.014_78)] bg-white/80 px-3 py-1.5 text-xs font-black text-[oklch(18%_0.020_250)] hover:bg-white"
              href="/map"
            >
              Price map
            </Link>
          </div>

          {/* ── Evidence line ── */}
          <p className="mt-4 text-xs font-semibold text-slate-500">
            Snapshot {formatDate(data.snapshotGeneratedAt)} · {data.productCount.toLocaleString('sv-SE')} verified products ·{' '}
            {data.categoryCount.toLocaleString('sv-SE')} categories
          </p>
        </div>

        {/* ── Market ticker — slim line at hero bottom ── */}
        {(tickerItems.length > 0 || tickerFallback.length > 0) && (
          <div
            className="relative z-10 border-t border-[oklch(86%_0.014_78)] bg-white/70 px-5 py-2"
            aria-label="Market price movers"
          >
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
              <span
                className="shrink-0 text-[10px] font-black uppercase tracking-[0.16em] text-[oklch(48%_0.16_38)]"
              >
                Movers
              </span>
              {tickerItems.length > 0
                ? tickerItems.map((mover) => {
                    const isUp = mover.changePercent > 0;
                    const color = isUp
                      ? 'text-[oklch(48%_0.18_25)]'
                      : 'text-[oklch(46%_0.14_152)]';
                    return (
                      <span key={mover.productSlug} className="flex items-center gap-1.5 text-xs">
                        <span className="font-semibold text-[oklch(18%_0.020_250)] opacity-80 max-w-[120px] truncate">
                          {mover.productName}
                        </span>
                        <span
                          className={`font-mono font-bold ${color}`}
                          style={{ fontFamily: 'var(--font-mono, ui-monospace, monospace)' }}
                        >
                          {isUp ? '+' : ''}{formatPercent(mover.changePercent)}
                        </span>
                        <span
                          className="font-mono text-slate-500"
                          style={{ fontFamily: 'var(--font-mono, ui-monospace, monospace)' }}
                        >
                          {formatSek(mover.latestPrice)}
                        </span>
                      </span>
                    );
                  })
                : tickerFallback.map((row) => {
                    const isUp = (row.weeklyChangePct ?? 0) > 0;
                    const color = isUp
                      ? 'text-[oklch(48%_0.18_25)]'
                      : 'text-[oklch(46%_0.14_152)]';
                    return (
                      <span key={row.categorySlug} className="flex items-center gap-1.5 text-xs">
                        <span className="font-semibold text-[oklch(18%_0.020_250)] opacity-80">
                          {row.categoryName}
                        </span>
                        <span
                          className={`font-mono font-bold ${color}`}
                          style={{ fontFamily: 'var(--font-mono, ui-monospace, monospace)' }}
                        >
                          {isUp ? '+' : ''}{formatPercent(row.weeklyChangePct)}
                        </span>
                      </span>
                    );
                  })}
              <Link
                href="/market"
                className="ml-auto shrink-0 text-[10px] font-black uppercase tracking-[0.14em] text-[oklch(48%_0.16_38)] hover:underline"
              >
                Full market →
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Ad slot */}
      <div className="mt-6">
        <PublicAdSlot slotId="home_after_hero" />
      </div>

      {/* ══════════════════════════════════════════════
          DOMAIN ENTRY CARDS
      ══════════════════════════════════════════════ */}
      <section className="mt-6" aria-label="Domain cards">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[oklch(48%_0.16_38)]">
          Explore
        </p>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          {[
            {
              title: 'Compare groceries',
              detail: 'Browse verified grocery categories, deal leaders, and chain price evidence.',
              href: '/browse',
              source: 'verified grocery price rows',
              freshness: formatDate(data.snapshotGeneratedAt),
              confidence: `${data.productCount.toLocaleString('sv-SE')} products tracked`,
              limitation: 'No shelf stock guarantee.'
            },
            {
              title: 'Compare OTC pharmacy prices',
              detail: 'Open public OTC catalog comparisons with exact EAN and safety boundaries.',
              href: '/pharmacy',
              source: 'public OTC catalog rows',
              freshness: 'source retrieved date',
              confidence: 'exact-EAN comparisons only',
              limitation: 'No prescription, medical advice, or stock claim.'
            },
            {
              title: 'Compare fuel prices',
              detail: 'Review operator-level price per litre by grade without station pump-price overclaims.',
              href: '/fuel',
              source: 'operator price evidence + OSM stations',
              freshness: 'observed/retrieved source date',
              confidence: 'operator-level confidence',
              limitation: 'No station pump-price inference.'
            }
          ].map((domain) => (
            <Link
              className="rounded-3xl border border-[oklch(86%_0.014_78)] bg-white/88 p-5 shadow-sm transition hover:-translate-y-0.5 hover:ring-2 hover:ring-[oklch(86%_0.014_78)]"
              href={domain.href}
              key={domain.title}
            >
              <h2 className="text-lg font-black text-[oklch(18%_0.020_250)]">{domain.title}</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{domain.detail}</p>
              <dl className="mt-3 grid gap-1 text-xs font-semibold leading-5 text-slate-600">
                <div>source: {domain.source}</div>
                <div>freshness: {domain.freshness}</div>
                <div>confidence: {domain.confidence}</div>
                <div className="mt-1 rounded-xl bg-slate-50 p-2 text-amber-900">
                  limitation: {domain.limitation}
                </div>
              </dl>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          KPI METRICS
      ══════════════════════════════════════════════ */}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: 'Products tracked',
            value: data.productCount.toLocaleString('sv-SE'),
            detail: 'Products tracked show how much of the catalogue has verified evidence.',
            href: '/products'
          },
          {
            label: 'Stores mapped',
            value: data.mapPreviewStores.length.toLocaleString('sv-SE'),
            detail: 'Store coordinates help connect prices to real shopping trips.',
            href: '/map'
          },
          {
            label: 'Fresh price observations',
            value: data.marketSnapshot.categoryIndexRows
              .reduce((sum, row) => sum + row.observationCount, 0)
              .toLocaleString('sv-SE'),
            detail: 'Fresh price observations help us avoid showing stale deals.',
            href: '/coverage'
          },
          {
            label: 'Chains compared',
            value: data.marketSnapshot.chainIndexSeries.length.toLocaleString('sv-SE'),
            detail: 'Chain comparisons show where prices differ before you leave home.',
            href: '/chain-index'
          },
          {
            label: 'Categories covered',
            value: data.categoryCount.toLocaleString('sv-SE'),
            detail: 'Category coverage lets you drill from market movement into products.',
            href: '/browse'
          }
        ].map((metric) => (
          <KpiCard
            detail={metric.detail}
            href={metric.href}
            key={metric.label}
            label={metric.label}
            value={metric.value}
          />
        ))}
      </div>

      {/* ══════════════════════════════════════════════
          PRICE DROP DISCOVERY RAIL
      ══════════════════════════════════════════════ */}
      <div className="mt-6">
        <PriceDropDiscoveryRail />
      </div>

      {/* ══════════════════════════════════════════════
          FEATURE MAP
      ══════════════════════════════════════════════ */}
      <div className="mt-6">
        <FeaturePlacementMap compact />
      </div>

      {/* ══════════════════════════════════════════════
          DEALS + FEATURED PRODUCTS
      ══════════════════════════════════════════════ */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <MvpSectionCard title="Today&apos;s best deals">
          {data.dealsPreview.length > 0 ? (
            <div className="grid gap-3">
              {data.dealsPreview.map((deal) => (
                <Link
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:bg-white"
                  href={productRoute(deal.product.id)}
                  key={deal.id}
                >
                  <div className="flex items-center justify-between gap-2">
                    <DealBadge label={deal.dealLabel} />
                    <span
                      className="text-lg font-black text-[oklch(46%_0.14_152)]"
                      style={{ fontFamily: 'var(--font-mono, ui-monospace, monospace)' }}
                    >
                      {formatSek(deal.currentPrice)}
                    </span>
                  </div>
                  <p className="mt-2 font-black text-slate-950">{deal.product.name}</p>
                  <EvidenceStrip evidence={deal} />
                </Link>
              ))}
              <Link className="text-sm font-black text-[oklch(48%_0.16_38)] underline" href="/deals">
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

      {/* ══════════════════════════════════════════════
          MARKET SNAPSHOT TABLE (link to Market page)
      ══════════════════════════════════════════════ */}
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
                        <Link
                          className="text-[oklch(48%_0.16_38)] underline"
                          href={categoryMarketHref(row.categorySlug)}
                        >
                          {row.categoryName}
                        </Link>
                      </td>
                      <td
                        className="py-3 pr-4 font-semibold"
                        style={{ fontFamily: 'var(--font-mono, ui-monospace, monospace)' }}
                      >
                        {row.weeklyChangePct !== undefined
                          ? `${row.weeklyChangePct.toFixed(1)}%`
                          : '—'}
                      </td>
                      <td
                        className="py-3 pr-4 font-semibold"
                        style={{ fontFamily: 'var(--font-mono, ui-monospace, monospace)' }}
                      >
                        {row.observationCount}
                      </td>
                      <td className="py-3 font-semibold">{row.confidenceLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Link
              className="mt-4 inline-block text-sm font-black text-[oklch(48%_0.16_38)] underline"
              href="/market"
            >
              Open market overview →
            </Link>
          </>
        ) : (
          <NoVerifiedDataPanel />
        )}
      </MvpSectionCard>

      {/* ══════════════════════════════════════════════
          PRICE MAP + HOW IT WORKS
      ══════════════════════════════════════════════ */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <MvpSectionCard title="Price map preview">
          {data.mapPreviewStores.length > 0 ? (
            <ul className="space-y-2">
              {data.mapPreviewStores.map((store) => (
                <li
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
                  key={store.slug}
                >
                  <Link
                    className="font-black text-slate-950 underline"
                    href={`/stores/${store.slug}`}
                  >
                    {store.name}
                  </Link>
                  <span className="text-xs font-black uppercase text-slate-500">{store.chain}</span>
                </li>
              ))}
              <Link className="text-sm font-black text-[oklch(48%_0.16_38)] underline" href="/map">
                Open price map →
              </Link>
            </ul>
          ) : (
            <NoVerifiedDataPanel
              title="Store map layer unavailable"
              message="Verified store coordinates are not available for this snapshot yet."
            />
          )}
        </MvpSectionCard>

        <MvpSectionCard title="How it works">
          <ol className="space-y-3 text-sm font-medium leading-6 text-slate-700">
            <li>1. Daily ingestion writes price observations into PostgreSQL for each configured chain.</li>
            <li>
              2. The site snapshot exports latest verified prices with source, freshness, and confidence
              metadata.
            </li>
            <li>
              3. Deal labels compare current prices with historic and nearby evidence — never synthetic
              placeholders.
            </li>
            <li>
              4. Panels without enough observations show a fail-closed state instead of fabricated
              numbers.
            </li>
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-900 hover:bg-slate-200"
              href="/methodology"
            >
              Methodology
            </Link>
            <Link
              className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-900 hover:bg-slate-200"
              href="/data-sources"
            >
              Data sources
            </Link>
            <Link
              className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-900 hover:bg-slate-200"
              href="/coverage"
            >
              Coverage
            </Link>
          </div>
        </MvpSectionCard>
      </div>
    </PageShell>
  );
}
