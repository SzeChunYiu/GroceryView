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

export type StoreBasketSubstitutionExplanation = {
  productName: string;
  storeName: string;
  priceText: string;
  reason: string;
};

export type StoreBasketComparisonStore = {
  storeId: string;
  storeName: string;
  rankLabel: string;
  totalText: string;
  availableCount: number;
  missingCount: number;
  coverageLabel: string;
  missingProductNames: string[];
  substitutions: StoreBasketSubstitutionExplanation[];
};

type StoreComparisonTableProps = {
  items: StoreComparisonItem[];
  basketItemCount?: number;
  basketSourceLabel?: string;
  basketStores?: StoreBasketComparisonStore[];
  initialLoyaltyCardIds?: string[];
};

export function StoreComparisonTable({
  items,
  basketItemCount = 0,
  basketSourceLabel,
  basketStores = [],
  initialLoyaltyCardIds = []
}: Readonly<StoreComparisonTableProps>) {
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
          Compare whole-basket store totals side-by-side. Missing items remain visible, and substitution notes point to the cheapest observed store row instead of estimating unavailable prices.
        </p>
        {basketItemCount > 0 ? (
          <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-800">{basketItemCount} basket item(s)</p>
        ) : null}
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

      {basketStores.length > 0 ? (
        <div className="grid gap-4 border-b border-emerald-100 p-5">
          <div className="grid gap-3 lg:grid-cols-3">
            {basketStores.map((store) => (
              <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4" key={store.storeId}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{store.rankLabel} nearby store</p>
                    <h3 className="mt-2 text-xl font-black text-slate-950">{store.storeName}</h3>
                  </div>
                  <p className={store.missingCount === 0 ? 'rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-900' : 'rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-950'}>
                    {store.missingCount === 0 ? 'complete' : `${store.missingCount} missing`}
                  </p>
                </div>
                <p className="mt-3 text-4xl font-black text-emerald-900">{store.totalText}</p>
                <p className="mt-2 text-sm font-semibold text-slate-600">{store.coverageLabel}</p>
                {store.missingProductNames.length > 0 ? (
                  <p className="mt-3 text-xs font-semibold leading-5 text-amber-950">
                    Missing: {store.missingProductNames.slice(0, 3).join(', ')}{store.missingProductNames.length > 3 ? ` +${store.missingProductNames.length - 3} more` : ''}
                  </p>
                ) : null}
              </article>
            ))}
          </div>

          <div className="overflow-x-auto rounded-[1.5rem] border border-slate-200 bg-white">
            <table className="min-w-full border-collapse text-left text-sm">
              <caption className="sr-only">Side-by-side basket totals, missing items, and substitution explanations by store</caption>
              <thead className="bg-slate-950 text-white">
                <tr>
                  <th className="px-4 py-3 font-black">Store</th>
                  <th className="px-4 py-3 font-black">Basket total</th>
                  <th className="px-4 py-3 font-black">Coverage</th>
                  <th className="px-4 py-3 font-black">Missing items</th>
                  <th className="px-4 py-3 font-black">Substitution explanations</th>
                </tr>
              </thead>
              <tbody>
                {basketStores.map((store) => (
                  <tr className="border-t border-slate-100 align-top" key={`${store.storeId}-basket`}>
                    <th className="px-4 py-4 font-black text-slate-950">{store.storeName}</th>
                    <td className="px-4 py-4 font-black text-emerald-900">{store.totalText}</td>
                    <td className="px-4 py-4 font-semibold text-slate-700">{store.coverageLabel}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-600">
                      {store.missingProductNames.length > 0 ? store.missingProductNames.join(', ') : 'No missing basket rows'}
                    </td>
                    <td className="px-4 py-4">
                      {store.substitutions.length > 0 ? (
                        <ul className="space-y-2">
                          {store.substitutions.slice(0, 4).map((substitution) => (
                            <li className="rounded-2xl bg-emerald-50 p-3 text-xs font-semibold leading-5 text-emerald-950" key={`${store.storeId}-${substitution.productName}-${substitution.storeName}`}>
                              <span className="block font-black">{substitution.productName}: {substitution.storeName} · {substitution.priceText}</span>
                              {substitution.reason}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-sm font-semibold text-slate-500">No cheaper or missing-line substitution found.</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {basketSourceLabel ? <p className="text-xs font-semibold text-slate-500">Source: {basketSourceLabel}</p> : null}
        </div>
      ) : null}

      {items.length > 0 ? (
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
      ) : null}
    </section>
  );
}
