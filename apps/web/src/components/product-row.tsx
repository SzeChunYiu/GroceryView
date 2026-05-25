/**
 * Renders a store-scoped product row with stock freshness voting, source discrepancy reporting,
 * and optional product, store, price, and freshness metadata.
 *
 * @example
 * ```tsx
 * <ProductRow
 *   productId="milk-1l"
 *   productName="Milk 1L"
 *   storeId="store-123"
 *   storeName="ICA Nara"
 *   priceLabel="18.90 kr"
 * />
 * ```
 * @param props.productId Stable product identifier used for review submissions and row metadata.
 * @param props.storeId Stable store identifier used for freshness and discrepancy submissions.
 * @param props.productName Display name for the product row and review summary lookup.
 * @param props.storeName Optional store display name shown under the product title.
 * @param props.priceLabel Optional formatted price label used for display and discrepancy evidence.
 * @param props.shelfLifeDays Optional initial shelf-life estimate shown in the freshness input.
 * @param props.stockObservedAt Optional timestamp for the latest stock observation.
 * @param props.stockStatus Optional stock freshness status override.
 * @param props.className Optional class names applied to the row container.
 */
"use client";

import { StoreProductRow, type StoreProductRowProps } from "./store-product-row";

export interface ProductRowProps extends StoreProductRowProps {}

export function ProductRow(props: ProductRowProps) {
  return <StoreProductRow {...props} />;
}

export default ProductRow;
