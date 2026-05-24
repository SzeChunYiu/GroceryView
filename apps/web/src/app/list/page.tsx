'use client';

import { CheckableListItem } from '@/components/CheckableListItem';
import { AppNav } from '@/components/app-nav';
import { BottomNav } from '@/components/bottom-nav';
import { BulkImportDialog } from '@/components/BulkImportDialog';
import { shoppingRouteModes, type ShoppingRouteMode, useList } from '@/hooks/useList';

export default function ShoppingListPage() {
  const { addImportedItems, checkedCount, items, remainingCount, resetCheckedState, routeMode, setRouteMode, toggleItemChecked, totalCount, tripEstimate } = useList();
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

        <section className="mt-6 rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-800">Time-to-complete estimator</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                {tripEstimate.estimatedMinutes > 0 ? `${tripEstimate.estimatedMinutes} min left` : 'Trip complete'}
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                Estimated from {tripEstimate.activeItemCount} active item{tripEstimate.activeItemCount === 1 ? '' : 's'} across {tripEstimate.aisleCount} aisle{tripEstimate.aisleCount === 1 ? '' : 's'} using the selected route mode.
              </p>
            </div>
            <label className="text-sm font-black text-slate-700">
              Route mode
              <select
                className="mt-2 block w-full rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-black text-slate-900"
                onChange={(event) => setRouteMode(event.target.value as ShoppingRouteMode)}
                value={routeMode}
              >
                {shoppingRouteModes.map((mode) => (
                  <option key={mode.value} value={mode.value}>{mode.label}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_2fr]">
            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">Aisle count</p>
              <p className="mt-1 text-3xl font-black text-slate-950">{tripEstimate.aisleCount}</p>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">Aisle traversal</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">
                {tripEstimate.aisleTraversal.length > 0 ? tripEstimate.aisleTraversal.join(' → ') : 'No active aisles remaining'}
              </p>
            </div>
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
