"use client";

import type { BasketBuilderProduct } from "./basket-builder";

export type BasketRowProps<T extends BasketBuilderProduct> = {
  product: T;
  onAdd: (product: T) => void;
};

export function BasketRow<T extends BasketBuilderProduct>({
  product,
  onAdd,
}: BasketRowProps<T>) {
  return (
    <li>
      <span>{product.name}</span>
      <button type="button" onClick={() => onAdd(product)}>
        Add
      </button>
    </li>
  );
}

export default BasketRow;
