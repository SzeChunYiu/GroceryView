'use client';

import { useState } from 'react';

type InventoryStatus = 'in-stock' | 'consumed' | 'low-stock' | 'replenished';

type InventoryItem = {
  id: string;
  name: string;
  quantity: string;
  aisle: string;
  status: InventoryStatus;
};

const statusLabels: Record<InventoryStatus, string> = {
  'in-stock': 'In stock',
  consumed: 'Consumed',
  'low-stock': 'Low stock',
  replenished: 'Replenished'
};

const statusStyles: Record<InventoryStatus, string> = {
  'in-stock': 'border-slate-200 bg-white text-slate-700',
  consumed: 'border-rose-200 bg-rose-50 text-rose-800',
  'low-stock': 'border-amber-200 bg-amber-50 text-amber-900',
  replenished: 'border-emerald-200 bg-emerald-50 text-emerald-800'
};

const initialItems: InventoryItem[] = [
  { id: 'oats', name: 'Havregryn', quantity: '1 open pack', aisle: 'Breakfast', status: 'in-stock' },
  { id: 'milk', name: 'Milk', quantity: '2 litres', aisle: 'Dairy', status: 'low-stock' },
  { id: 'tomatoes', name: 'Crushed tomatoes', quantity: '0 cans', aisle: 'Pantry', status: 'consumed' },
  { id: 'coffee', name: 'Coffee beans', quantity: '1 bag', aisle: 'Pantry', status: 'replenished' }
];

export function InventoryGrid() {
  const [items, setItems] = useState(initialItems);

  const markItem = (itemId: string, status: InventoryStatus) => {
    setItems((currentItems) => currentItems.map((item) => (item.id === itemId ? { ...item, status } : item)));
  };

  const listSuggestions = items.filter((item) => item.status === 'consumed' || item.status === 'low-stock').length;
  const replenished = items.filter((item) => item.status === 'replenished').length;

  return (
    <section className="mt-6 rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-700">Pantry reconciliation</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Adjust inventory before the next grocery run</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Mark consumed and low-stock items so the next generated list can prioritize refills, then clear anything already replenished.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-2xl border border-amber-200 bg-white/80 p-3">
            <p className="font-black text-amber-900">{listSuggestions}</p>
            <p className="text-slate-600">refill signals</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-white/80 p-3">
            <p className="font-black text-emerald-800">{replenished}</p>
            <p className="text-slate-600">replenished</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-black text-slate-950">{item.name}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {item.quantity} · {item.aisle}
                </p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusStyles[item.status]}`}>
                {statusLabels[item.status]}
              </span>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {(['consumed', 'low-stock', 'replenished'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => markItem(item.id, status)}
                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                >
                  Mark {statusLabels[status].toLowerCase()}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
