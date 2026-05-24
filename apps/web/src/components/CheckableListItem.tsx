'use client';

import type { ShoppingListItem } from '@/hooks/useList';

type CheckableListItemProps = {
  item: ShoppingListItem;
  onToggle: (itemId: string) => void;
};

export function CheckableListItem({ item, onToggle }: Readonly<CheckableListItemProps>) {
  return (
    <li
      className={`rounded-2xl border p-4 transition ${
        item.checked ? 'border-emerald-200 bg-emerald-50/80' : 'border-slate-200 bg-white'
      }`}
    >
      <label className="flex cursor-pointer items-start gap-3">
        <input
          checked={item.checked}
          className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-800 focus:ring-emerald-700"
          onChange={() => onToggle(item.id)}
          type="checkbox"
        />
        <span className="min-w-0 flex-1">
          <span
            className={`block text-lg font-black text-slate-950 ${
              item.checked ? 'line-through decoration-2 decoration-emerald-700 text-slate-500' : ''
            }`}
          >
            {item.name}
          </span>
          <span
            className={`mt-1 block text-sm font-semibold ${
              item.checked ? 'line-through text-slate-500' : 'text-slate-700'
            }`}
          >
            {item.quantity} · {item.detail}
          </span>
        </span>
      </label>
      {item.matchedProductSlug ? (
        <p className="mt-3 rounded-xl bg-sky-50 px-3 py-2 text-xs font-black text-sky-900">
          Matched catalog product: {item.matchedProductName ?? item.matchedProductSlug} · matchedProductSlug: {item.matchedProductSlug}
        </p>
      ) : null}
    </li>
  );
}
