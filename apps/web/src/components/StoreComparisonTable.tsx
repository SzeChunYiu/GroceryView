'use client';

import { useMemo, useState } from 'react';

export type StoreComparisonPrice = {
  storeId: string;
  storeName: string;
  basePriceLabel: string;
  unitLabel?: string;
  loyaltyCardId?: string;
  loyaltyCardLabel?: string;
  loyaltyPriceLabel?: string;
};

export type StoreComparisonItem = {
  id: string;
  name: string;
  prices: StoreComparisonPrice[];
};

type StoreComparisonTableProps = {
  items: StoreComparisonItem[];
  initialLoyaltyCardIds?: string[];
};

export function StoreComparisonTable({ items, initialLoyaltyCardIds = [] }: Readonly<StoreComparisonTableProps>) {
  const [heldCards, setHeldCards] = useState(() => new Set(initialLoyaltyCardIds));
  const loyaltyCards = useMemo(() => {
    const cards = new Map<string, string>();
    for (const item of items) {
      for (const price of item.prices) {
        if (price.loyaltyCardId && price.loyaltyCardLabel) cards.set(price.loyaltyCardId, price.loyaltyCardLabel);
      }
    }
    return [...cards.entries()].map(([id, label]) => ({ id, label }));
  }, [items]);

  function toggleCard(cardId: string) {
    setHeldCards((current) => {
      const next = new Set(current);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-sm" data-store-comparison-table>
      <div className="border-b border-emerald-100 bg-emerald-50 px-5 py-4">
        <h2 className="text-2xl font-black text-emerald-950">Store comparison</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-emerald-900">
          Mark the loyalty cards you hold to show member prices where stores publish a loyalty discount.
        </p>
        {loyaltyCards.length > 0 ? (
          <fieldset className="mt-4 flex flex-wrap gap-2">
            <legend className="sr-only">Held loyalty cards</legend>
            {loyaltyCards.map((card) => (
              <label className="rounded-full border border-emerald-200 bg-white px-3 py-2 text-sm font-bold text-emerald-950" key={card.id}>
                <input
                  checked={heldCards.has(card.id)}
                  className="mr-2 accent-emerald-700"
                  onChange={() => toggleCard(card.id)}
                  type="checkbox"
                />
                {card.label}
              </label>
            ))}
          </fieldset>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left">
          <caption className="sr-only">Store prices with loyalty-card discounts applied when selected</caption>
          <thead>
            <tr className="bg-slate-950 text-white">
              <th className="px-4 py-3 text-sm font-black">Item</th>
              <th className="px-4 py-3 text-sm font-black">Store</th>
              <th className="px-4 py-3 text-sm font-black">Price</th>
            </tr>
          </thead>
          <tbody>
            {items.flatMap((item) => item.prices.map((price) => {
              const hasHeldCard = Boolean(price.loyaltyCardId && heldCards.has(price.loyaltyCardId));
              const showLoyaltyPrice = hasHeldCard && Boolean(price.loyaltyPriceLabel);

              return (
                <tr className="border-t border-slate-100" key={`${item.id}-${price.storeId}`}>
                  <th className="px-4 py-4 text-sm font-black text-slate-950">{item.name}</th>
                  <td className="px-4 py-4 text-sm font-semibold text-slate-700">{price.storeName}</td>
                  <td className="px-4 py-4">
                    {showLoyaltyPrice ? (
                      <div className="grid gap-1">
                        <p className="text-lg font-black text-emerald-800">{price.loyaltyPriceLabel}</p>
                        <p className="text-xs font-semibold text-slate-500">
                          <span className="line-through">{price.basePriceLabel}</span> with {price.loyaltyCardLabel}
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-1">
                        <p className="text-lg font-black text-slate-950">{price.basePriceLabel}</p>
                        {price.loyaltyPriceLabel && price.loyaltyCardLabel ? (
                          <p className="text-xs font-semibold text-emerald-700">Loyalty price {price.loyaltyPriceLabel} with {price.loyaltyCardLabel}</p>
                        ) : null}
                      </div>
                    )}
                    {price.unitLabel ? <p className="mt-1 text-xs font-semibold text-slate-500">{price.unitLabel}</p> : null}
                  </td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
