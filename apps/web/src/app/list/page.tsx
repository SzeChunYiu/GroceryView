'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckableListItem } from '@/components/CheckableListItem';
import { AppNav } from '@/components/app-nav';
import { BottomNav } from '@/components/bottom-nav';
import { BulkImportDialog } from '@/components/BulkImportDialog';
import { useList } from '@/hooks/useList';
import { MEAL_LIST_SYNC_EVENT, getMealListDeltas, readMealListSyncSelection } from '@/lib/meal-list-sync';

export default function ShoppingListPage() {
  const { addImportedItems, checkedCount, items, remainingCount, resetCheckedState, toggleItemChecked, totalCount } = useList();
  const [selectedMealPlanIds, setSelectedMealPlanIds] = useState<string[]>([]);
  const lastAutoImportSignature = useRef('');
  const mealPlanDeltas = useMemo(() => getMealListDeltas(selectedMealPlanIds), [selectedMealPlanIds]);
  const mealPlanDeltaNames = useMemo(() => mealPlanDeltas.map((delta) => delta.name), [mealPlanDeltas]);
  const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  useEffect(() => {
    const refreshSelection = () => setSelectedMealPlanIds(readMealListSyncSelection());

    refreshSelection();
    window.addEventListener(MEAL_LIST_SYNC_EVENT, refreshSelection);
    window.addEventListener('storage', refreshSelection);

    return () => {
      window.removeEventListener(MEAL_LIST_SYNC_EVENT, refreshSelection);
      window.removeEventListener('storage', refreshSelection);
    };
  }, []);

  useEffect(() => {
    const signature = mealPlanDeltaNames.join('\n');

    if (signature === lastAutoImportSignature.current) {
      return;
    }

    lastAutoImportSignature.current = signature;

    if (mealPlanDeltaNames.length > 0) {
      addImportedItems(mealPlanDeltaNames);
    }
  }, [addImportedItems, mealPlanDeltaNames]);

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

        <section className="mt-6 rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">Meal plan auto-sync</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
                Checked meal plans generate shopping-list deltas automatically. Uncheck a meal plan on the planner to remove its ingredients from this sync set.
              </p>
            </div>
            <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-emerald-800">{mealPlanDeltas.length} synced</p>
          </div>

          {mealPlanDeltas.length > 0 ? (
            <ul className="mt-4 grid gap-3 md:grid-cols-2">
              {mealPlanDeltas.map((delta) => (
                <li className="rounded-2xl border border-emerald-200 bg-white p-4" key={delta.id}>
                  <p className="font-black text-slate-950">{delta.name}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{delta.mealTitles.join(', ')}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-2xl border border-dashed border-emerald-300 bg-white/70 p-4 text-sm font-semibold text-slate-700">
              No meal plans selected yet. Use the checkboxes on the meal planner to start syncing ingredients.
            </p>
          )}
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
