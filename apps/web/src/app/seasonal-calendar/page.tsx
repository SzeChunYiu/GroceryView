import Link from 'next/link';
import { Card, Eyebrow, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { seasonalProduceCalendar } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/seasonal-calendar');
}

export default function SeasonalCalendarPage() {
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
