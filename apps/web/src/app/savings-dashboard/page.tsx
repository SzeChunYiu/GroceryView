import Link from 'next/link';
import { forecastNextMonthlyGrocerySpend } from '@groceryview/core';
import { ConfidenceBadge } from '@/components/confidence-badge';
import { Card, Eyebrow, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { elderlyFixedIncomeBudgetTracker, elderlyStaplesStabilityTracker, personalGroceryInflation, savingsDashboard, studentWeeklyBudgetTracker } from '@/lib/demo-data';
import { ecoBasketScorecard } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/savings-dashboard');
}

function formatSek(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value)
    ? new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value)
    : 'Not reported';
}

function formatSignedSek(value: number) {
  const formatted = formatSek(Math.abs(value));
  return `${value >= 0 ? '+' : '-'}${formatted}`;
}

function formatPercent(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

const purchaseHistoryForecast = forecastNextMonthlyGrocerySpend([
  { purchasedAt: '2026-01-05', total: 1240.5 },
  { purchasedAt: '2026-01-22', total: 865.2 },
  { purchasedAt: '2026-02-07', total: 1318.3 },
  { purchasedAt: '2026-02-20', total: 902.1 },
  { purchasedAt: '2026-03-09', total: 1364.8 },
  { purchasedAt: '2026-03-25', total: 948.7 },
  { purchasedAt: '2026-04-06', total: 1411.2 },
  { purchasedAt: '2026-04-21', total: 1004.4 },
  { purchasedAt: '2026-05-08', total: 1468.9 },
  { purchasedAt: '2026-05-21', total: 1032.6 }
], '2026-06');

export default function SavingsDashboardPage() {
  const topContributions = [...personalGroceryInflation.itemContributions]
    .sort((a, b) => Math.abs(b.changeAmount) - Math.abs(a.changeAmount))
    .slice(0, 5);

  return (
    <PageShell>
      <Eyebrow>Personal grocery inflation</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Savings dashboard</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        This dashboard calls the core personal CPI engine through the visible driver data: it compares the visitor basket against the previous weekly basket and labels missing coverage instead of inventing prices.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr_1fr]">
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Basket inflation</p>
          <p className="mt-2 text-5xl font-black text-emerald-800">{formatPercent(personalGroceryInflation.inflationPercent)}</p>
          <p className="mt-3 font-semibold text-slate-700">{personalGroceryInflation.baseDate} → {personalGroceryInflation.currentDate}</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Spend change</p>
          <p className="mt-2 text-5xl font-black text-slate-950">{formatSignedSek(personalGroceryInflation.changeAmount)}</p>
          <p className="mt-3 font-semibold text-slate-700">{formatSek(personalGroceryInflation.baseSpend)} baseline · {formatSek(personalGroceryInflation.currentSpend)} current</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Coverage</p>
          <p className="mt-2 text-5xl font-black text-slate-950">{personalGroceryInflation.itemContributions.length}</p>
          <p className="mt-3 font-semibold text-slate-700">priced basket lines</p>
          <div className="mt-3">
            <ConfidenceBadge
              level={personalGroceryInflation.confidence}
              label={`${personalGroceryInflation.confidence} confidence`}
              sampleSize={personalGroceryInflation.itemContributions.length}
            />
          </div>
        </Card>
      </div>

      <Card className="mt-6 border-cyan-200 bg-cyan-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-800">Next-month forecast</p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">Projected grocery spend for {purchaseHistoryForecast.forecastMonth}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-4">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Forecast</p>
            <p className="mt-2 text-3xl font-black text-cyan-900">{formatSek(purchaseHistoryForecast.predictedSpend)}</p>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Expected range</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{formatSek(purchaseHistoryForecast.lowerBound)}–{formatSek(purchaseHistoryForecast.upperBound)}</p>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">History used</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{purchaseHistoryForecast.monthsUsed} months</p>
            <p className="mt-1 text-sm font-semibold text-slate-600">{purchaseHistoryForecast.confidence} confidence</p>
          </div>
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-700">
          Forecast uses purchase_history monthly totals with a six-month moving average plus simple trend; no missing trips or cash purchases are estimated.
        </p>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <h2 className="text-2xl font-black">Largest basket drivers</h2>
          <div className="mt-4 space-y-3">
            {topContributions.map((item) => (
              <div className="rounded-2xl border border-slate-200 p-4" key={item.productId}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link className="text-lg font-black text-slate-950 hover:text-emerald-800" href={`/products/${item.productId}`}>{item.productName}</Link>
                    <p className="text-sm text-slate-600">{item.category} · basket weight {(item.weight * 100).toFixed(0)}%</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <ConfidenceBadge level={item.confidence} label={`${item.confidence} confidence`} />
                    <p className="rounded-full bg-amber-50 px-3 py-1 font-black text-amber-950">{formatPercent(item.changePercent)}</p>
                  </div>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-700">Contribution: {formatSignedSek(item.changeAmount)}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-black">Category pressure</h2>
          <div className="mt-4 space-y-3">
            {personalGroceryInflation.categoryContributions.map((category) => (
              <div className="rounded-2xl bg-slate-50 p-4" key={category.category}>
                <p className="font-black">{category.category}</p>
                <p className="text-sm text-slate-600">{formatPercent(category.changePercent)} on {formatSek(category.spend)} baseline spend</p>
              </div>
            ))}
          </div>
          {personalGroceryInflation.missingProductIds.length > 0 ? (
            <p className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-950">Missing from CPI coverage: {personalGroceryInflation.missingProductIds.join(', ')}</p>
          ) : (
            <p className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-950">All visible weekly basket rows are covered by the CPI calculation.</p>
          )}
        </Card>
      </div>

      <Card className="mt-6 border-lime-200 bg-lime-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-lime-800">{ecoBasketScorecard.persona}</p>
        <h2 className="mt-2 text-2xl font-black">Cheaper + greener basket</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
          This scorecard surfaces labelled products that are cheaper than their same-category Axfood average while keeping the environmental claim honest: carbon data unavailable, so GroceryView shows label evidence, savings, and confidence instead of fabricating kg CO2e.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-4">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Average ecoScore</p>
            <p className="mt-2 text-3xl font-black text-lime-900">{ecoBasketScorecard.averageEcoScore ?? 'Not reported'}</p>
            <p className="mt-1 text-sm font-semibold text-slate-600">label-evidence score, not emissions</p>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Basket savings</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{formatSek(ecoBasketScorecard.totalEstimatedSavingsVsCategoryAverage)}</p>
            <p className="mt-1 text-sm font-semibold text-slate-600">vs same-category observed prices</p>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Carbon</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{ecoBasketScorecard.sourceSummary.carbonKgCo2e ?? 'Unavailable'}</p>
            <p className="mt-1 text-sm font-semibold text-slate-600">carbon data unavailable, not estimated</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {ecoBasketScorecard.rows.map((row) => (
            <Link className="rounded-2xl border border-lime-200 bg-white p-4 hover:border-lime-700" href={`/products/${row.slug}`} key={row.slug}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black text-slate-950">{row.name}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{row.brand} · {row.lowestChain} · confidence: {row.confidence}</p>
                </div>
                <p className="rounded-full bg-lime-100 px-3 py-1 text-sm font-black text-lime-950">ecoScore {row.ecoScore}</p>
              </div>
              <p className="mt-3 text-sm font-bold text-slate-700">{formatSek(row.currentPrice)} current · {formatSek(row.estimatedSavingsVsCategoryAverage)} below category average</p>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-lime-800">Evidence</p>
              <p className="mt-1 text-sm text-slate-700">{row.evidence.join(' · ')}</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">{row.guardrail}</p>
            </Link>
          ))}
        </div>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm font-semibold text-slate-700">
          {ecoBasketScorecard.guardrails.map((guardrail) => <li key={guardrail}>{guardrail}</li>)}
        </ul>
      </Card>

      <Card className="mt-6 border-indigo-200 bg-indigo-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-indigo-800">{elderlyFixedIncomeBudgetTracker.persona}</p>
        <h2 className="mt-2 text-2xl font-black">Fixed-income monthly budget</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
          This monthly guardrail calls summarizeBudget for a pensionEnvelope and visible receipts, then blocks hidden cash or unscanned trips from being estimated into the fixed-income plan.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-4">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">pensionEnvelope</p>
            <p className="mt-2 text-3xl font-black text-indigo-900">{formatSek(elderlyFixedIncomeBudgetTracker.pensionEnvelope.amount)}</p>
            <p className="mt-1 text-sm font-semibold text-slate-600">{elderlyFixedIncomeBudgetTracker.pensionEnvelope.cadence}</p>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">monthlyRemainingActual</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{formatSek(elderlyFixedIncomeBudgetTracker.summary.monthlyRemainingActual)}</p>
            <p className="mt-1 text-sm font-semibold text-slate-600">{elderlyFixedIncomeBudgetTracker.summary.monthlyStatus} fixed-income plan</p>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Weekly cushion</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{formatSek(elderlyFixedIncomeBudgetTracker.summary.weeklyRemainingAfterEstimate)}</p>
            <p className="mt-1 text-sm font-semibold text-slate-600">after planned basket</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {elderlyFixedIncomeBudgetTracker.guardrails.map((guardrail) => (
            <div className="rounded-2xl border border-indigo-200 bg-white p-4" key={guardrail.label}>
              <p className="font-black text-slate-950">{guardrail.label}</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">{guardrail.action}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-700">{elderlyFixedIncomeBudgetTracker.coverage.caveat}</p>
      </Card>

      <Card className="mt-6 border-slate-300 bg-slate-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-600">{elderlyStaplesStabilityTracker.persona}</p>
        <h2 className="mt-2 text-2xl font-black">Staples price stability</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
          This senior tracker calls summarizePriceHistory for everyday staples and labels each observed price-history row with a stabilityBand instead of estimating missing weeks.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {elderlyStaplesStabilityTracker.rows.map((row) => (
            <Link className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-slate-900" href={`/products/${row.productId}`} key={row.productId}>
              <p className="font-black text-slate-950">{row.productName}</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{formatSek(row.history.latestPrice)}</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">stabilityBand: {row.stabilityBand}</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">Change {formatSignedSek(row.history.changeFromPrevious)} · {row.history.observedCount} observed points</p>
            </Link>
          ))}
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-700">{elderlyStaplesStabilityTracker.coverage.caveat}</p>
      </Card>

      <Card className="mt-6">
        <h2 className="text-2xl font-black">Savings watchpoints</h2>
        <p className="mt-2 text-sm font-semibold text-slate-600">Month-to-date planned spend {savingsDashboard.monthToDate.plannedSpend}; avoided spend {savingsDashboard.monthToDate.avoidedSpend}; best district {savingsDashboard.monthToDate.bestDistrict}.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {savingsDashboard.watchpoints.slice(0, 4).map((watchpoint) => (
            <Link className="rounded-2xl border border-slate-200 p-4 hover:border-emerald-700" href={watchpoint.href} key={watchpoint.label}>
              <p className="font-black">{watchpoint.label}</p>
              <p className="mt-1 text-sm text-slate-600">{watchpoint.product} · {watchpoint.store}</p>
              <p className="mt-2 text-sm font-bold text-emerald-900">{watchpoint.signal}</p>
              <p className="mt-1 text-sm text-slate-700">{watchpoint.action}</p>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">{studentWeeklyBudgetTracker.persona}</p>
        <h2 className="mt-2 text-2xl font-black">Weekly student budget</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
          This tracker calls summarizeBudget for a student weekly plan, then keeps the visible planned basket rows underneath the budget status instead of estimating unknown receipts.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-4">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">After planned basket</p>
            <p className="mt-2 text-3xl font-black text-emerald-800">{formatSek(studentWeeklyBudgetTracker.summary.weeklyRemainingAfterEstimate)}</p>
            <p className="mt-1 text-sm font-semibold text-slate-600">weeklyRemainingAfterEstimate from summarizeBudget</p>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Weekly actual</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{formatSek(studentWeeklyBudgetTracker.summary.weeklyActualSpend)}</p>
            <p className="mt-1 text-sm font-semibold text-slate-600">{studentWeeklyBudgetTracker.summary.weeklyStatus} budget so far</p>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Monthly remaining</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{formatSek(studentWeeklyBudgetTracker.summary.monthlyRemainingActual)}</p>
            <p className="mt-1 text-sm font-semibold text-slate-600">{studentWeeklyBudgetTracker.summary.monthlyStatus} monthly plan</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {studentWeeklyBudgetTracker.plannedRows.slice(0, 4).map((row) => (
            <Link className="rounded-2xl border border-emerald-200 bg-white p-4 hover:border-emerald-700" href={`/products/${row.slug}`} key={row.slug}>
              <p className="font-black text-slate-950">{row.name}</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">{row.qty} planned · {row.category}</p>
              <p className="mt-2 text-xl font-black text-emerald-800">{formatSek(row.plannedSpend)}</p>
            </Link>
          ))}
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-700">{studentWeeklyBudgetTracker.coverage.caveat}</p>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <TopSpreads limit={5} />
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
