'use client';

import { useMemo, useState } from 'react';
import { CheckableListItem } from '@/components/CheckableListItem';
import { AppNav } from '@/components/app-nav';
import { BottomNav } from '@/components/bottom-nav';
import { BulkImportDialog } from '@/components/BulkImportDialog';
import { useList } from '@/hooks/useList';
import { getPlannedItemId, getPlannedItemQuantity, isPlannedItemPurchased, reconcileTrip, type PurchasedQuantityDraft } from '@/lib/reconciliation';

export default function ShoppingListPage() {
  const { addImportedItems, checkedCount, items, remainingCount, resetCheckedState, toggleItemChecked, totalCount } = useList();
  const [purchasedQuantities, setPurchasedQuantities] = useState<PurchasedQuantityDraft>({});
  const reconciliation = useMemo(() => reconcileTrip(items, purchasedQuantities), [items, purchasedQuantities]);
  const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  const updatePurchasedQuantity = (itemId: string, value: string) => {
    setPurchasedQuantities((current) => ({
      ...current,
      [itemId]: Math.max(0, Number.parseFloat(value) || 0)
    }));
  };

  const fillPurchasedFromCheckMarks = () => {
    setPurchasedQuantities(Object.fromEntries(items.map((item) => {
      const itemId = getPlannedItemId(item);
      return [itemId, isPlannedItemPurchased(item) ? getPlannedItemQuantity(item) : 0];
    })));
  };

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
        <section className="mt-6 rounded-[1.75rem] border border-sky-200 bg-white/95 p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-800">End-of-trip reconciliation</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Mark what was purchased</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
                Enter purchased quantities before ending the trip to compare the receipt against the planned basket.
              </p>
            </div>
            <button
              className="inline-flex items-center justify-center rounded-full border border-sky-200 px-4 py-2 text-sm font-black text-sky-800 transition hover:border-sky-700 hover:text-sky-950"
              onClick={fillPurchasedFromCheckMarks}
              type="button"
            >
              Use check marks
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-sky-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-800">Accuracy</p>
              <p className="mt-1 text-2xl font-black text-slate-950">{reconciliation.accuracyPercent}%</p>
            </div>
            <div className="rounded-2xl bg-sky-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-800">Matched</p>
              <p className="mt-1 text-2xl font-black text-slate-950">{reconciliation.matchedItemCount}/{reconciliation.plannedItemCount}</p>
            </div>
            <div className="rounded-2xl bg-sky-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-800">Needs review</p>
              <p className="mt-1 text-2xl font-black text-slate-950">{reconciliation.missingItemCount}</p>
            </div>
            <div className="rounded-2xl bg-sky-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-800">Qty delta</p>
              <p className="mt-1 text-2xl font-black text-slate-950">{reconciliation.totalDelta}</p>
            </div>
          </div>

          <div className="mt-5 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100">
            {reconciliation.rows.map((row) => (
              <div className="grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto]" key={row.id}>
                <div>
                  <p className="font-black text-slate-950">{row.name}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">Planned quantity: {row.plannedQuantity}</p>
                </div>
                <label className="text-sm font-black text-slate-700">
                  Purchased
                  <input
                    aria-label={`Purchased quantity for ${row.name}`}
                    className="mt-1 w-28 rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-950"
                    min={0}
                    onChange={(event) => updatePurchasedQuantity(row.id, event.target.value)}
                    step={1}
                    type="number"
                    value={row.purchasedQuantity}
                  />
                </label>
                <div className="min-w-28 rounded-2xl bg-slate-50 px-4 py-3 text-sm">
                  <p className="font-black capitalize text-slate-950">{row.status}</p>
                  <p className="font-semibold text-slate-600">Delta {row.delta}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
