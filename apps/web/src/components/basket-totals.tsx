"use client";

import type { BasketBuilderProduct } from "./basket-builder";

export type BasketTotalsProps<T extends BasketBuilderProduct> = {
  products: readonly T[];
};

export function BasketTotals<T extends BasketBuilderProduct>({
  products,
}: BasketTotalsProps<T>) {
  return (
    <>
      <h2>Basket</h2>
      <ul>
        {products.map((product) => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>
    </>
  );
}

export default BasketTotals;
