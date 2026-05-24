'use client';

import { useMemo, useState } from 'react';
import { compareBasketStrategies, summarizeStoreBasketCoverage } from '@groceryview/core';
import { BasketActions } from './basket-actions';
import { BasketTotals } from './basket-totals';

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

function initialBasketIds(products: BasketCalculatorProduct[]) {
  return new Set(products.slice(0, 4).map((product) => product.id));
}

export function BasketCalculator({ products, sourceLabel }: Readonly<BasketCalculatorProps>) {
  const [selectedProductIds, setSelectedProductIds] = useState(() => initialBasketIds(products));

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

  const assignments = comparison.cheapestByProduct.assignments.map((assignment) => {
    const product = selectedProducts.find((selectedProduct) => selectedProduct.id === assignment.productId);
    return {
      lineTotal: assignment.lineTotal,
      productId: assignment.productId,
      productName: product?.name ?? assignment.productId,
      productSlug: product?.slug ?? null,
      storeId: assignment.storeId,
      storeName: assignment.storeName,
      unitPrice: assignment.unitPrice
    };
  });

  function toggleProduct(productId: string) {
    setSelectedProductIds((current) => {
      const next = new Set(current);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }

  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <BasketActions
        onToggleProduct={toggleProduct}
        products={products}
        selectedProductCount={selectedProducts.length}
        selectedProductIds={selectedProductIds}
      />
      <BasketTotals
        assignments={assignments}
        bestFullChain={comparison.bestSingleStore ?? null}
        chainTotals={chainTotals}
        selectedProductCount={selectedProducts.length}
        sourceLabel={sourceLabel}
        splitStoreCount={comparison.splitStoreCount}
        splitTotal={comparison.cheapestByProduct.total}
      />
    </section>
  );
}
