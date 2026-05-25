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

import { useMemo, useState } from "react";

import {
  buildBasketCouponStackOptimizer,
  type BasketChainPrice,
  type BasketStackOffer,
} from "@/lib/deal-context";
import { buildPantryDepletionSuggestions } from "@/lib/pantry";
import { buildSmartBasketSubstituteSuggestions, recurringBasketHistoryByProduct, type BasketSubstituteProduct } from "@/lib/recurring-basket";

export type BasketBuilderProduct = {
  id: string;
  name: string;
  categoryLabel?: string;
  chainPrices?: BasketChainPrice[];
  dealStackOffers?: BasketStackOffer[];
  dietaryTags?: readonly string[];
  estimatedDailyUse?: number;
  pantryAgeDays?: number;
  pantryQuantity?: number;
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

export type BasketBuilderProps<T extends BasketBuilderProduct> = {
  products: readonly T[];
  selectedDietaryFilters?: readonly string[];
  onSelectedDietaryFiltersChange?: (filters: string[]) => void;
};

export function BasketBuilder<T extends BasketBuilderProduct>({
  products,
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
  const basketProductIds = new Set(basketProducts.map((product) => product.id));
  const pantryDepletionSuggestions = buildPantryDepletionSuggestions(
    products
      .filter((product) => !basketProductIds.has(product.id))
      .map((product) => ({
        productId: product.id,
        productName: product.name,
        pantryQuantity: product.pantryQuantity,
        pantryAgeDays: product.pantryAgeDays,
        estimatedDailyUse: product.estimatedDailyUse,
        recurringPurchaseCount: recurringBasketHistoryByProduct[product.id]?.purchaseCount
      }))
  );

  function add(product: T) {
    setBasketProducts((current) => addBasketBuilderProduct(current, product));
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
        {filteredProducts.map((product) => (
          <li key={product.id}>
            <span>{product.name}</span>
            <button type="button" onClick={() => add(product)}>
              Add
            </button>
          </li>
        ))}
      </ul>
      {filteredProducts.length === 0 ? (
        <p>No products match the selected dietary filters.</p>
      ) : null}

      <h2>Basket</h2>
      <ul>
        {basketProducts.map((product) => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>

      {pantryDepletionSuggestions.length > 0 ? (
        <section aria-label="Pantry depletion suggestions">
          <h3>Pantry replenishment suggestions</h3>
          <ul>
            {pantryDepletionSuggestions.map((suggestion) => (
              <li key={suggestion.productId}>
                Add {suggestion.productName}: {suggestion.reason} ({suggestion.priority} priority).
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
