'use client';

import { CheckableListItem } from '@/components/CheckableListItem';
import type { ShoppingListItem } from '@/hooks/useList';
import { sequenceListByAisle } from '@/lib/list-sequencing';

type ListGridProps = {
  items: ShoppingListItem[];
  onToggle: (itemId: string) => void;
};

export function ListGrid({ items, onToggle }: Readonly<ListGridProps>) {
  const aisleGroups = sequenceListByAisle(items);

  return (
    <div className="mt-5 space-y-4" aria-label="Aisle-sorted shopping route">
      {aisleGroups.map((group, index) => (
        <section className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3" key={group.aisle.id}>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-emerald-900">
              Aisle {String(index + 1).padStart(2, '0')} · {group.aisle.label}
            </h3>
            <p className="text-xs font-black text-slate-500">{group.items.length} item(s)</p>
          </div>
          <ul className="mt-3 space-y-3">
            {group.items.map((item) => (
              <CheckableListItem item={item} key={item.id} onToggle={onToggle} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
