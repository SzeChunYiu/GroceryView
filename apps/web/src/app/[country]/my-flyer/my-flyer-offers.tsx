'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  DIET_FILTER_STORAGE_KEY,
  DietFilterPicker,
  type DietFilterValue,
  readStoredDietFilters
} from '@/components/diet-filter-picker';
import type { AxfoodProduct } from '@/lib/axfood-products';

type FlyerOffer = Readonly<{
  chain: string;
  priceText: string;
  unit: string;
  savings: number | null;
}>;

type FlyerProductRow = Readonly<{
  product: AxfoodProduct;
  offer: FlyerOffer;
}>;

type MyFlyerOffersProps = Readonly<{
  rows: readonly FlyerProductRow[];
}>;

const dietLabels: Record<DietFilterValue, string> = {
  organic: 'Organic',
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  'gluten-free': 'Gluten-free',
  'lactose-free': 'Lactose-free'
};

const labelAliases: Record<DietFilterValue, readonly string[]> = {
  organic: ['ecological', 'eu_ecological', 'krav', 'organic', 'eko'],
  vegetarian: ['vegetarian', 'vegetariskt', 'vego'],
  vegan: ['vegan', 'veganskt'],
  'gluten-free': ['glutenfree', 'gluten_free', 'gluten-free', 'glutenfri'],
  'lactose-free': ['laktosfree', 'lactose_free', 'lactose-free', 'laktosfri']
};

const plantForwardCategories = new Set(['frukt-och-gront']);

function normalizeText(value: string) {
  return value.toLocaleLowerCase('sv-SE').replace(/[\s_]+/g, '-');
}

function productSearchText(product: AxfoodProduct) {
  return normalizeText([product.name, product.brand, product.subline, product.category, product.labels.join(' ')].join(' '));
}

function productMatchesDiet(product: AxfoodProduct, filter: DietFilterValue) {
  const labels = new Set(product.labels.map(normalizeText));
  const searchText = productSearchText(product);

  if (labelAliases[filter].some((alias) => labels.has(normalizeText(alias)) || searchText.includes(normalizeText(alias)))) {
    return true;
  }

  if ((filter === 'vegetarian' || filter === 'vegan') && plantForwardCategories.has(product.category)) {
    return true;
  }

  return false;
}

function matchingDietFilters(product: AxfoodProduct, selectedFilters: readonly DietFilterValue[]) {
  return selectedFilters.filter((filter) => productMatchesDiet(product, filter));
}

function rankRows(rows: readonly FlyerProductRow[], selectedFilters: readonly DietFilterValue[]) {
  if (selectedFilters.length === 0) {
    return rows;
  }

  return [...rows].sort((left, right) => {
    const rightScore = matchingDietFilters(right.product, selectedFilters).length;
    const leftScore = matchingDietFilters(left.product, selectedFilters).length;

    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }

    return right.product.spreadPct - left.product.spreadPct;
  });
}

export function MyFlyerOffers({ rows }: MyFlyerOffersProps) {
  const [selectedFilters, setSelectedFilters] = useState<DietFilterValue[]>([]);

  useEffect(() => {
    setSelectedFilters(readStoredDietFilters(DIET_FILTER_STORAGE_KEY));

    function handleStoredFiltersChanged(event: Event) {
      if (!(event instanceof CustomEvent) || event.detail?.storageKey !== DIET_FILTER_STORAGE_KEY) {
        return;
      }

      setSelectedFilters(readStoredDietFilters(DIET_FILTER_STORAGE_KEY));
    }

    window.addEventListener('groceryview:diet-filters-changed', handleStoredFiltersChanged);
    return () => window.removeEventListener('groceryview:diet-filters-changed', handleStoredFiltersChanged);
  }, []);

  const rankedRows = useMemo(() => rankRows(rows, selectedFilters), [rows, selectedFilters]);
  const activeDietSummary = selectedFilters.length > 0
    ? selectedFilters.map((filter) => dietLabels[filter]).join(', ')
    : 'No diet filters applied';

  return (
    <>
      <div className="my-flyer-screen-only mb-6" data-print-hide>
        <DietFilterPicker selected={selectedFilters} onChange={setSelectedFilters} storageKey={DIET_FILTER_STORAGE_KEY} />
      </div>

      <section className="my-flyer-diet-print-summary my-flyer-print-only mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-black text-emerald-950" aria-label="Active diet filters for printed flyer">
        Diet filters: {activeDietSummary}
      </section>

      <section className="my-flyer-print-grid grid gap-4 lg:grid-cols-2">
        {rankedRows.map(({ product, offer }) => {
          const matchedFilters = matchingDietFilters(product, selectedFilters);
          return (
            <article className="my-flyer-product-card rounded-[1.5rem] border border-stone-300 bg-white p-4 shadow-sm" key={product.code}>
              <div className="my-flyer-product-media rounded-2xl bg-stone-50 p-4">
                <img alt="" className="my-flyer-product-image mx-auto h-36 w-full object-contain" src={product.image ?? ''} />
              </div>
              <div className="my-flyer-product-content pt-4">
                <p className="my-flyer-product-brand text-xs font-black uppercase tracking-[0.18em] text-orange-700">{product.brand}</p>
                <h2 className="my-flyer-product-name mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">{product.name}</h2>
                <p className="my-flyer-product-subline mt-1 text-sm font-semibold text-slate-600">{product.subline}</p>
                {matchedFilters.length > 0 ? (
                  <p className="mt-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-emerald-900" data-print-hide>
                    Matches {matchedFilters.map((filter) => dietLabels[filter]).join(', ')}
                  </p>
                ) : null}
                <div className="my-flyer-product-price-row mt-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="my-flyer-product-store text-xs font-black uppercase tracking-[0.16em] text-slate-500">{offer.chain}</p>
                    <p className="my-flyer-product-price text-4xl font-black tracking-[-0.06em] text-slate-950">{offer.priceText}</p>
                    <p className="my-flyer-product-unit text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{offer.unit}</p>
                  </div>
                  {offer.savings ? <p className="my-flyer-product-saving rounded-full bg-lime-200 px-3 py-1 text-sm font-black">Save {offer.savings.toFixed(0)} kr</p> : null}
                </div>
                <p className="my-flyer-product-source mt-3 text-xs font-semibold text-slate-500">Observed Axfood catalogue data · {product.code}</p>
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}
