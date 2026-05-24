"use client";

import { BasketRow } from "./basket-row";
import type { BasketBuilderProduct } from "./basket-builder";

export type BasketActionsProps<T extends BasketBuilderProduct> = {
  products: readonly T[];
  onAdd: (product: T) => void;
};

export function BasketActions<T extends BasketBuilderProduct>({
  products,
  onAdd,
}: BasketActionsProps<T>) {
  return (
    <ul>
      {products.map((product) => (
        <BasketRow key={product.id} product={product} onAdd={onAdd} />
      ))}
    </ul>
  );
}

export default BasketActions;
