'use client';

import { CheckableListItem } from '@/components/CheckableListItem';
import type { ShoppingListItem } from '@/hooks/useList';
import { storeAisleLayout, type AisleMoveDirection, type StoreAisleId } from '@/lib/list-sequencing';

type ListGridProps = {
  aisleRoute: StoreAisleId[];
  items: ShoppingListItem[];
  onMoveAisle: (aisleId: StoreAisleId, direction: AisleMoveDirection) => void;
  onToggleItem: (itemId: string) => void;
};

const aisleLabels = new Map(storeAisleLayout.map((aisle) => [aisle.id, aisle.label]));

export function ListGrid({ aisleRoute, items, onMoveAisle, onToggleItem }: Readonly<ListGridProps>) {
  return (
    <div className="mt-5 space-y-5">
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-900">Preferred store route</p>
        <p className="mt-1 text-sm font-semibold text-emerald-900/80">
          Move aisles to match your store. The custom storeAisleLayout order is saved in localStorage for the next trip.
        </p>
        <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {aisleRoute.map((aisleId, index) => (
            <li className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 shadow-sm" key={aisleId}>
              <span className="text-sm font-black text-slate-800">
                {index + 1}. {aisleLabels.get(aisleId) ?? aisleId}
              </span>
              <span className="flex gap-1">
                <button
                  aria-label={`Move ${aisleLabels.get(aisleId) ?? aisleId} aisle earlier`}
                  className="rounded-full border border-slate-200 px-2 py-1 text-xs font-black text-slate-700 disabled:opacity-40"
                  disabled={index === 0}
                  onClick={() => onMoveAisle(aisleId, 'up')}
                  type="button"
                >
                  ↑
                </button>
                <button
                  aria-label={`Move ${aisleLabels.get(aisleId) ?? aisleId} aisle later`}
                  className="rounded-full border border-slate-200 px-2 py-1 text-xs font-black text-slate-700 disabled:opacity-40"
                  disabled={index === aisleRoute.length - 1}
                  onClick={() => onMoveAisle(aisleId, 'down')}
                  type="button"
                >
                  ↓
                </button>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <ul className="space-y-3">
        {items.map((item) => (
          <CheckableListItem item={item} key={item.id} onToggle={onToggleItem} />
        ))}
      </ul>
    </div>
  );
}
