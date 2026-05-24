'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { compareBasketStrategies, summarizeStoreBasketCoverage } from '@groceryview/core';

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
};

function formatSek(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value)
    ? new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value)
    : 'Not priced';
}

function initialBasketIds(products: BasketCalculatorProduct[]) {
  return new Set(products.slice(0, 4).map((product) => product.id));
}

export function BasketCalculator({ products, sourceLabel }: Readonly<BasketCalculatorProps>) {
  const [selectedProductIds, setSelectedProductIds] = useState(() => initialBasketIds(products));
  const [sharedListError, setSharedListError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedItems = params.get('items');
    if (sharedItems === null) return;

    const productIds = new Set(products.map((product) => product.id));
    const validSharedIds = sharedItems
      .split(',')
      .map((item) => item.trim())
      .filter((item) => productIds.has(item));

    setSelectedProductIds(new Set(validSharedIds));
    setSharedListError(validSharedIds.length === 0
      ? 'This shared basket link has no valid product ids. Select at least one product to calculate cheapest sources.'
      : '');
  }, [products]);

  const selectedProducts = useMemo(
    () => products.filter((product) => selectedProductIds.has(product.id)),
    [products, selectedProductIds]
  );

  const shareHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set('items', [...selectedProductIds].sort().join(','));
    return `/basket?${params.toString()}`;
  }, [selectedProductIds]);

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

  function toggleProduct(productId: string) {
    setSharedListError('');
    setSelectedProductIds((current) => {
      const next = new Set(current);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
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

        {selectedProducts.length === 0 || sharedListError ? (
          <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm font-black text-amber-950" data-testid="basket-selection-error" role="alert">
            {sharedListError || 'Select at least one product to calculate cheapest sources for the shopping list.'}
          </p>
        ) : null}

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
                  <img
                    alt=""
                    className="h-14 w-14 rounded-xl object-contain"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    src={product.image}
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
          <div className="mt-4 rounded-2xl border border-emerald-100 bg-white/80 p-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Share this shopping list</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                aria-label="Share basket link URL"
                className="min-w-0 flex-1 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-950"
                readOnly
                value={shareHref}
              />
              <Link
                className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-4 py-2 text-sm font-black text-white"
                data-testid="share-basket-link"
                href={shareHref}
              >
                Share basket link
              </Link>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {assignmentsWithProducts.length > 0 ? assignmentsWithProducts.map((assignment) => (
              <Link
                className="grid gap-2 rounded-2xl bg-slate-50 p-3 text-sm hover:bg-emerald-50 sm:grid-cols-[1fr_auto]"
                data-testid="cheapest-source-row"
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
