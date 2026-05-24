'use client';

import { useMemo, useState } from 'react';
import { CheckableListItem } from '@/components/CheckableListItem';
import { AppNav } from '@/components/app-nav';
import { BottomNav } from '@/components/bottom-nav';
import { useList } from '@/hooks/useList';

const quickAddItems = [
  { name: 'Eggs', quantity: '1 dozen', detail: 'Fresh pack' },
  { name: 'Yogurt', quantity: '1 cup', detail: 'Breakfast snack' },
  { name: 'Rice', quantity: '1 bag', detail: 'Versatile side' }
];

export default function ShoppingListPage() {
  const {
    checkedCount,
    addItem,
    items,
    remainingCount,
    removeItem,
    resetCheckedState,
    toggleItemChecked,
    totalCount
  } = useList();

  const [draftName, setDraftName] = useState('');
  const [draftQuantity, setDraftQuantity] = useState('1 piece');
  const [draftDetail, setDraftDetail] = useState('Added from shopping trip');

  const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
  const allChecked = useMemo(() => totalCount > 0 && checkedCount === totalCount, [checkedCount, totalCount]);

  const addToList = () => {
    const normalizedName = draftName.trim();
    if (!normalizedName) return;

    addItem({
      name: normalizedName,
      quantity: draftQuantity.trim() || '1 piece',
      detail: draftDetail.trim() || 'Added from shopping trip'
    });

    setDraftName('');
    setDraftQuantity('1 piece');
    setDraftDetail('Added from shopping trip');
  };

  const addQuickItem = (name: string, quantity: string, detail: string) => {
    addItem({ name, quantity, detail });
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
              Tap the checkbox once an item is in your basket. Completed rows are struck through immediately and restored from localStorage on
              reload.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-emerald-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-800">Trip progress</p>
            <p className="mt-1 text-3xl font-black text-slate-950">{checkedCount}/{totalCount}</p>
            <p className="text-sm font-semibold text-slate-600">{remainingCount} left to collect</p>
          </div>
        </div>

        <section className="mt-6 rounded-[1.75rem] border border-emerald-200 bg-white/95 p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">Today&apos;s basket</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">
                Tap the checkbox once an item is in your basket. Completed rows are struck through immediately and restored from localStorage on
                reload.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <button
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:border-emerald-700 hover:text-emerald-900"
                onClick={resetCheckedState}
                type="button"
              >
                Clear check marks
              </button>
              {allChecked ? (
                <button
                  className="inline-flex items-center justify-center rounded-full border border-emerald-700 bg-emerald-700 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-600"
                  onClick={resetCheckedState}
                  type="button"
                >
                  Start next trip
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-800">Add item</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_0.65fr]">
              <label className="grid gap-1 text-sm">
                <span className="font-bold text-slate-700">Name</span>
                <input
                  className="rounded-full border border-slate-300 px-3 py-2 text-sm"
                  onChange={(event) => setDraftName(event.target.value)}
                  type="text"
                  value={draftName}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-bold text-slate-700">Qty</span>
                <input
                  className="rounded-full border border-slate-300 px-3 py-2 text-sm"
                  onChange={(event) => setDraftQuantity(event.target.value)}
                  type="text"
                  value={draftQuantity}
                />
              </label>
            </div>
            <label className="mt-3 grid gap-1 text-sm">
              <span className="font-bold text-slate-700">Details</span>
              <input
                className="rounded-[1.2rem] border border-slate-300 px-3 py-2 text-sm"
                onChange={(event) => setDraftDetail(event.target.value)}
                type="text"
                value={draftDetail}
              />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="rounded-full bg-slate-950 px-3 py-2 text-sm font-black text-white"
                onClick={addToList}
                type="button"
              >
                Add to list
              </button>
              {quickAddItems.map((item) => (
                <button
                  className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-800"
                  key={item.name}
                  onClick={() => addQuickItem(item.name, item.quantity, item.detail)}
                  type="button"
                >
                  + {item.name}
                </button>
              ))}
            </div>
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
              <CheckableListItem
                item={item}
                key={item.id}
                onRemove={() => removeItem(item.id)}
                onToggle={toggleItemChecked}
              />
            ))}
          </ul>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
