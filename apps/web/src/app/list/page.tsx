'use client';

import { CheckableListItem } from '@/components/CheckableListItem';
import { AppNav } from '@/components/app-nav';
import { BottomNav } from '@/components/bottom-nav';
import { BulkImportDialog } from '@/components/BulkImportDialog';
import { useList } from '@/hooks/useList';

const sekFormatter = new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 });

export default function ShoppingListPage() {
  const { addImportedItems, budgetAlerts, budgetBuckets, checkedCount, estimatedTotal, items, remainingCount, resetCheckedState, toggleItemChecked, totalCount } = useList();
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

        <section className="mt-6 rounded-[1.75rem] border border-amber-200 bg-white/95 p-5 shadow-sm" aria-labelledby="list-budget-heading">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-800">List budget buckets</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950" id="list-budget-heading">Category budget before checkout</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                Category-specific budgets update while you edit the list, using matched catalog estimates for imported rows and starter-item estimates for the default basket.
              </p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4 text-right">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">Estimated list total</p>
              <p className="mt-1 text-3xl font-black text-slate-950">{sekFormatter.format(estimatedTotal)}</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">{budgetAlerts.length} overspend alert(s)</p>
            </div>
          </div>
          <div aria-live="polite" className={budgetAlerts.length > 0 ? 'mt-4 rounded-2xl bg-rose-50 p-3 text-sm font-black text-rose-900' : 'mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-black text-emerald-900'} role="status">
            {budgetAlerts.length > 0
              ? `Overspend warning: ${budgetAlerts.map((bucket) => `${bucket.category} ${sekFormatter.format(Math.abs(bucket.remaining))} over`).join(', ')}.`
              : 'All category buckets are within budget.'}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {budgetBuckets.map((bucket) => (
              <div className={bucket.status === 'over' ? 'rounded-2xl border border-rose-200 bg-rose-50 p-4' : 'rounded-2xl border border-slate-200 bg-slate-50 p-4'} key={bucket.category}>
                <p className="text-sm font-black capitalize text-slate-950">{bucket.category}</p>
                <p className={bucket.status === 'over' ? 'mt-2 text-2xl font-black text-rose-800' : 'mt-2 text-2xl font-black text-emerald-800'}>{sekFormatter.format(bucket.spent)}</p>
                <p className="mt-1 text-sm font-semibold text-slate-600">Budget {sekFormatter.format(bucket.budget)} · {bucket.itemCount} item(s)</p>
                <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">{bucket.status === 'over' ? `${sekFormatter.format(Math.abs(bucket.remaining))} over` : `${sekFormatter.format(bucket.remaining)} left`}</p>
              </div>
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
