'use client';

import { useMemo } from 'react';

import { useList } from '@/hooks/useList';

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', {
    currency: 'SEK',
    maximumFractionDigits: 0,
    style: 'currency'
  }).format(value);
}

export function BudgetMeter() {
  const {
    budgetRemainingSek,
    budgetTargetSek,
    budgetUsageRatio,
    estimatedTripTotalSek,
    items,
    setBudgetTargetSek,
    toggleItemChecked
  } = useList();

  const budgetState = useMemo(() => {
    if (budgetUsageRatio >= 1) {
      return {
        barClassName: 'bg-rose-600',
        label: 'Hard stop',
        message: 'This trip is over the ceiling. Remove items or raise the household budget before checkout.',
        panelClassName: 'border-rose-200 bg-rose-50 text-rose-950'
      };
    }

    if (budgetUsageRatio >= 0.85) {
      return {
        barClassName: 'bg-amber-500',
        label: 'Soft warning',
        message: 'This trip is close to the ceiling. Review swaps before adding more items.',
        panelClassName: 'border-amber-200 bg-amber-50 text-amber-950'
      };
    }

    return {
      barClassName: 'bg-emerald-500',
      label: 'On track',
      message: 'This trip is still under the household ceiling.',
      panelClassName: 'border-emerald-200 bg-emerald-50 text-emerald-950'
    };
  }, [budgetUsageRatio]);

  const progressWidth = `${Math.min(100, Math.round(budgetUsageRatio * 100))}%`;

  return (
    <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Trip budget session</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Budget ceiling with running basket impact</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
            Set a household ceiling for this shopping trip and tick items into the basket to see when the
            running estimate reaches soft and hard warning thresholds.
          </p>
        </div>
        <label className="rounded-2xl bg-slate-100 p-4 text-sm font-bold text-slate-700">
          Budget ceiling
          <input
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-lg font-black text-slate-950"
            min="0"
            onChange={(event) => setBudgetTargetSek(Math.max(0, Number(event.target.value) || 0))}
            type="number"
            value={budgetTargetSek}
          />
        </label>
      </div>

      <div className={`mt-5 rounded-2xl border p-4 ${budgetState.panelClassName}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em]">{budgetState.label}</p>
            <p className="mt-1 text-sm font-semibold">{budgetState.message}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black">{formatSek(estimatedTripTotalSek)}</p>
            <p className="text-xs font-bold">remaining {formatSek(budgetRemainingSek)}</p>
          </div>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/80">
          <div className={`h-full rounded-full ${budgetState.barClassName}`} style={{ width: progressWidth }} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4" key={item.id}>
            <input
              checked={item.checked}
              className="mt-1 h-5 w-5 rounded border-slate-300"
              onChange={() => toggleItemChecked(item.id)}
              type="checkbox"
            />
            <span className="flex-1">
              <span className="block font-black text-slate-950">{item.name}</span>
              <span className="mt-1 block text-sm font-semibold text-slate-600">
                {item.quantity} · {item.detail}
              </span>
            </span>
            <span className="font-black text-slate-950">{formatSek(item.estimatedPriceSek ?? 0)}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
