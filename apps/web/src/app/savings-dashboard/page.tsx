import Link from 'next/link';
import { Card, Eyebrow, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { personalGroceryInflation, savingsDashboard, studentWeeklyBudgetTracker } from '@/lib/demo-data';

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value);
}

function formatSignedSek(value: number) {
  const formatted = formatSek(Math.abs(value));
  return `${value >= 0 ? '+' : '-'}${formatted}`;
}

function formatPercent(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

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
          <p className="mt-3 font-semibold text-slate-700">priced basket lines · confidence: {personalGroceryInflation.confidence}</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <h2 className="text-2xl font-black">Largest basket drivers</h2>
          <div className="mt-4 space-y-3">
            {topContributions.map((item) => (
              <div className="rounded-2xl border border-slate-200 p-4" key={item.productId}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link className="text-lg font-black text-slate-950 hover:text-emerald-800" href={`/products/${item.productId}`}>{item.productName}</Link>
                    <p className="text-sm text-slate-600">{item.category} · basket weight {(item.weight * 100).toFixed(0)}% · {item.confidence} confidence</p>
                  </div>
                  <p className="rounded-full bg-amber-50 px-3 py-1 font-black text-amber-950">{formatPercent(item.changePercent)}</p>
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
