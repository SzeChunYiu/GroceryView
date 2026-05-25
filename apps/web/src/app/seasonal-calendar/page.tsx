import Link from 'next/link';
import { Card, Eyebrow, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { SeasonalProductCard } from '@/components/seasonal-product-card';
import { buildSeasonalProduceDiscoveryCards } from '@/lib/deal-context';
import { buildCategorySeasonalDiscoveryModules } from '@/lib/price-intelligence';
import { buildSeasonalProduceDrilldownCards } from '@/lib/trends';
import { categoryDealLeaders, localSeasonalPicks, seasonalProduceCalendar } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/seasonal-calendar');
}

export default function SeasonalCalendarPage() {
  const seasonalDiscoveryCards = buildSeasonalProduceDiscoveryCards({
    deals: categoryDealLeaders,
    rows: seasonalProduceCalendar.topBestBuys
  });
  const produceCategoryModules = buildCategorySeasonalDiscoveryModules({
    categorySlug: 'produce',
    seasonalRows: seasonalProduceCalendar.produceSeasonalityRows
  });
  const monthlyDrilldownCards = buildSeasonalProduceDrilldownCards(seasonalProduceCalendar.topBestBuys, 6);

  return (
    <PageShell>
      <Eyebrow>feat(calendar) · historical price seasonality</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Seasonal best time to buy produce calendar</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        GroceryView turns dated OpenPrices rows into a produce planning calendar using historical monthly averages. Best time to buy means the cheapest observed month in the product&apos;s own history; No forecast or synthetic seasonal prediction is shown.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr_1fr]">
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Produce rows</p>
          <p className="mt-2 text-5xl font-black text-emerald-800">{seasonalProduceCalendar.productCount}</p>
          <p className="mt-3 font-semibold text-slate-700">products with enough dated history for a seasonal month view.</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Observations</p>
          <p className="mt-2 text-5xl font-black text-slate-950">{seasonalProduceCalendar.observationCount}</p>
          <p className="mt-3 font-semibold text-slate-700">dated OpenPrices rows · source: {seasonalProduceCalendar.sourceLabel}</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Observed months</p>
          <p className="mt-2 text-5xl font-black text-slate-950">{seasonalProduceCalendar.observedMonthCount}</p>
          <p className="mt-3 font-semibold text-slate-700">calendar month buckets with real price history.</p>
        </Card>
      </div>

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Best time to buy</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Top produce windows from historical monthly averages</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              {seasonalProduceCalendar.methodology}
            </p>
          </div>
          <Link className="rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white" href="/products">
            Browse product tickers
          </Link>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {seasonalProduceCalendar.topBestBuys.map((row) => (
            <Link className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm hover:border-emerald-700" href={`/products/${row.slug}`} key={row.slug}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">{row.bestBuyMonth} · {row.confidenceLabel}</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{row.productName}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-600">{row.brand} · {row.categoryLabel}</p>
              <div className="mt-3 grid gap-2 text-sm text-slate-700">
                <p className="rounded-2xl bg-emerald-100 p-3 font-black text-emerald-950">historicalMonthlyAverage {row.historicalMonthlyAverageLabel}</p>
                <p className="rounded-2xl bg-slate-50 p-3 font-semibold">Typical {row.typicalMonthlyAverageLabel} · {row.savingsVsTypicalLabel}</p>
                <p className="rounded-2xl bg-slate-50 p-3 font-semibold">{row.observationCount} observations · {row.observedMonthCount} months</p>
              </div>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-emerald-200 bg-emerald-50/70">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Monthly drill-down cards</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Seasonal products with chain comparison prompts</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              Each card lists observed monthly averages, expected price behavior, and recommended chains to compare before shopping. These are historical observations, not forecasts.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-emerald-900 shadow-sm">{monthlyDrilldownCards.length} drill-downs</p>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {monthlyDrilldownCards.map((card) => <SeasonalProductCard card={card} key={card.slug} />)}
        </div>
      </Card>

      <Card className="mt-6 border-fuchsia-200 bg-fuchsia-50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-fuchsia-800">Category-page module preview</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Reusable seasonal discovery blocks for category pages</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              {produceCategoryModules.guardrail}
            </p>
          </div>
          <Link className="rounded-full bg-fuchsia-700 px-5 py-3 text-sm font-black text-white" href="/categories/produce">
            Open produce category
          </Link>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {produceCategoryModules.historicBestBuyWindows.map((row) => (
            <Link className="rounded-2xl border border-fuchsia-200 bg-white p-4 shadow-sm hover:border-fuchsia-700" href={`/products/${row.slug}`} key={`category-module-${row.slug}`}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-fuchsia-800">{row.bestBuyMonth} historic window</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{row.productName}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{row.savingsVsTypicalLabel} · {row.confidenceLabel}</p>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-teal-200 bg-teal-50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-teal-800">Discovery feed cards</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">In-season produce with current deal links</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              Cards combine historical seasonal context with categoryDealLeaders current deal evidence. Peak months come from the observed best-buy month and its neighboring calendar buckets; linked deals stay separate from the seasonal price claim.
            </p>
          </div>
          <Link className="rounded-full bg-teal-700 px-5 py-3 text-sm font-black text-white" href="/screener">
            Open current deals
          </Link>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {seasonalDiscoveryCards.map((card) => (
            <Link className="rounded-2xl border border-teal-200 bg-white p-4 shadow-sm hover:border-teal-700" href={`/products/${card.slug}`} key={card.slug}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-800">Peak months {card.peakMonths.join(' / ')}</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{card.productName}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-600">{card.brand ?? 'Brand not reported'} · {card.categoryLabel}</p>
              <div className="mt-3 grid gap-2 text-sm text-slate-700">
                <p className="rounded-2xl bg-teal-100 p-3 font-black text-teal-950">{card.typicalPriceRangeLabel}</p>
                <p className="rounded-2xl bg-white p-3 font-semibold">Best month {card.bestBuyMonth} · {card.historicalMonthlyAverageLabel} · {card.savingsVsTypicalLabel}</p>
              </div>
              <div className="mt-3 space-y-2">
                {card.linkedCurrentDeals.length > 0 ? card.linkedCurrentDeals.map((deal) => (
                  <p className="rounded-xl bg-slate-50 p-3 text-xs font-bold leading-5 text-slate-700" key={`${card.slug}-${deal.productSlug}`}>
                    Current deal: {deal.productName} · {deal.storeName ?? 'store not reported'} · {deal.priceLabel ?? 'price evidence in deal row'}
                  </p>
                )) : (
                  <p className="rounded-xl bg-slate-50 p-3 text-xs font-bold leading-5 text-slate-700">No linked current category deal is available right now.</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-lime-200 bg-lime-50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-lime-800">{localSeasonalPicks.persona} evidence</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Local & seasonal picks</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              Local means originEvidence from an explicit Swedish-origin label. Seasonal means seasonalEvidence from
              historicalMonthlyAverage rows. No carbon or harvest claim is inferred from either signal.
            </p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-lime-900 shadow-sm">
            {localSeasonalPicks.status.replaceAll('_', ' ')}
          </div>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-800">originEvidence · explicit Swedish-origin label</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {localSeasonalPicks.localOriginRows.map((row) => (
                <Link className="rounded-2xl border border-lime-200 bg-white p-4 shadow-sm hover:border-lime-700" href={`/products/${row.slug}`} key={row.slug}>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-lime-800">{row.lowestChain} · {row.lowestPriceLabel}</p>
                  <h3 className="mt-2 text-lg font-black text-slate-950">{row.productName}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{row.brand} · {row.categoryLabel}</p>
                  <ul className="mt-3 space-y-2 text-xs font-bold text-slate-700">
                    {row.originEvidence.map((evidence) => (
                      <li className="rounded-xl bg-lime-100 p-3 text-lime-950" key={evidence}>{evidence}</li>
                    ))}
                  </ul>
                  <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-700">{row.claimBoundary}</p>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">seasonalEvidence · historical monthly price rows</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {localSeasonalPicks.seasonalEvidenceRows.map((row) => (
                <Link className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm hover:border-emerald-700" href={`/products/${row.slug}`} key={row.slug}>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">{row.bestBuyMonth} · {row.confidenceLabel}</p>
                  <h3 className="mt-2 text-lg font-black text-slate-950">{row.productName}</h3>
                  <p className="mt-3 rounded-xl bg-emerald-100 p-3 text-sm font-black text-emerald-950">historicalMonthlyAverage {row.historicalMonthlyAverageLabel}</p>
                  <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-700">{row.seasonalEvidence}</p>
                  <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-700">{row.claimBoundary}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <ul className="mt-5 grid gap-3 text-sm font-semibold leading-6 text-slate-700 md:grid-cols-2">
          {localSeasonalPicks.guardrails.map((guardrail) => (
            <li className="rounded-2xl bg-white p-4" key={guardrail}>• {guardrail}</li>
          ))}
        </ul>
      </Card>

      <Card className="mt-6">
        <h2 className="text-2xl font-black">Calendar month matrix</h2>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
          Months without a best-buy product stay visible as coverage gaps. GroceryView does not backfill missing seasons, make harvest claims, or forecast next month&apos;s shelf price.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {seasonalProduceCalendar.calendarMonths.map((month) => (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={month.monthLabel}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-2xl font-black text-slate-950">{month.monthLabel}</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{month.confidenceLabel}</p>
                </div>
                <p className="rounded-full bg-white px-3 py-1 text-sm font-black text-slate-700">{month.bestBuyCount} picks</p>
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-700">{month.observationCount} observations · {month.productCount} products · avg {month.historicalMonthlyAverageLabel}</p>
              <div className="mt-3 space-y-2">
                {month.bestBuyProducts.length > 0 ? month.bestBuyProducts.map((product) => (
                  <Link className="block rounded-xl bg-white p-3 text-sm font-bold text-slate-800 hover:text-emerald-800" href={`/products/${product.slug}`} key={product.slug}>
                    {product.productName} · {product.historicalMonthlyAverageLabel} · {product.savingsVsTypicalLabel}
                  </Link>
                )) : (
                  <p className="rounded-xl bg-white p-3 text-sm font-semibold text-slate-600">No best-buy month claim for this bucket yet.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-lime-200 bg-lime-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-lime-800">Eco-conscious planning guardrail</p>
        <h2 className="mt-2 text-2xl font-black">Seasonal content without carbon invention</h2>
        <ul className="mt-4 space-y-3 text-sm font-semibold leading-6 text-slate-700">
          {seasonalProduceCalendar.ecoSeasonalGuidance.map((guidance) => (
            <li className="rounded-2xl bg-white p-4" key={guidance}>• {guidance}</li>
          ))}
        </ul>
      </Card>

      <Card className="mt-6 border-amber-200 bg-amber-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-800">Honesty rules</p>
        <ul className="mt-4 space-y-3 text-sm font-semibold leading-6 text-slate-700">
          {seasonalProduceCalendar.guardrails.map((guardrail) => (
            <li className="rounded-2xl bg-white p-4" key={guardrail}>• {guardrail}</li>
          ))}
        </ul>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <TopSpreads limit={5} />
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
