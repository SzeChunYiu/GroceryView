'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { AppNav } from '@/components/app-nav';
import { BottomNav } from '@/components/bottom-nav';
import { buildExpiryReminder, type PantryExpiryUrgency } from '@/lib/pantry';

type PantryStatus = 'stocked' | 'consumed' | 'low' | 'replenished';

type PantryInventoryItem = {
  aisle: string;
  id: string;
  name: string;
  quantity: string;
  expiresAt: string | null;
  recipeHref: string;
  replacementHref: string;
  status: PantryStatus;
};

const statusLabels: Record<PantryStatus, string> = {
  stocked: 'Stocked',
  consumed: 'Consumed',
  low: 'Low stock',
  replenished: 'Replenished'
};

const statusStyles: Record<PantryStatus, string> = {
  stocked: 'bg-slate-100 text-slate-800',
  consumed: 'bg-rose-100 text-rose-900',
  low: 'bg-amber-100 text-amber-900',
  replenished: 'bg-emerald-100 text-emerald-900'
};

const expiryStyles: Record<PantryExpiryUrgency, string> = {
  expired: 'bg-rose-100 text-rose-900',
  'use-soon': 'bg-amber-100 text-amber-900',
  planned: 'bg-sky-100 text-sky-900',
  unknown: 'bg-slate-100 text-slate-700'
};

const initialPantryItems: PantryInventoryItem[] = [
  { id: 'coffee', name: 'Coffee', aisle: 'Breakfast', quantity: '1 package', expiresAt: '2026-07-09', recipeHref: '/meal-planner?ingredient=coffee', replacementHref: '/deals?replace=coffee', status: 'stocked' },
  { id: 'oats', name: 'Oats', aisle: 'Breakfast', quantity: '1 bag', expiresAt: '2026-05-31', recipeHref: '/meal-planner?ingredient=oats', replacementHref: '/deals?replace=oats', status: 'low' },
  { id: 'milk', name: 'Milk or fil', aisle: 'Dairy', quantity: '2 cartons', expiresAt: '2026-05-27', recipeHref: '/meal-planner?ingredient=milk', replacementHref: '/deals?replace=milk', status: 'consumed' },
  { id: 'frozen-veg', name: 'Frozen vegetables', aisle: 'Freezer', quantity: '1 bag', expiresAt: null, recipeHref: '/meal-planner?ingredient=frozen-veg', replacementHref: '/deals?replace=frozen-veg', status: 'stocked' }
];

function Card({ children, className = '' }: Readonly<{ children: ReactNode; className?: string }>) {
  return <section className={`rounded-[1.75rem] border border-slate-200 bg-white/88 p-5 shadow-sm ${className}`}>{children}</section>;
}

export default function PantryInventoryPage() {
  const [items, setItems] = useState(initialPantryItems);
  const itemsWithExpiry = useMemo(() => items.map((item) => ({
    ...item,
    expiryReminder: buildExpiryReminder({ expiresAt: item.expiresAt })
  })), [items]);
  const statusCounts = useMemo(() => items.reduce<Record<PantryStatus, number>>((counts, item) => {
    counts[item.status] += 1;
    return counts;
  }, { stocked: 0, consumed: 0, low: 0, replenished: 0 }), [items]);
  const useSoonCount = itemsWithExpiry.filter((item) => item.expiryReminder.urgency === 'expired' || item.expiryReminder.urgency === 'use-soon').length;

  function markItem(itemId: string, status: PantryStatus) {
    setItems((currentItems) => currentItems.map((item) => (
      item.id === itemId ? { ...item, status } : item
    )));
  }

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-slate-950">
      <AppNav />
      <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-800">Pantry inventory</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight">Reconcile what changed at home</h1>
        <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
          Mark pantry staples as consumed, low stock, or replenished after each shopping cycle while expiry reminders highlight food to use soon before buying replacements.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-5">
          {(Object.keys(statusLabels) as PantryStatus[]).map((status) => (
            <Card className="p-4" key={status}>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">{statusLabels[status]}</p>
              <p className="mt-2 text-4xl font-black text-slate-950">{statusCounts[status]}</p>
            </Card>
          ))}
          <Card className="p-4">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Use soon</p>
            <p className="mt-2 text-4xl font-black text-amber-800">{useSoonCount}</p>
          </Card>
        </div>

        <Card className="mt-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-black">Inventory adjustment queue</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-700">Use the quick actions to keep list generation from restocking items that were already replenished.</p>
            </div>
            <button
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:border-emerald-700 hover:text-emerald-900"
              onClick={() => setItems(initialPantryItems)}
              type="button"
            >
              Reset account sample
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {itemsWithExpiry.map((item) => (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={item.id}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xl font-black text-slate-950">{item.name}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{item.quantity} · {item.aisle}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${expiryStyles[item.expiryReminder.urgency]}`}>
                        {item.expiryReminder.label}
                      </span>
                      {item.expiryReminder.urgency === 'expired' || item.expiryReminder.urgency === 'use-soon' ? (
                        <>
                          <Link className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-900 transition hover:text-emerald-700" href={item.recipeHref}>Recipe ideas</Link>
                          <Link className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-900 transition hover:text-emerald-700" href={item.replacementHref}>Replacement deals</Link>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${statusStyles[item.status]}`}>
                    {statusLabels[item.status]}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(['consumed', 'low', 'replenished'] as PantryStatus[]).map((status) => (
                    <button
                      aria-pressed={item.status === status}
                      className={`rounded-full px-4 py-2 text-sm font-black transition ${
                        item.status === status
                          ? 'bg-emerald-800 text-white'
                          : 'border border-slate-200 bg-white text-slate-700 hover:border-emerald-700 hover:text-emerald-900'
                      }`}
                      key={status}
                      onClick={() => markItem(item.id, status)}
                      type="button"
                    >
                      Mark {statusLabels[status].toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </main>
      <BottomNav />
    </div>
  );
}
