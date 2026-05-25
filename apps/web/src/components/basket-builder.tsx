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
};

export function BasketBuilder<T extends BasketBuilderProduct>({
  products,
}: BasketBuilderProps<T>) {
  const [basketProducts, setBasketProducts] = useState<T[]>([]);
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
