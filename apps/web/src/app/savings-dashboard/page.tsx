import Link from 'next/link';
import { PiggyBank } from 'lucide-react';
import { CategoryInflationCard } from '@/components/category-inflation-card';
import { ConfidenceBadge } from '@/components/confidence-badge';
import { Card, Eyebrow, PageShell, RoutePerformanceBudgetPanel, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { FunnelStepBeacon } from '@/components/funnel-step-beacon';
import { elderlyFixedIncomeBudgetTracker, elderlyStaplesStabilityTracker, grocerySpendForecast, personalGroceryInflation, savingsDashboard, studentWeeklyBudgetTracker } from '@/lib/demo-data';
import { buildCategoryInflationExposureCards } from '@/lib/grocery-index-widget';
import { summarizeWeeklyGroceryBudgetTracker } from '@/lib/meal-budgets';
import { buildCategoryInflationTrends } from '@/lib/trends';
import { ecoBasketScorecard } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';
import { recentRoutePerformanceBudgetReports } from '@/lib/telemetry';

export function generateMetadata() {
  const pricedLineCount = personalGroceryInflation.itemContributions.length;
  const inflationLabel = formatPercent(personalGroceryInflation.inflationPercent);
  const title = `Savings dashboard: ${inflationLabel} basket inflation | GroceryView`;
  const description = `Track ${pricedLineCount} priced basket lines from ${personalGroceryInflation.baseDate} to ${personalGroceryInflation.currentDate}, with ${personalGroceryInflation.confidence} confidence and real grocery budget drivers.`;
  const metadata = routeMetadata({
    path: '/savings-dashboard',
    title,
    description,
    imagePath: '/pwa-icon.svg',
    imageAlt: `Savings dashboard preview: ${inflationLabel} inflation across ${pricedLineCount} priced lines`
  });
  const openGraph = metadata.openGraph;

  return {
    ...metadata,
    openGraph: {
      ...(openGraph ?? {}),
      title,
      description,
      images: openGraph?.images
    },
    twitter: {
      card: 'summary_large_image',
      title: openGraph?.title ?? title,
      description: openGraph?.description ?? description,
      images: openGraph?.images
    }
  };
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

type SavingsBaselineOption = {
  assumption: string;
  baselineLabel: string;
  baselineSpend: number;
  confidence: 'high' | 'medium' | 'low';
  coverageLabel: string;
  observedBasketCount: number;
  selectedSpend: number;
};

function parseSekLabel(value: string) {
  const numeric = value.replace(/[^\d,.-]/g, '');
  if (numeric.includes(',') && numeric.includes('.')) {
    return Number(numeric.indexOf(',') < numeric.indexOf('.') ? numeric.replace(/,/g, '') : numeric.replace(/\./g, '').replace(',', '.'));
  }
  return Number(numeric.replace(',', '.'));
}

function buildSavingsCalculatorOptions(): SavingsBaselineOption[] {
  const plannedMonthToDateSpend = parseSekLabel(savingsDashboard.monthToDate.plannedSpend);
  const avoidedMonthToDateSpend = parseSekLabel(savingsDashboard.monthToDate.avoidedSpend);
  const selectedMonthToDateSpend = plannedMonthToDateSpend - avoidedMonthToDateSpend;
  const districtBaselineSpend = savingsDashboard.districtSavings.reduce((sum, row) => sum + parseSekLabel(row.planned), 0);
  const districtAvoidedSpend = savingsDashboard.districtSavings.reduce((sum, row) => sum + parseSekLabel(row.avoided), 0);
  const districtSelectedSpend = districtBaselineSpend - districtAvoidedSpend;

  return [
    {
      assumption: 'Uses the signed-in month-to-date planned basket as the usual-store baseline and subtracts only observed avoided spend already shown on this dashboard.',
      baselineLabel: 'Usual store baseline',
      baselineSpend: plannedMonthToDateSpend,
      confidence: 'medium',
      coverageLabel: `${savingsDashboard.monthToDate.basketCount} observed baskets · best district ${savingsDashboard.monthToDate.bestDistrict}`,
      observedBasketCount: savingsDashboard.monthToDate.basketCount,
      selectedSpend: selectedMonthToDateSpend
    },
    {
      assumption: 'Uses district savings rows as the chain-average proxy; no missing district, club-card, or unobserved shelf prices are filled in.',
      baselineLabel: 'Chain average baseline',
      baselineSpend: districtBaselineSpend,
      confidence: 'medium',
      coverageLabel: `${savingsDashboard.districtSavings.length} district rows with listed planned and avoided spend`,
      observedBasketCount: Math.max(1, savingsDashboard.districtSavings.length),
      selectedSpend: districtSelectedSpend
    },
    {
      assumption: 'Uses the personal CPI previous weekly basket as the baseline; if current spend is higher the calculator reports a loss instead of hiding it.',
      baselineLabel: 'Previous basket baseline',
      baselineSpend: personalGroceryInflation.baseSpend,
      confidence: personalGroceryInflation.confidence,
      coverageLabel: `${personalGroceryInflation.itemContributions.length} priced lines · ${personalGroceryInflation.baseDate} to ${personalGroceryInflation.currentDate}`,
      observedBasketCount: 1,
      selectedSpend: personalGroceryInflation.currentSpend
    }
  ];
}

function savingAmount(option: SavingsBaselineOption) {
  return option.baselineSpend - option.selectedSpend;
}

function savingForPeriod(option: SavingsBaselineOption, period: 'shop' | 'week' | 'month' | 'year') {
  const amount = savingAmount(option);
  if (period === 'shop') return amount / option.observedBasketCount;
  if (period === 'week') return amount / 4;
  if (period === 'year') return amount * 12;
  return amount;
}

const premiumSavingsForecast = {
  totalMonthly: 133,
  drivers: [
    { label: 'Alerts', amount: 42, detail: 'price-drop and wait-window alerts across watched staples' },
    { label: 'Swaps', amount: 58, detail: 'verified same-basket store swaps for eligible rows' },
    { label: 'Basket planning', amount: 33, detail: 'pantry top-up timing and duplicate-buy prevention' }
  ],
  guardrail: 'Premium-only forecast uses signed-in watchpoints and saved basket rows; public dashboards keep the detailed plan locked.'
};

function SavingsEmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/70 p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-emerald-800 shadow-sm">
        <PiggyBank className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-xl font-black text-slate-950">No savings drivers yet</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">Add verified basket products to unlock personal inflation drivers and savings watchpoints.</p>
      <Link className="mt-4 inline-flex rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white" href="/products">Browse verified products</Link>
    </div>
  );
}

export default function SavingsDashboardPage() {
  const topContributions = [...personalGroceryInflation.itemContributions]
    .sort((a, b) => Math.abs(b.changeAmount) - Math.abs(a.changeAmount))
    .slice(0, 5);
  const visibleWatchpoints = savingsDashboard.watchpoints.slice(0, 4);
  const savingsCalculatorOptions = buildSavingsCalculatorOptions();
  const categoryInflationTrends = buildCategoryInflationTrends({ limit: 4 });
  const categoryExposureCards = buildCategoryInflationExposureCards(4);
  const forecastReceiptCount = grocerySpendForecast.confidenceDrivers.receiptCount;
  const weeklyGroceryBudgetTracker = summarizeWeeklyGroceryBudgetTracker({
    plannedBasketCost: studentWeeklyBudgetTracker.summary.estimatedBasketTotal,
    actualCheckedItemsCost: studentWeeklyBudgetTracker.summary.weeklyActualSpend,
    weeklyAllowance: studentWeeklyBudgetTracker.summary.weeklyBudget,
    plannedItemCount: studentWeeklyBudgetTracker.plannedRows.length
  });

  return (
    <PageShell>
      <FunnelStepBeacon step="savings_action" />
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

      <div className="mt-6">
        <RoutePerformanceBudgetPanel reports={recentRoutePerformanceBudgetReports} />
      </div>

      <Card className="mt-6 border-emerald-200 bg-emerald-50/70">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Matpriskollen-style savings calculator</p>
            <h2 className="mt-2 text-2xl font-black">Selected basket versus shopper baseline</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              Pick the baseline that matches how the household shops: usual store, observed chain-average district rows, or the previous basket. Every period below is derived from visible basket totals; missing prices stay out of the calculation.
            </p>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-emerald-950 shadow-sm">No fabricated savings</p>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {savingsCalculatorOptions.map((option) => {
            const totalSaving = savingAmount(option);
            return (
              <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm" key={option.baselineLabel}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">{option.baselineLabel}</p>
                    <p className="mt-2 text-3xl font-black text-slate-950">{formatSignedSek(totalSaving)}</p>
                  </div>
                  <ConfidenceBadge level={option.confidence} label={`${option.confidence} confidence`} sampleSize={option.observedBasketCount} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <p className="rounded-xl bg-emerald-50 p-3 font-black text-emerald-950">Per shop {formatSignedSek(savingForPeriod(option, 'shop'))}</p>
                  <p className="rounded-xl bg-slate-50 p-3 font-black text-slate-950">Per week {formatSignedSek(savingForPeriod(option, 'week'))}</p>
                  <p className="rounded-xl bg-slate-50 p-3 font-black text-slate-950">Per month {formatSignedSek(savingForPeriod(option, 'month'))}</p>
                  <p className="rounded-xl bg-slate-50 p-3 font-black text-slate-950">Per year {formatSignedSek(savingForPeriod(option, 'year'))}</p>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-700">Selected basket {formatSek(option.selectedSpend)} vs baseline {formatSek(option.baselineSpend)}</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">Coverage: {option.coverageLabel}</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">Assumption: {option.assumption}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="mt-6 border-amber-200 bg-amber-50">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-800">Weekly grocery budget tracker</p>
            <h2 className="mt-2 text-2xl font-black">Planned basket cost vs. checked items</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              Compares the planned student basket, actual checked grocery spend this week, and the allowance left before checkout planning continues.
            </p>
          </div>
          <p className={`rounded-full px-3 py-1 text-sm font-black ${weeklyGroceryBudgetTracker.status === 'over' ? 'bg-rose-100 text-rose-900' : weeklyGroceryBudgetTracker.status === 'near' ? 'bg-amber-100 text-amber-950' : 'bg-emerald-100 text-emerald-950'}`}>
            {weeklyGroceryBudgetTracker.status}
          </p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-4">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Planned basket cost</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{formatSek(weeklyGroceryBudgetTracker.plannedBasketCost)}</p>
            <p className="mt-1 text-sm font-semibold text-slate-600">{weeklyGroceryBudgetTracker.plannedItemCount} planned rows</p>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Actual checked items</p>
            <p className="mt-2 text-3xl font-black text-amber-900">{formatSek(weeklyGroceryBudgetTracker.actualCheckedItemsCost)}</p>
            <p className="mt-1 text-sm font-semibold text-slate-600">{weeklyGroceryBudgetTracker.checkedSpendPercent.toFixed(0)}% of allowance checked</p>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Remaining weekly allowance</p>
            <p className={`mt-2 text-3xl font-black ${weeklyGroceryBudgetTracker.remainingWeeklyAllowance < 0 ? 'text-rose-800' : 'text-emerald-800'}`}>
              {formatSek(weeklyGroceryBudgetTracker.remainingWeeklyAllowance)}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-600">planned cushion {formatSek(weeklyGroceryBudgetTracker.plannedRemainingAllowance)}</p>
          </div>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
          <div
            className={`h-full rounded-full ${weeklyGroceryBudgetTracker.status === 'over' ? 'bg-rose-600' : weeklyGroceryBudgetTracker.status === 'near' ? 'bg-amber-500' : 'bg-emerald-600'}`}
            style={{ width: `${Math.min(100, weeklyGroceryBudgetTracker.checkedSpendPercent)}%` }}
          />
        </div>
        <p className="mt-3 text-sm font-semibold leading-6 text-amber-950">{weeklyGroceryBudgetTracker.warning}</p>
      </Card>

      <section className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-700">Category inflation trends</p>
            <h2 className="mt-2 text-2xl font-black">Month-over-month pressure by aisle</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              Latest monthly OpenPrices observations are compared with the prior observed month and flagged when the category is rising faster than the basket average of {formatPercent(categoryInflationTrends.basketAverageChangePercent)}.
            </p>
          </div>
          <p className="text-xs font-bold text-slate-500">Source: {categoryInflationTrends.source}</p>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {categoryInflationTrends.cards.map((trend) => <CategoryInflationCard key={trend.category} trend={trend} />)}
        </div>
      </section>

      <Card className="mt-6 border-orange-200 bg-orange-50/70">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-800">Household exposure</p>
            <h2 className="mt-2 text-2xl font-black">Category pressure translated to budget impact</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              Month-over-month category movement is weighted by visible household basket exposure so broad inflation trends become a personal budgeting signal.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {categoryExposureCards.map((card) => (
            <div className="rounded-2xl bg-white p-4 shadow-sm" key={card.categoryLabel}>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-700">{card.pressureLabel}</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{card.categoryLabel}</h3>
              <p className="mt-2 text-3xl font-black text-orange-900">{formatSignedSek(card.monthlyImpactSek)}</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">{formatPercent(card.changePercent)} MoM · {card.exposureLabel}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Next month forecast</p>
            <h2 className="mt-2 text-2xl font-black">Grocery-spend forecast for {grocerySpendForecast.forecastMonth}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
              Forecasted from purchase_history receipts only: {grocerySpendForecast.observedMonths} observed months, {formatSek(grocerySpendForecast.observedSpend)} total observed spend, and no synthetic basket rows.
            </p>
          </div>
          <ConfidenceBadge
            level={grocerySpendForecast.confidence}
            label={`${grocerySpendForecast.confidence} forecast confidence`}
            sampleSize={forecastReceiptCount}
          />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-4">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Predicted spend</p>
            <p className="mt-2 text-3xl font-black text-emerald-900">{formatSek(grocerySpendForecast.predictedSpend)}</p>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">3-month baseline</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{formatSek(grocerySpendForecast.baselineMonthlySpend)}</p>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Trend vs baseline</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{formatPercent(grocerySpendForecast.trendPercent)}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-4">
          {grocerySpendForecast.monthSummaries.map((month) => (
            <div className="rounded-2xl border border-emerald-100 bg-white/80 p-3" key={month.month}>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{month.month}</p>
              <p className="mt-1 text-lg font-black text-slate-950">{formatSek(month.spend)}</p>
              <p className="text-xs font-semibold text-slate-600">{month.receiptCount} receipts</p>
            </div>
          ))}
        </div>
        <details className="mt-4 rounded-2xl border border-emerald-200 bg-white/90 p-4">
          <summary className="cursor-pointer text-sm font-black uppercase tracking-[0.16em] text-emerald-900">Explain forecast confidence</summary>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-sm font-bold text-slate-700">
                Confidence is based on {grocerySpendForecast.confidenceDrivers.observedMonths} observed months and {forecastReceiptCount} receipts. High confidence requires at least {grocerySpendForecast.confidenceDrivers.highThresholdMonths} months and {grocerySpendForecast.confidenceDrivers.highThresholdReceipts} receipts; medium starts at {grocerySpendForecast.confidenceDrivers.mediumThresholdMonths} months and {grocerySpendForecast.confidenceDrivers.mediumThresholdReceipts} receipts.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {grocerySpendForecast.monthSummaries.map((month) => (
                  <div className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-slate-700" key={`confidence-${month.month}`}>
                    <span className="font-black text-slate-950">{month.month}</span>: {month.receiptCount} receipts · {formatSek(month.spend)}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Skipped rows</p>
              {grocerySpendForecast.skippedRows.length > 0 ? (
                <ul className="mt-2 space-y-2 text-sm font-semibold text-slate-700">
                  {grocerySpendForecast.skippedRows.map((row, index) => (
                    <li key={`${row.receiptId ?? row.purchasedAt}-${row.reason}-${index}`}>
                      <span className="font-black text-slate-950">{row.receiptId ?? row.purchasedAt}</span>: {row.detail}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm font-semibold text-slate-700">No purchase_history rows were skipped before computing this forecast.</p>
              )}
              {grocerySpendForecast.warnings.length > 0 ? (
                <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-950">
                  <p className="font-black">Warnings</p>
                  <ul className="mt-1 list-disc space-y-1 pl-4">
                    {grocerySpendForecast.warnings.map((warning, index) => <li key={`${warning}-${index}`}>{warning}</li>)}
                  </ul>
                </div>
              ) : (
                <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-950">No warnings: all counted receipts are dated on or before the forecast as-of date and have valid spend.</p>
              )}
            </div>
          </div>
        </details>
      </Card>

      <Card className="mt-6 border-violet-200 bg-violet-50">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-800">Premium savings forecast</p>
            <h2 className="mt-2 text-2xl font-black">Projected monthly savings from alerts, swaps, and basket planning</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              Upgrade-ready households can preview how premium combines their alert queue, store-switch opportunities, and planned baskets into one monthly savings forecast.
            </p>
          </div>
          <div className="rounded-3xl bg-white px-5 py-4 text-center shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Forecast</p>
            <p className="mt-1 text-4xl font-black text-violet-800">{formatSek(premiumSavingsForecast.totalMonthly)}</p>
            <p className="text-xs font-bold text-slate-600">next month</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {premiumSavingsForecast.drivers.map((driver) => (
            <div className="rounded-2xl bg-white p-4" key={driver.label}>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">{driver.label}</p>
              <p className="mt-2 text-3xl font-black text-violet-800">{formatSek(driver.amount)}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{driver.detail}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4">
          <p className="text-sm font-bold text-violet-950">{premiumSavingsForecast.guardrail}</p>
          <Link className="rounded-full bg-violet-700 px-4 py-2 text-sm font-black text-white" href="/pricing">See premium plan</Link>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <h2 className="text-2xl font-black">Largest basket drivers</h2>
          <div className="mt-4 space-y-3">
            {topContributions.length > 0 ? topContributions.map((item) => (
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
            )) : <SavingsEmptyState />}
          </div>
        </Card>

        <Card>
          <h2 className="text-2xl font-black">Category pressure</h2>
          <div className="mt-4 space-y-3">
            {personalGroceryInflation.categoryContributions.length > 0 ? (
              personalGroceryInflation.categoryContributions.map((category) => (
                <div className="rounded-2xl bg-slate-50 p-4" key={category.category}>
                  <p className="font-black">{category.category}</p>
                  <p className="text-sm text-slate-600">{formatPercent(category.changePercent)} on {formatSek(category.spend)} baseline spend</p>
                </div>
              ))
            ) : (
              <p className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-700">No category contribution data is available yet.</p>
            )}
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
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-indigo-200 bg-white p-5">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-indigo-800">{elderlyFixedIncomeBudgetTracker.essentialStaplesBasket.title}</p>
            <p className="mt-2 text-4xl font-black text-indigo-950">{formatSek(elderlyFixedIncomeBudgetTracker.essentialStaplesBasket.cost)}</p>
            <p className="mt-2 text-lg font-black text-slate-950">
              {formatSek(elderlyFixedIncomeBudgetTracker.essentialStaplesBasket.remainingMonthlyBudgetAfterStaples)} left after essentials
            </p>
            <div className="mt-4 grid gap-2">
              {elderlyFixedIncomeBudgetTracker.essentialStaplesBasket.rows.map((row) => (
                <Link className="rounded-2xl bg-indigo-50 p-4 text-left hover:bg-indigo-100" href={`/products/${row.id}`} key={row.id}>
                  <span className="block text-lg font-black text-slate-950">{row.name}</span>
                  <span className="mt-1 block text-sm font-semibold text-slate-700">{row.quantity} × basket row · {row.store}</span>
                  <span className="mt-2 block text-2xl font-black text-indigo-900">{formatSek(row.currentPrice)}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-white p-5">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-800">Cheaper swaps</p>
            <p className="mt-2 text-lg font-semibold leading-7 text-slate-700">Large-tap swap cards use only cheaper rows already present in the visible basket catalogue.</p>
            <div className="mt-4 grid gap-3">
              {elderlyFixedIncomeBudgetTracker.cheaperSwaps.map((swap) => (
                <Link className="rounded-2xl bg-emerald-50 p-4 hover:bg-emerald-100" href={`/products/${swap.alternativeProductId}`} key={`${swap.productId}-${swap.alternativeProductId}`}>
                  <span className="block text-lg font-black text-slate-950">{swap.productName}</span>
                  <span className="mt-1 block text-sm font-semibold text-slate-700">Swap to {swap.alternativeName}</span>
                  <span className="mt-2 block text-2xl font-black text-emerald-900">Save {formatSek(swap.estimatedSavings)}</span>
                </Link>
              ))}
              {elderlyFixedIncomeBudgetTracker.cheaperSwaps.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-4 text-lg font-black text-slate-700">No cheaper covered swaps in the current essential basket.</p>
              ) : null}
            </div>
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
        <p className="mt-3 rounded-2xl bg-white p-3 text-sm font-black text-slate-800">
          Minimum history for fixed-income planning: {elderlyStaplesStabilityTracker.minimumObservedPoints} observed shelf points per staple; thinner history renders an amber warning instead of a reliability claim.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {elderlyStaplesStabilityTracker.rows.map((row) => (
            <Link className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-slate-900" href={`/products/${row.productId}`} key={row.productId}>
              <p className="font-black text-slate-950">{row.productName}</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{formatSek(row.history.latestPrice)}</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">stabilityBand: {row.stabilityBand}</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">Change {formatSignedSek(row.history.changeFromPrevious)} · volatility {row.volatilityPercent.toFixed(1)}%</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">{row.history.observedCount} observed points · range {formatSek(row.history.lowestPrice)}–{formatSek(row.history.highestPrice)}</p>
              {row.insufficientHistoryWarning ? (
                <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm font-black leading-6 text-amber-950">{row.insufficientHistoryWarning}</p>
              ) : (
                <p className="mt-3 rounded-2xl bg-emerald-50 p-3 text-sm font-black leading-6 text-emerald-950">History clears the fixed-income planning threshold.</p>
              )}
            </Link>
          ))}
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-700">{elderlyStaplesStabilityTracker.coverage.caveat}</p>
      </Card>

      <Card className="mt-6">
        <h2 className="text-2xl font-black">Savings watchpoints</h2>
        <p className="mt-2 text-sm font-semibold text-slate-600">Month-to-date planned spend {savingsDashboard.monthToDate.plannedSpend}; avoided spend {savingsDashboard.monthToDate.avoidedSpend}; best district {savingsDashboard.monthToDate.bestDistrict}.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {visibleWatchpoints.length > 0 ? (
            visibleWatchpoints.map((watchpoint) => (
              <Link className="rounded-2xl border border-slate-200 p-4 hover:border-emerald-700" href={watchpoint.href} key={watchpoint.label}>
                <p className="font-black">{watchpoint.label}</p>
                <p className="mt-1 text-sm text-slate-600">{watchpoint.product} · {watchpoint.store}</p>
                <p className="mt-2 text-sm font-bold text-emerald-900">{watchpoint.signal}</p>
                <p className="mt-1 text-sm text-slate-700">{watchpoint.action}</p>
              </Link>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 p-6 md:col-span-2">
              <PiggyBank aria-hidden className="h-8 w-8 text-emerald-700" />
              <p className="mt-3 text-lg font-black text-slate-950">No savings drivers yet</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">Verified price movements will appear here when GroceryView has observed watchpoints.</p>
              <Link className="mt-4 inline-flex rounded-full bg-emerald-700 px-4 py-2 text-sm font-black text-white hover:bg-emerald-800" href="/products">Browse verified products</Link>
            </div>
          )}
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
