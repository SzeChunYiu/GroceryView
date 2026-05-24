'use client';

import { SOFT_BUDGET_THRESHOLD, useList } from '@/hooks/useList';

const sekFormatter = new Intl.NumberFormat('sv-SE', {
  currency: 'SEK',
  maximumFractionDigits: 0,
  style: 'currency'
});

function formatSek(value: number) {
  return sekFormatter.format(value);
}

export function BudgetMeter() {
  const {
    budgetCeilingSek,
    budgetRemainingSek,
    budgetUsageRatio,
    budgetWarningLevel,
    checkedCount,
    items,
    projectedTripTotalSek,
    resetCheckedState,
    runningTripTotalSek,
    setBudgetCeilingSek,
    toggleItemChecked,
    totalCount
  } = useList();
  const progressWidth = `${Math.min(100, Math.round(budgetUsageRatio * 100))}%`;
  const softThresholdSek = budgetCeilingSek * SOFT_BUDGET_THRESHOLD;

  return (
    <section className="rounded-3xl border border-amber-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">Trip budget meter</p>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{formatSek(runningTripTotalSek)} running total</h3>
          <p className="mt-2 text-sm font-semibold text-slate-700">
            {checkedCount} of {totalCount} trip items in basket · {formatSek(projectedTripTotalSek)} projected if everything is bought.
          </p>
        </div>
        <label className="text-sm font-black text-slate-800">
          Budget ceiling
          <input
            className="mt-2 block w-40 rounded-2xl border border-amber-200 px-3 py-2 text-base font-black text-slate-950"
            min={1}
            onChange={(event) => setBudgetCeilingSek(Number(event.target.value))}
            step={10}
            type="number"
            value={budgetCeilingSek}
          />
        </label>
      </div>

      <div className="mt-5 h-4 overflow-hidden rounded-full bg-amber-100" aria-label="Budget usage">
        <div className="h-full rounded-full bg-amber-500" style={{ width: progressWidth }} />
      </div>
      <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-600">
        <span>Soft warning at {formatSek(softThresholdSek)}</span>
        <span>Hard ceiling {formatSek(budgetCeilingSek)}</span>
      </div>

      <p className={`mt-4 rounded-2xl px-4 py-3 text-sm font-black ${budgetWarningLevel === 'hard' ? 'bg-rose-100 text-rose-900' : budgetWarningLevel === 'soft' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'}`}>
        {budgetWarningLevel === 'hard'
          ? `Hard warning: this trip is ${formatSek(Math.abs(budgetRemainingSek))} over budget.`
          : budgetWarningLevel === 'soft'
            ? `Soft warning: only ${formatSek(budgetRemainingSek)} remains before the ceiling.`
            : `${formatSek(budgetRemainingSek)} remains before the budget ceiling.`}
      </p>

      <div className="mt-5 divide-y divide-amber-100 overflow-hidden rounded-2xl border border-amber-100">
        {items.map((item) => (
          <label className="flex items-center justify-between gap-3 bg-amber-50/40 px-4 py-3 text-sm" key={item.id}>
            <span className="flex items-center gap-3">
              <input
                checked={item.checked}
                className="h-5 w-5 rounded border-amber-300 text-amber-700"
                onChange={() => toggleItemChecked(item.id)}
                type="checkbox"
              />
              <span>
                <span className="block font-black text-slate-950">{item.name}</span>
                <span className="block text-xs font-semibold text-slate-600">{item.quantity} · {item.detail}</span>
              </span>
            </span>
            <span className="font-black text-slate-950">{formatSek(item.estimatedTripCostSek ?? 0)}</span>
          </label>
        ))}
      </div>
      <button className="mt-4 rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" onClick={resetCheckedState} type="button">
        Reset trip session
      </button>
    </section>
  );
}
