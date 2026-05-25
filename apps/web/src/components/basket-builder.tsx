/**
 * BasketBuilder renders a selectable product list and a running basket so shoppers can
 * add each product once while comparing candidate basket contents.
 *
 * @example
 * ```tsx
 * <BasketBuilder products={[{ id: "milk", name: "Milk", price: 18, packageText: "1 l", category: "dairy" }]} />
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
import { findCheaperBasketSubstitutions, type CheaperSubstitutionProduct } from "@/lib/deduplicate-products";
import { comparableUnitLabel } from "@/lib/normalization";

export type BasketBuilderProduct = CheaperSubstitutionProduct & {
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
  const suggestions = findCheaperBasketSubstitutions([...products], basketProducts);

  function add(product: T) {
    setBasketProducts((current) => addBasketBuilderProduct(current, product));
  }

  return (
    <section aria-label="Basket builder">
      <ul>
        {products.map((product) => (
          <li key={product.id}>
            <span>{product.name}</span>
            <span>
              {" "}
              {product.price.toLocaleString("sv-SE")} kr / {product.packageText}
            </span>
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

      {suggestions.length > 0 ? (
        <section aria-label="Cheaper substitution suggestions">
          <h2>Cheaper substitutions</h2>
          <ul>
            {suggestions.map((suggestion) => (
              <li key={`${suggestion.source.id}:${suggestion.substitute.id}`}>
                <span>
                  Swap {suggestion.source.name} for {suggestion.substitute.name}
                </span>
                <span>
                  {" "}
                  Save {suggestion.savingsPerUnit.toLocaleString("sv-SE")}{" "}
                  {comparableUnitLabel(suggestion.comparableUnit)} (
                  {suggestion.savingsPercent.toLocaleString("sv-SE")}%)
                </span>
                <span> - Review only, not auto-applied</span>
                <button type="button" onClick={() => add(suggestion.substitute)}>
                  Add substitute
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}

export default BasketBuilder;
