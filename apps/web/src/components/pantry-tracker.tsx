'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  applyPantryConsumptionEvents,
  type PantryConsumptionEvent,
  type PantryStockItem,
  type PantryStockStatus
} from '@/lib/pantry';

type PantryTrackerProps = {
  items: PantryStockItem[];
};

const expiryClasses = {
  expired: 'bg-rose-100 text-rose-900',
  'use-soon': 'bg-amber-100 text-amber-900',
  planned: 'bg-sky-100 text-sky-900',
  unknown: 'bg-slate-100 text-slate-700'
} satisfies Record<PantryStockItem['expiryReminder']['urgency'], string>;

const statusClasses: Record<PantryStockStatus, string> = {
  healthy: 'bg-emerald-100 text-emerald-900',
  low: 'bg-amber-100 text-amber-900',
  depleted: 'bg-rose-100 text-rose-900'
};

function formatDays(days: number | null) {
  if (days === null) return 'No depletion estimate';
  if (days === 0) return 'Depleted';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

function makeEvent(productId: string, quantity: number, source: PantryConsumptionEvent['source']): PantryConsumptionEvent {
  return {
    productId,
    quantity,
    source,
    label: source === 'trip' ? 'Trip completion' : 'Manual consumption',
    occurredAt: new Date().toISOString()
  };
}

export function PantryTracker({ items }: PantryTrackerProps) {
  const [events, setEvents] = useState<PantryConsumptionEvent[]>([]);
  const [manualQuantities, setManualQuantities] = useState<Record<string, string>>({});
  const stock = useMemo(() => applyPantryConsumptionEvents(items, events), [events, items]);

  function recordTripCompletion(item: PantryStockItem) {
    setEvents((current) => [...current, makeEvent(item.productId, item.estimatedDailyUse, 'trip')]);
  }

  function recordManualConsumption(productId: string) {
    const quantity = Number(manualQuantities[productId] ?? 0);
    if (!Number.isFinite(quantity) || quantity <= 0) return;

    setEvents((current) => [...current, makeEvent(productId, quantity, 'manual')]);
    setManualQuantities((current) => ({ ...current, [productId]: '' }));
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black">Owned stock tracker</h2>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Quantities decrement when a trip is completed or when the household logs manual consumption.
          </p>
        </div>
        <p className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-slate-700">{events.length} events</p>
      </div>

      <div className="mt-4 space-y-3">
        {stock.map((item) => (
          <div className="rounded-2xl bg-slate-50 p-4" key={item.productId}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-black text-slate-950">{item.name}</p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  Owned {item.ownedQuantity} {item.unit} · uses about {item.estimatedDailyUse} {item.unit}/day
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <p className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-slate-700">{formatDays(item.depletionEstimateDays)}</p>
                  <p className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${expiryClasses[item.expiryReminder.urgency]}`}>{item.expiryReminder.label}</p>
                </div>
              </div>
              <p className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${statusClasses[item.status]}`}>{item.status}</p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white hover:bg-emerald-900"
                onClick={() => recordTripCompletion(item)}
                type="button"
              >
                Complete trip
              </button>
              <input
                aria-label={`Manual consumption for ${item.name}`}
                className="w-28 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-950"
                min="0"
                onChange={(event) => setManualQuantities((current) => ({ ...current, [item.productId]: event.target.value }))}
                placeholder={item.unit}
                type="number"
                value={manualQuantities[item.productId] ?? ''}
              />
              <button
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-black text-slate-700 hover:border-emerald-700"
                onClick={() => recordManualConsumption(item.productId)}
                type="button"
              >
                Log use
              </button>
            </div>

            {item.expiryReminder.urgency === 'expired' || item.expiryReminder.urgency === 'use-soon' ? (
              <div className="mt-3 flex flex-wrap gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3">
                <span className="text-sm font-black text-amber-950">Use-soon actions</span>
                <Link
                  className="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-900 hover:text-emerald-700"
                  data-use-soon-recipe-link={item.productId}
                  href={`/meal-planner?ingredient=${encodeURIComponent(item.productId)}`}
                  title={`Find recipes that use ${item.name}`}
                >
                  Find recipes
                </Link>
                <Link className="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-900 hover:text-emerald-700" href={`/deals?replace=${item.productId}`}>Replacement deals</Link>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
