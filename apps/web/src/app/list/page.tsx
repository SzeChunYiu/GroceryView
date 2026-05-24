'use client';

import { CheckableListItem } from '@/components/CheckableListItem';
import { AppNav } from '@/components/app-nav';
import { BottomNav } from '@/components/bottom-nav';
import { BulkImportDialog } from '@/components/BulkImportDialog';
import { useList } from '@/hooks/useList';

function formatBudgetSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0, style: 'currency', currency: 'SEK' }).format(value);
}

export default function ShoppingListPage() {
  const { addImportedItems, budgetHistoryTrends, checkedCount, items, remainingCount, resetCheckedState, toggleItemChecked, totalCount } = useList();
  const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-slate-950">
      <AppNav />
      <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-800">Local shopping trip</p>
        <div className="mt-2 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-950">Shopping list</h1>
            <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
              Check items off while you shop. Checked state is saved in this browser with localStorage, so the same list stays crossed off after a refresh.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-emerald-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-800">Trip progress</p>
            <p className="mt-1 text-3xl font-black text-slate-950">{checkedCount}/{totalCount}</p>
            <p className="text-sm font-semibold text-slate-600">{remainingCount} left to collect</p>
          </div>
        </div>

        <BulkImportDialog onImportItems={addImportedItems} />

        <section className="mt-6 rounded-[1.75rem] border border-emerald-200 bg-white/95 p-5 shadow-sm" aria-labelledby="budget-history-heading">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">Budget history</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950" id="budget-history-heading">Category trend chart</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">Recent budgetHistory snapshots show which categories are rising, with red markers when spend is over budget.</p>
            </div>
            <p className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-emerald-900">Last 3 trips</p>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {budgetHistoryTrends.map((trend) => (
              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={trend.category}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-950">{trend.category}</h3>
                    <p className="text-sm font-semibold text-slate-600">Latest {formatBudgetSek(trend.latestSpendSek)}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-black ${trend.isRising ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'}`}>
                    {trend.isRising ? 'Rising' : 'Steady'}
                  </span>
                </div>

                <div className="mt-4 flex h-28 items-end gap-3" aria-label={`${trend.category} budget trend`}>
                  {trend.points.map((point) => (
                    <div className="flex flex-1 flex-col items-center gap-2" key={point.label}>
                      <div className="flex h-20 w-full items-end rounded-xl bg-white px-2 pb-2">
                        <div
                          className={`relative w-full rounded-t-lg ${point.overspent ? 'bg-rose-500' : 'bg-emerald-700'}`}
                          style={{ height: `${Math.max(point.percentOfBudget, 8)}%` }}
                          title={`${point.label}: ${formatBudgetSek(point.spentSek)} of ${formatBudgetSek(point.budgetSek)}`}
                        >
                          {point.overspent ? <span className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-white bg-rose-600" aria-label="Overspend marker" /> : null}
                        </div>
                      </div>
                      <span className="text-center text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-500">{point.label}</span>
                    </div>
                  ))}
                </div>

                <p className="mt-3 text-xs font-bold text-slate-600">{trend.overspendCount} overspend marker{trend.overspendCount === 1 ? '' : 's'} in recent history.</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[1.75rem] border border-emerald-200 bg-white/95 p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">Today&apos;s basket</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
                Tap the checkbox once an item is in your basket. Completed rows are struck through immediately and restored from localStorage on reload.
              </p>
            </div>
            <button
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:border-emerald-700 hover:text-emerald-900"
              onClick={resetCheckedState}
              type="button"
            >
              Clear check marks
            </button>
          </div>

          <div
            aria-label={`${progress}% complete`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={progress}
            className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
          >
            <div className="h-full rounded-full bg-emerald-700 transition-all" style={{ width: `${progress}%` }} />
          </div>

          <ul className="mt-5 space-y-3">
            {items.map((item) => (
              <CheckableListItem item={item} key={item.id} onToggle={toggleItemChecked} />
            ))}
          </ul>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
