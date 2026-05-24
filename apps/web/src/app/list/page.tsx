'use client';

import { useEffect, useState } from 'react';
import { CheckableListItem } from '@/components/CheckableListItem';
import { AppNav } from '@/components/app-nav';
import { BottomNav } from '@/components/bottom-nav';
import { BulkImportDialog } from '@/components/BulkImportDialog';
import { useList } from '@/hooks/useList';
import type { MealPlanListItemInput } from '@/hooks/useList';

type MealPlanListPayload = {
  day?: unknown;
  items?: unknown;
  mealTitle?: unknown;
};

function parseMealPlanListItems(search: string): MealPlanListItemInput[] {
  const rawPayload = new URLSearchParams(search).get('mealPlan');
  if (!rawPayload) return [];

  try {
    const payload = JSON.parse(rawPayload) as MealPlanListPayload;
    if (!Array.isArray(payload.items)) return [];

    return payload.items
      .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object' && !Array.isArray(item))
      .map((item) => ({
        detail: typeof item.detail === 'string' ? item.detail : 'Imported from meal planner',
        id: typeof item.id === 'string' ? item.id : '',
        importSource: 'meal-plan' as const,
        matchedProductName: typeof item.matchedProductName === 'string' ? item.matchedProductName : undefined,
        matchedProductSlug: typeof item.matchedProductSlug === 'string' ? item.matchedProductSlug : undefined,
        name: typeof item.name === 'string' ? item.name : '',
        quantity: typeof item.quantity === 'string' ? item.quantity : '1 pack'
      }))
      .filter((item) => item.id && item.name);
  } catch {
    return [];
  }
}

export default function ShoppingListPage() {
  const { addImportedItems, checkedCount, items, remainingCount, resetCheckedState, toggleItemChecked, totalCount } = useList();
  const [mealPlanImportStatus, setMealPlanImportStatus] = useState('');
  const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  useEffect(() => {
    const mealPlanItems = parseMealPlanListItems(window.location.search);
    if (mealPlanItems.length === 0) return;

    addImportedItems(mealPlanItems);
    setMealPlanImportStatus(`Added ${mealPlanItems.length} meal plan ingredient(s) to today's basket.`);
    window.history.replaceState(null, '', window.location.pathname);
  }, [addImportedItems]);

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

        {mealPlanImportStatus ? (
          <p className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-black text-blue-950">
            {mealPlanImportStatus}
          </p>
        ) : null}

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
