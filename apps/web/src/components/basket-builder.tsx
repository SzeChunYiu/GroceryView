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

import { useState } from "react";
import { rankSubstitutionsForBasket } from "../lib/substitution-ranker";

import {
  buildBasketCouponStackOptimizer,
  type BasketChainPrice,
  type BasketStackOffer,
} from "@/lib/deal-context";

export type BasketBuilderProduct = {
  id: string;
  name: string;
  chainPrices?: BasketChainPrice[];
  dealStackOffers?: BasketStackOffer[];
  category?: string | null;
  unitPrice?: number | null;
  unitPriceUnit?: string | null;
  dietaryTags?: readonly string[] | null;
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
};

export function BasketBuilder<T extends BasketBuilderProduct>({
  products,
  selectedDietaryFilters = [],
}: BasketBuilderProps<T>) {
  const [basketProducts, setBasketProducts] = useState<T[]>([]);
  const chainStacks = buildBasketCouponStackOptimizer({
    items: basketProducts,
    offers: basketProducts.flatMap((product) => product.dealStackOffers ?? []),
  });
  const bestChainStack = chainStacks[0];
  const substitutionSuggestions = rankSubstitutionsForBasket({
    basketItems: basketProducts,
    candidates: products,
    selectedDietaryFilters,
  });

  function add(product: T) {
    setBasketProducts((current) => addBasketBuilderProduct(current, product));
  }

  return (
    <section aria-label="Basket builder">
      <ul>
        {products.map((product) => (
          <li key={product.id}>
            <span>{product.name}</span>
            <button type="button" onClick={() => add(product)}>
              Add
            </button>
          </li>
        ))}
      </ul>

      <h2>Basket</h2>
      <ul>
        {basketProducts.map((product) => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>

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

      {substitutionSuggestions.length > 0 ? (
        <section aria-label="Substitution suggestions">
          <h3>Suggested swaps</h3>
          <ul aria-label="Substitution suggestions">
            {substitutionSuggestions.map((suggestion) => (
              <li key={suggestion.item.id}>
                <span>{suggestion.item.name}</span>
                <ul>
                  {suggestion.substitutions.map((substitution) => (
                    <li key={substitution.product.id}>
                      <span>{substitution.product.name}</span>
                      <span>
                        {" "}
                        saves{" "}
                        {substitution.savingsPerUnit.toLocaleString("sv-SE", {
                          maximumFractionDigits: 2,
                        })}{" "}
                        kr/{substitution.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}

export default BasketBuilder;
