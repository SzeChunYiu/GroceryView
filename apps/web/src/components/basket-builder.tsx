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

export type BasketBuilderSwap = {
  id: string;
  name: string;
  reason?: string;
};

export type BasketBuilderProduct = {
  id: string;
  name: string;
  chainPrices?: BasketChainPrice[];
  dealStackOffers?: BasketStackOffer[];
  suggestedSwaps?: BasketBuilderSwap[];
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
  const suggestedSwaps = basketProducts.flatMap((product) =>
    (product.suggestedSwaps ?? []).map((swap) => ({
      ...swap,
      sourceProductId: product.id,
      sourceProductName: product.name,
    })),
  );

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

      <section aria-label="Selected basket items">
        <h2>Basket</h2>
        <ul>
          {basketProducts.map((product) => (
            <li key={product.id}>{product.name}</li>
          ))}
        </ul>
      </section>

      {suggestedSwaps.length > 0 ? (
        <section aria-label="Suggested basket swaps">
          <h2>Suggested swaps</h2>
          <p>Suggested swaps are shown after Add and never auto-replace a selected basket item.</p>
          <ul>
            {suggestedSwaps.map((swap) => (
              <li key={`${swap.sourceProductId}-${swap.id}`}>
                {swap.name} for {swap.sourceProductName}
                {swap.reason ? ` — ${swap.reason}` : ''}
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
