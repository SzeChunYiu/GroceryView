import type { MouseEventHandler, ReactNode } from "react";

import { getStockConfidence, type StockConfidenceInput } from "../lib/freshness";

export interface StoreProductRowProduct {
  id?: string | number;
  name: string;
  brand?: string | null;
  price?: number | string | null;
  size?: string | null;
  imageUrl?: string | null;
  inStock?: boolean | null;
  stockStatus?: string | null;
  lastObservedAt?: StockConfidenceInput["lastObservedAt"];
  stockLastObservedAt?: StockConfidenceInput["lastObservedAt"];
  source?: string | null;
  sourceReliability?: StockConfidenceInput["sourceReliability"];
}

export interface StoreProductRowProps {
  product: StoreProductRowProduct;
  action?: ReactNode;
  className?: string;
  now?: Date;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

function formatPrice(price: StoreProductRowProduct["price"]): string | null {
  if (price === null || price === undefined || price === "") {
    return null;
  }

  if (typeof price === "number") {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price);
  }

  return price;
}

function getStockText(product: StoreProductRowProduct): string {
  if (product.stockStatus) {
    return product.stockStatus;
  }

  if (product.inStock === true) {
    return "In stock";
  }

  if (product.inStock === false) {
    return "Out of stock";
  }

  return "Stock unknown";
}

export function StoreProductRow({ product, action, className = "", now, onClick }: StoreProductRowProps) {
  const confidence = getStockConfidence({
    lastObservedAt: product.stockLastObservedAt ?? product.lastObservedAt,
    source: product.source,
    sourceReliability: product.sourceReliability,
    now,
  });
  const price = formatPrice(product.price);

  return (
    <div
      className={`store-product-row flex items-center gap-3 rounded-md border border-slate-200 bg-white p-3 ${className}`.trim()}
      onClick={onClick}
    >
      {product.imageUrl ? (
        <img className="h-12 w-12 rounded object-cover" src={product.imageUrl} alt="" loading="lazy" />
      ) : null}

      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-slate-900">{product.name}</div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
          {product.brand ? <span>{product.brand}</span> : null}
          {product.size ? <span>{product.size}</span> : null}
          {price ? <span>{price}</span> : null}
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-700" title={confidence.description}>
        <span aria-label={confidence.label} role="img">
          {confidence.icon}
        </span>
        <span>{getStockText(product)}</span>
      </div>

      {action}
    </div>
  );
}

export default StoreProductRow;
