'use client';

import type { ShoppingListItem } from '@/hooks/useList';
import { QuantitySelector } from '@/components/QuantitySelector';
import { useHaptic } from '@/hooks/useHaptic';
import { cheapestSourceForProductSlug } from '@/lib/shopping-list-prices';

type CheckableListItemProps = {
  item: ShoppingListItem;
  onQuantityChange: (itemId: string, quantityCount: number) => void;
  onToggle: (itemId: string) => void;
};

type RouteHint = {
  aisleLabel: string;
  department: string;
};

const routeHintsByItemId: Record<string, RouteHint> = {
  'coffee-weekly-top-up': { department: 'Pantry', aisleLabel: 'Aisle 6' },
  'oats-breakfast-staple': { department: 'Breakfast', aisleLabel: 'Aisle 2' },
  'milk-dairy-run': { department: 'Dairy', aisleLabel: 'Aisle 4 cold case' },
  'frozen-vegetables': { department: 'Frozen', aisleLabel: 'Freezer wall' },
  'fresh-fruit': { department: 'Produce', aisleLabel: 'Entrance produce bay' }
};

function routeHintForItem(item: ShoppingListItem): RouteHint {
  const storedHint = routeHintsByItemId[item.id];
  if (storedHint) return storedHint;

  const routeText = `${item.name} ${item.detail}`.toLowerCase();
  if (routeText.includes('dairy') || routeText.includes('milk')) return { department: 'Dairy', aisleLabel: 'Aisle 4 cold case' };
  if (routeText.includes('frozen')) return { department: 'Frozen', aisleLabel: 'Freezer wall' };
  if (routeText.includes('fruit') || routeText.includes('produce')) return { department: 'Produce', aisleLabel: 'Entrance produce bay' };
  if (routeText.includes('breakfast') || routeText.includes('oats')) return { department: 'Breakfast', aisleLabel: 'Aisle 2' };

  return { department: 'Pantry', aisleLabel: 'Aisle 6' };
}

function quantityCountForItem(item: ShoppingListItem) {
  if (typeof item.quantityCount === 'number' && Number.isFinite(item.quantityCount)) return Math.max(1, Math.round(item.quantityCount));
  const parsedQuantity = Number(item.quantity.match(/^\s*(\d+)/)?.[1] ?? 1);
  return Number.isFinite(parsedQuantity) ? Math.max(1, Math.round(parsedQuantity)) : 1;
}

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { currency: 'SEK', maximumFractionDigits: 2, style: 'currency' }).format(value);
}

export function CheckableListItem({ item, onQuantityChange, onToggle }: Readonly<CheckableListItemProps>) {
  const { selection } = useHaptic();
  const cheapestSource = cheapestSourceForProductSlug(item.matchedProductSlug);
  const routeHint = routeHintForItem(item);
  const quantityCount = quantityCountForItem(item);
  const itemTotalSek = typeof item.estimatedUnitPriceSek === 'number' && Number.isFinite(item.estimatedUnitPriceSek)
    ? item.estimatedUnitPriceSek * quantityCount
    : null;

  function toggleItem() {
    if (!item.checked) selection();
    onToggle(item.id);
  }

  return (
    <li
      className={`rounded-2xl border p-4 transition ${
        item.checked ? 'border-emerald-200 bg-emerald-50/80' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <label className="flex min-w-0 cursor-pointer items-start gap-3">
          <input
            checked={item.checked}
            className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-800 focus:ring-emerald-700"
            onChange={toggleItem}
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
            <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-950">
              Route stop: {routeHint.aisleLabel} · {routeHint.department}
            </span>
          </span>
        </label>
        <div className="shrink-0" data-print-hidden="true">
          <QuantitySelector
            disabled={item.checked}
            itemName={item.name}
            onChange={(nextQuantity) => onQuantityChange(item.id, nextQuantity)}
            value={quantityCount}
          />
          {itemTotalSek === null ? null : (
            <p className="mt-1 text-right text-xs font-black text-slate-500">{formatSek(itemTotalSek)}</p>
          )}
        </div>
      </div>
      {item.matchedProductSlug ? (
        <div className="mt-3 space-y-2">
          <p className="rounded-xl bg-sky-50 px-3 py-2 text-xs font-black text-sky-900">
            Matched catalog product: {item.matchedProductName ?? item.matchedProductSlug} · matchedProductSlug: {item.matchedProductSlug}
          </p>
          {cheapestSource ? (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-950">
              Cheapest source: {cheapestSource.chainLabel} · {cheapestSource.priceLabel} · spread {cheapestSource.spreadPercent.toFixed(1)}%
            </p>
          ) : (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-950">
              Cheapest source unavailable until a verified latest price row exists for this item.
            </p>
          )}
        </div>
      ) : null}
    </li>
  );
}
