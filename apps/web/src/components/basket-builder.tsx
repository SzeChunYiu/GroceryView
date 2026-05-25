/**
 * BasketBuilder renders a selectable product list and a running basket so shoppers can
 * add each product once while comparing candidate basket contents.
 *
 * @example
 * ```tsx
 * <BasketBuilder products={[{ id: "milk", name: "Milk" }]} />
 * ```
 *
 * @param props - BasketBuilder component props.
 * @param props.products - Products available to add to the basket.
 *
 * | Prop | Type | Description |
 * | --- | --- | --- |
 * | `products` | `readonly T[]` | Products available to add to the basket. |
 */
"use client";

import { type KeyboardEvent, useMemo, useState } from "react";

import {
  buildBasketCouponStackOptimizer,
  type BasketChainPrice,
  type BasketStackOffer,
} from "@/lib/deal-context";
import { buildSmartBasketSubstituteSuggestions, type BasketSubstituteProduct } from "@/lib/recurring-basket";

export type BasketBuilderProduct = {
  id: string;
  name: string;
  categoryLabel?: string;
  chainPrices?: BasketChainPrice[];
  dealStackOffers?: BasketStackOffer[];
  dietaryTags?: readonly string[];
  lastPurchasedAt?: string;
  purchaseCount?: number;
  recommendationReasons?: readonly string[];
  shortcutLabel?: string;
  suggestedQuantity?: number;
};

export function addBasketBuilderProduct<T extends BasketBuilderProduct>(
  products: T[],
  product: T,
): T[] {
  if (products.some((current) => current.id === product.id)) {
    return products;
  }

  return [...products, product];
}

export function removeBasketBuilderProduct<T extends BasketBuilderProduct>(
  products: T[],
  productId: string,
): T[] {
  return products.filter((product) => product.id !== productId);
}

export type BasketBuilderProps<T extends BasketBuilderProduct> = {
  products: readonly T[];
  pastPurchaseShortcuts?: readonly T[];
  selectedDietaryFilters?: readonly string[];
  onSelectedDietaryFiltersChange?: (filters: string[]) => void;
};

export function BasketBuilder<T extends BasketBuilderProduct>({
  products,
  pastPurchaseShortcuts = [],
  selectedDietaryFilters,
  onSelectedDietaryFiltersChange,
}: BasketBuilderProps<T>) {
  const [basketProducts, setBasketProducts] = useState<T[]>([]);
  const [localDietaryFilters, setLocalDietaryFilters] = useState<string[]>([]);
  const availableDietaryTags = useMemo(
    () =>
      Array.from(new Set(products.flatMap((product) => product.dietaryTags ?? []))).sort(
        (first, second) => first.localeCompare(second),
      ),
    [products],
  );
  const activeDietaryFilters = selectedDietaryFilters ?? localDietaryFilters;
  const activeDietaryFilterSet = useMemo(
    () => new Set(activeDietaryFilters),
    [activeDietaryFilters],
  );
  const filteredProducts = useMemo(
    () =>
      activeDietaryFilters.length === 0
        ? products
        : products.filter((product) =>
            activeDietaryFilters.every((tag) => product.dietaryTags?.includes(tag)),
          ),
    [activeDietaryFilters, products],
  );
  const chainStacks = buildBasketCouponStackOptimizer({
    items: basketProducts,
    offers: basketProducts.flatMap((product) => product.dealStackOffers ?? []),
  });
  const bestChainStack = chainStacks[0];
  const substituteProducts: BasketSubstituteProduct[] = products.map((product) => ({
    productId: product.id,
    productName: product.name,
    categoryLabel: product.categoryLabel,
    prices: (product.chainPrices ?? []).map((price) => ({ chainName: price.chain, price: price.price }))
  }));
  const substituteChainNames = Array.from(new Set(substituteProducts.flatMap((product) => product.prices.map((price) => price.chainName))));
  const smartSubstitutes = buildSmartBasketSubstituteSuggestions({
    catalog: substituteProducts,
    items: basketProducts.map((product) => ({
      productId: product.id,
      productName: product.name,
      categoryLabel: product.categoryLabel,
      prices: (product.chainPrices ?? []).map((price) => ({ chainName: price.chain, price: price.price }))
    })),
    unavailableChainNames: substituteChainNames
  });

  function add(product: T) {
    setBasketProducts((current) => addBasketBuilderProduct(current, product));
  }

  function remove(product: T) {
    setBasketProducts((current) => removeBasketBuilderProduct(current, product.id));
  }

  function removeOnBackspace(event: KeyboardEvent<HTMLLIElement>, product: T) {
    if (event.key !== 'Backspace') return;

    event.preventDefault();
    if (window.confirm(`Remove ${product.name} from basket?`)) {
      remove(product);
    }
  }

  function recommendationReasonsFor(product: T) {
    const reasons = [...(product.recommendationReasons ?? [])];
    if ((product.purchaseCount ?? 0) > 1) {
      reasons.push('Frequently bought together from past baskets');
    }
    if (product.dietaryTags?.some((tag) => activeDietaryFilterSet.has(tag))) {
      reasons.push('Matches dietary preference');
    }
    if (product.dealStackOffers?.some((offer) => offer.amount > 0)) {
      reasons.push('Cheaper substitute when the eligible offer is stacked');
    }

    return [...new Set(reasons)].slice(0, 3);
  }

  function toggleDietaryFilter(tag: string) {
    const nextFilters = activeDietaryFilterSet.has(tag)
      ? activeDietaryFilters.filter((filter) => filter !== tag)
      : [...activeDietaryFilters, tag];

    if (selectedDietaryFilters === undefined) {
      setLocalDietaryFilters(nextFilters);
    }

    onSelectedDietaryFiltersChange?.(nextFilters);
  }

  return (
    <section aria-label="Basket builder">
      {pastPurchaseShortcuts.length > 0 ? (
        <section aria-label="Past purchase shortcuts">
          <h3>Past purchase shortcuts</h3>
          <p>Frequently purchased staples can be added with one tap before you build the rest of the basket.</p>
          <div>
            {pastPurchaseShortcuts.map((product) => (
              <button key={`shortcut-${product.id}`} type="button" onClick={() => add(product)}>
                Add {product.name}
                {product.shortcutLabel ? ` · ${product.shortcutLabel}` : ''}
                {recommendationReasonsFor(product).length > 0 ? ` · ${recommendationReasonsFor(product)[0]}` : ''}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {availableDietaryTags.length > 0 ? (
        <fieldset aria-label="Dietary filters">
          <legend>Dietary filters</legend>
          <div>
            {availableDietaryTags.map((tag) => (
              <label key={tag}>
                <input
                  checked={activeDietaryFilterSet.has(tag)}
                  name="basketDietaryFilters"
                  onChange={() => toggleDietaryFilter(tag)}
                  type="checkbox"
                  value={tag}
                />
                {tag}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <ul>
        {filteredProducts.map((product) => {
          const recommendationReasons = recommendationReasonsFor(product);
          return (
            <li key={product.id}>
              <span>{product.name}</span>
              <button type="button" onClick={() => add(product)}>
                Add
              </button>
              {recommendationReasons.length > 0 ? (
                <ul aria-label={`${product.name} recommendation reasons`}>
                  {recommendationReasons.map((reason) => <li key={reason}>{reason}</li>)}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
      {filteredProducts.length === 0 ? (
        <p>No products match the selected dietary filters.</p>
      ) : null}

      <h2>Basket</h2>
      <ul>
        {basketProducts.map((product) => (
          <li
            aria-label={`${product.name} basket row`}
            key={product.id}
            onKeyDown={(event) => removeOnBackspace(event, product)}
            tabIndex={0}
          >
            {product.name}
          </li>
        ))}
      </ul>

      {smartSubstitutes.length > 0 ? (
        <section aria-label="Smart substitute suggestions">
          <h3>Smart substitute suggestions</h3>
          <ul>
            {smartSubstitutes.map((suggestion) => (
              <li key={`${suggestion.productId}-${suggestion.substituteProductId}-${suggestion.reason}`}>
                Swap {suggestion.productName} for {suggestion.substituteProductName} at {suggestion.chainName}
                {suggestion.reason === 'high_unit_price'
                  ? ` to save ${suggestion.savingsLabel}`
                  : ' because the selected chain is missing the current item'}.
                <span> Reason: {suggestion.reason === 'high_unit_price' ? 'cheaper substitute' : 'store coverage substitute'}.</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {bestChainStack ? (
        <section aria-label="Cheapest coupon stack by chain">
          <h3>Cheapest valid coupon stack</h3>
          <p>
            {bestChainStack.chain}: {bestChainStack.totalLabel}
            {bestChainStack.savings > 0
              ? ` after ${bestChainStack.savingsLabel} in loyalty, coupon, and promotion savings`
              : " with no eligible stacked savings"}
          </p>
          <ul>
            {chainStacks.map((stack) => (
              <li key={stack.chain}>
                {stack.chain}: {stack.totalLabel} ({stack.savingsLabel} saved)
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}

export default BasketBuilder;
