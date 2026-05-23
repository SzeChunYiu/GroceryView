"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useHover } from "@/hooks/useHover";
import { QuickView } from "./QuickView";
import type { PricedProduct } from "@/lib/openprices-products";

type StoreSeed = {
  name: string;
  modifier: number;
};

const QUICK_VIEW_STORES: readonly StoreSeed[] = [
  { name: "Willys Odenplan", modifier: 0.98 },
  { name: "ICA Kvantum Liljeholmen", modifier: 1.02 },
  { name: "Coop Farsta", modifier: 1.07 },
  { name: "Hemköp Slussen", modifier: 0.93 },
  { name: "Lidl Gärdet", modifier: 1.09 },
  { name: "MatHem Kista", modifier: 1.01 },
];

function seededStores(product: PricedProduct) {
  const codeSeed = Number((product.code.match(/\d+/)?.[0] ?? "1").slice(0, 3)) || 1;
  const start = codeSeed % QUICK_VIEW_STORES.length;

  return QUICK_VIEW_STORES.slice(start, start + 3).map((store, index) => ({
    name: store.name,
    price: Math.max(product.priceMedian * (store.modifier + index * 0.015), 0.5),
  }));
}

export function ItemCard({ product }: Readonly<{ product: PricedProduct }>) {
  const { isHovering, hoverProps } = useHover({ delayMs: 300 });
  const storeRows = useMemo(() => seededStores(product), [product]);

  return (
    <div className="relative" {...hoverProps}>
      <Link
        href={`/products/${product.slug}`}
        className="grid grid-cols-[2.5fr_1fr_1fr_0.5fr] gap-3 rounded-md bg-white px-4 py-3 text-sm transition hover:bg-market-oat/60"
      >
        <span className="min-w-0 font-semibold">{product.name}</span>
        <span className="truncate text-market-ink/65">{product.brands || product.code}</span>
        <span className="font-bold">SEK {product.priceMedian.toFixed(2)}</span>
        <span className="text-right text-xs text-market-ink/45">{product.observationCount} obs</span>
      </Link>
      {isHovering ? (
        <QuickView
          productName={product.name}
          medianPrice={product.priceMedian}
          observations={product.observations}
          stores={storeRows}
        />
      ) : null}
    </div>
  );
}
