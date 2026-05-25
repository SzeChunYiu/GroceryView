'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { compareBasketStrategies, summarizeStoreBasketCoverage } from '@groceryview/core';
import { buildSmartBasketSubstituteSuggestions } from '@/lib/recurring-basket';
import { suggestCheaperBasketAlternatives, summarizeWeeklyBudgetProgress, summarizeWeeklyGroceryBudgetTracker } from '@/lib/meal-budgets';

export type BasketCalculatorPriceRow = {
  chainId: string;
  chainName: string;
  price: number;
  priceText: string;
  priceUnit: string;
  savings: number | null;
};

export type BasketCalculatorProduct = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  packageLabel: string;
  categoryLabel: string;
  image: string | null;
  prices: BasketCalculatorPriceRow[];
};

type BasketCalculatorProps = {
  products: BasketCalculatorProduct[];
  sourceLabel: string;
  weeklyBudgetSek: number;
};

function formatSek(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value)
    ? new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value)
    : 'Not priced';
}

function initialBasketIds(products: BasketCalculatorProduct[]) {
  return new Set(products.slice(0, 4).map((product) => product.id));
}

function cheapestProductPrice(product: BasketCalculatorProduct) {
  return product.prices.reduce((lowest, price) => Math.min(lowest, price.price), Number.POSITIVE_INFINITY);
}

export function BasketCalculator({ products, sourceLabel, weeklyBudgetSek }: Readonly<BasketCalculatorProps>) {
  const [selectedProductIds, setSelectedProductIds] = useState(() => initialBasketIds(products));
  const [weeklyBudget, setWeeklyBudget] = useState(weeklyBudgetSek);
  const [, startBasketUpdateTransition] = useTransition();

  const selectedProducts = useMemo(
    () => products.filter((product) => selectedProductIds.has(product.id)),
    [products, selectedProductIds]
  );

  const chains = useMemo(() => {
    const byId = new Map<string, { id: string; name: string }>();
    for (const product of products) {
      for (const price of product.prices) byId.set(price.chainId, { id: price.chainId, name: price.chainName });
    }
    return [...byId.values()].sort((left, right) => left.name.localeCompare(right.name, 'sv'));
  }, [products]);

  const basketInput = useMemo(() => ({
    favoriteStoreIds: chains.map((chain) => chain.id),
    items: selectedProducts.map((product) => ({
      productId: product.id,
      quantity: 1,
      prices: product.prices.map((price) => ({
        storeId: price.chainId,
        storeName: price.chainName,
        price: price.price,
        priceType: price.savings ? 'promotion' as const : 'shelf' as const
      }))
    }))
  }), [chains, selectedProducts]);

  const comparison = useMemo(() => compareBasketStrategies(basketInput), [basketInput]);
  const coverage = useMemo(() => summarizeStoreBasketCoverage(basketInput), [basketInput]);
  const plannedCatalogCost = useMemo(() => products.reduce((sum, product) => {
    const price = cheapestProductPrice(product);
    return Number.isFinite(price) ? sum + price : sum;
  }, 0), [products]);
  const weeklyBudgetProgress = useMemo(() => summarizeWeeklyBudgetProgress({
    plannedTotal: comparison.cheapestByProduct.total,
    weeklyBudget
  }), [comparison.cheapestByProduct.total, weeklyBudget]);
  const weeklyGroceryBudgetTracker = useMemo(() => summarizeWeeklyGroceryBudgetTracker({
    plannedBasketCost: plannedCatalogCost,
    actualCheckedItemsCost: comparison.cheapestByProduct.total,
    weeklyAllowance: weeklyBudget,
    plannedItemCount: products.length,
    checkedItemCount: selectedProducts.length
  }), [comparison.cheapestByProduct.total, plannedCatalogCost, products.length, selectedProducts.length, weeklyBudget]);
  const budgetAlternatives = useMemo(() => suggestCheaperBasketAlternatives(
    selectedProducts.map((product) => ({
      id: product.id,
      name: product.name,
      category: product.categoryLabel,
      currentPrice: cheapestProductPrice(product)
    })),
    products.map((product) => ({
      id: product.id,
      name: product.name,
      category: product.categoryLabel,
      currentPrice: cheapestProductPrice(product)
    }))
  ).slice(0, 3), [products, selectedProducts]);

  const chainTotals = useMemo(() => chains.map((chain) => {
    const singleStoreOption = comparison.singleStoreOptions.find((option) => option.storeId === chain.id);
    const coverageRow = coverage.stores.find((store) => store.storeId === chain.id);
    const missingCount = coverageRow?.missingProductIds.length ?? selectedProducts.length;
    const total = singleStoreOption?.total ?? coverageRow?.knownTotal ?? 0;
    return {
      ...chain,
      total,
      missingCount,
      complete: selectedProducts.length > 0 && missingCount === 0
    };
  }).sort((left, right) => {
    if (left.complete !== right.complete) return left.complete ? -1 : 1;
    if (left.complete && right.complete) return left.total - right.total;
    if (left.missingCount !== right.missingCount) return left.missingCount - right.missingCount;
    return left.name.localeCompare(right.name, 'sv');
  }), [chains, comparison.singleStoreOptions, coverage.stores, selectedProducts.length]);

  const assignmentsWithProducts = comparison.cheapestByProduct.assignments.map((assignment) => ({
    ...assignment,
    product: selectedProducts.find((product) => product.id === assignment.productId)
  }));

  const smartSubstitutes = useMemo(() => buildSmartBasketSubstituteSuggestions({
    catalog: products.map((product) => ({
      productId: product.id,
      productName: product.name,
      categoryLabel: product.categoryLabel,
      prices: product.prices.map((price) => ({ chainName: price.chainName, price: price.price }))
    })),
    items: selectedProducts.map((product) => ({
      productId: product.id,
      productName: product.name,
      categoryLabel: product.categoryLabel,
      prices: product.prices.map((price) => ({ chainName: price.chainName, price: price.price }))
    })),
    unavailableChainNames: chains.map((chain) => chain.name)
  }), [chains, products, selectedProducts]);

  function toggleProduct(productId: string) {
    startBasketUpdateTransition(() => {
      setSelectedProductIds((current) => {
        const next = new Set(current);
        if (next.has(productId)) next.delete(productId);
        else next.add(productId);
        return next;
      });
    });
  }

  const bestFullChain = comparison.bestSingleStore;

  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">Add products</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Build a basket from current chain rows</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              Tick products to add or remove them. No state persistence is used for v1; the selection stays in memory only for this tab render.
            </p>
          </div>
          <p className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-950">
            {selectedProducts.length} selected
          </p>
        </div>

        <div className="mt-5 space-y-3">
          {products.map((product) => {
            const checked = selectedProductIds.has(product.id);
            return (
              <label
                className={`flex cursor-pointer gap-3 rounded-2xl border p-3 transition ${checked ? 'border-emerald-700 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-400'}`}
                key={product.id}
              >
                <input
                  checked={checked}
                  className="mt-1 h-5 w-5 accent-emerald-800"
                  onChange={() => toggleProduct(product.id)}
                  type="checkbox"
                />
                {product.image ? (
                  <Image
                    alt=""
                    className="h-14 w-14 rounded-xl object-contain"
                    height={56}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    sizes="56px"
                    src={product.image}
                    width={56}
                  />
                ) : (
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-slate-100 text-xs font-black text-slate-500">No img</span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block font-black text-slate-950">{product.name}</span>
                  <span className="mt-1 block text-sm font-semibold text-slate-600">{product.brand || 'Brand not reported'} · {product.packageLabel}</span>
                  <span className="mt-2 flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    {product.prices.map((price) => (
                      <span className="rounded-full bg-slate-100 px-2 py-1" key={`${product.id}-${price.chainId}`}>
                        {price.chainName}: {formatSek(price.price)}
                      </span>
                    ))}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">Best full-chain total</p>
          <p className="mt-2 text-5xl font-black tracking-tight text-emerald-950">
            {bestFullChain ? formatSek(bestFullChain.total) : selectedProducts.length ? 'No full chain' : 'Select products'}
          </p>
          <p className="mt-3 text-lg font-black text-slate-950">
            {bestFullChain ? bestFullChain.storeName : 'Every chain is missing at least one selected product.'}
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-emerald-950">
            The full-chain winner only appears when a single chain has every selected product priced. Missing DB rows stay visible and never get estimated.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-800">Weekly budget progress</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Planned basket, checked items, and weekly allowance</h3>
            </div>
            <label className="text-sm font-black text-amber-950">
              Budget
              <input
                className="mt-1 block w-32 rounded-xl border border-amber-300 bg-white px-3 py-2 text-right font-black text-slate-950"
                min="0"
                onChange={(event) => setWeeklyBudget(Number(event.target.value))}
                step="25"
                type="number"
                value={weeklyBudget}
              />
            </label>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/80 p-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">Planned basket</p>
              <p className="mt-1 text-2xl font-black text-slate-950">{formatSek(weeklyGroceryBudgetTracker.plannedBasketCost)}</p>
              <p className="mt-1 text-xs font-bold text-slate-600">{weeklyGroceryBudgetTracker.plannedItemCount ?? products.length} catalogue items</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">Actual checked items</p>
              <p className="mt-1 text-2xl font-black text-slate-950">{formatSek(weeklyGroceryBudgetTracker.actualCheckedItemsCost)}</p>
              <p className="mt-1 text-xs font-bold text-slate-600">{weeklyGroceryBudgetTracker.checkedItemCount ?? selectedProducts.length} checked</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-3">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">Remaining allowance</p>
              <p className={`mt-1 text-2xl font-black ${weeklyGroceryBudgetTracker.remainingWeeklyAllowance < 0 ? 'text-rose-800' : 'text-emerald-800'}`}>
                {formatSek(weeklyGroceryBudgetTracker.remainingWeeklyAllowance)}
              </p>
              <p className="mt-1 text-xs font-bold text-slate-600">after checked items</p>
            </div>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
            <div
              className={`h-full rounded-full ${weeklyGroceryBudgetTracker.status === 'over' ? 'bg-rose-600' : weeklyGroceryBudgetTracker.status === 'near' ? 'bg-amber-500' : 'bg-emerald-600'}`}
              style={{ width: `${Math.min(100, weeklyGroceryBudgetTracker.checkedSpendPercent)}%` }}
            />
          </div>
          <p className="mt-3 text-sm font-semibold leading-6 text-amber-950">
            {weeklyGroceryBudgetTracker.warning} Full-plan cushion: {formatSek(weeklyGroceryBudgetTracker.plannedRemainingAllowance)}.
          </p>
          <p className="mt-2 rounded-2xl bg-white/70 p-3 text-sm font-semibold text-amber-950">
            Split-basket planned total is {formatSek(weeklyBudgetProgress.plannedTotal)}; {weeklyBudgetProgress.status === 'over' ? `${formatSek(Math.abs(weeklyBudgetProgress.remaining))} over` : `${formatSek(weeklyBudgetProgress.remaining)} left`} against the editable budget.
          </p>
          <div className="mt-4 space-y-2">
            {budgetAlternatives.length > 0 ? budgetAlternatives.map((alternative) => (
              <Link
                className="block rounded-2xl bg-white/80 p-3 text-sm hover:bg-white"
                href={`/products/${alternative.alternativeProductId}`}
                key={`${alternative.productId}-${alternative.alternativeProductId}`}
              >
                <span className="block font-black text-slate-950">Swap {alternative.productName} for {alternative.alternativeName}</span>
                <span className="mt-1 block font-semibold text-amber-950">Save about {formatSek(alternative.estimatedSavings)} on this category line.</span>
              </Link>
            )) : (
              <p className="rounded-2xl bg-white/80 p-3 text-sm font-semibold text-amber-950">No cheaper same-category alternatives found in the current basket catalogue.</p>
            )}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Cheapest split basket</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <p className="text-4xl font-black tracking-tight text-slate-950">{formatSek(comparison.cheapestByProduct.total)}</p>
            <p className="rounded-full bg-slate-950 px-3 py-1 text-sm font-black text-white">
              {comparison.splitStoreCount} chains
            </p>
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            compareBasketStrategies picks the cheapest observed chain for each selected line, then shows savings against the best complete one-chain shop when one exists.
          </p>
          <div className="mt-4 space-y-2">
            {assignmentsWithProducts.length > 0 ? assignmentsWithProducts.map((assignment) => (
              <Link
                className="grid gap-2 rounded-2xl bg-slate-50 p-3 text-sm hover:bg-emerald-50 sm:grid-cols-[1fr_auto]"
                href={`/products/${assignment.product?.slug ?? assignment.productId}`}
                key={`${assignment.productId}-${assignment.storeId}`}
              >
                <span>
                  <span className="block font-black text-slate-950">{assignment.product?.name ?? assignment.productId}</span>
                  <span className="mt-1 block font-semibold text-slate-600">{assignment.storeName} · {formatSek(assignment.unitPrice)} each</span>
                </span>
                <span className="font-black text-emerald-800">{formatSek(assignment.lineTotal)}</span>
              </Link>
            )) : (
              <p className="rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-600">Select at least one product to calculate the split basket.</p>
            )}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-violet-200 bg-violet-50 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-800">Smart substitute suggestions</p>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Actionable swaps</h3>
          <p className="mt-2 text-sm font-semibold leading-6 text-violet-950">
            Cheaper equivalent products and chain-available substitutes are suggested without rewriting the basket automatically.
          </p>
          <div className="mt-4 space-y-2">
            {smartSubstitutes.length > 0 ? smartSubstitutes.map((suggestion) => (
              <div className="rounded-2xl bg-white/80 p-3 text-sm" key={`${suggestion.productId}-${suggestion.substituteProductId}-${suggestion.reason}`}>
                <p className="font-black text-slate-950">{suggestion.substituteProductName}</p>
                <p className="mt-1 font-semibold text-slate-600">
                  Replace {suggestion.productName} at {suggestion.chainName}. {suggestion.reason === 'high_unit_price'
                    ? `Estimated unit saving ${suggestion.savingsLabel}.`
                    : 'This chain has the substitute when the selected item is unavailable.'}
                </p>
              </div>
            )) : (
              <p className="rounded-2xl bg-white/80 p-3 text-sm font-semibold text-slate-600">No cheaper equivalent or chain-available substitute found for the selected basket.</p>
            )}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">Chain totals and missing rows</p>
          <div className="mt-4 space-y-2">
            {chainTotals.map((chain) => (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3" key={chain.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-black text-slate-950">{chain.name}</p>
                  <p className="font-black text-slate-950">{formatSek(chain.total)}</p>
                </div>
                <p className={`mt-1 text-sm font-bold ${chain.complete ? 'text-emerald-800' : 'text-amber-800'}`}>
                  {chain.complete ? 'Full selected-basket coverage' : `${chain.missingCount} selected product${chain.missingCount === 1 ? '' : 's'} missing`}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-950">
            Source: {sourceLabel}. No state persistence, shopper profile, or retailer checkout handoff is performed on this calculator.
          </p>
        </div>
      </div>
    </section>
  );
}
