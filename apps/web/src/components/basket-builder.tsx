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
import { BasketRow } from "./basket-row";
import { BasketTotals } from "./basket-totals";

export type BasketBuilderProduct = {
  id: string;
  name: string;
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

  function add(product: T) {
    setBasketProducts((current) => addBasketBuilderProduct(current, product));
  }

  return (
    <section aria-label="Basket builder">
      <ul>
        {products.map((product) => (
          <BasketRow key={product.id} product={product} onAdd={add} />
        ))}
      </ul>

      <BasketTotals products={basketProducts} />
    </section>
  );
}

export default BasketBuilder;
