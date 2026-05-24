'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

export type ProductGridRow = {
  slug: string;
  name: string;
  brand: string;
  imageUrl?: string | null;
  isAvailable?: boolean;
  categoryLabel: string;
  cheapestPriceLabel: string;
  unitPriceLabel: string;
  chainLabel: string;
  sourceTables: readonly string[];
};

type VirtualizedProductGridProps = {
  rows: readonly ProductGridRow[];
};

const ROW_HEIGHT = 304;
const ROW_GAP = 12;
const OVERSCAN_ROWS = 3;

function getColumnCount(width: number) {
  if (width >= 1050) return 3;
  if (width >= 680) return 2;
  return 1;
}

export function VirtualizedProductGrid({ rows }: VirtualizedProductGridProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(ROW_HEIGHT * 3);
  const [viewportWidth, setViewportWidth] = useState(0);
  const columnCount = getColumnCount(viewportWidth);
  const rowStride = ROW_HEIGHT + ROW_GAP;
  const totalRows = Math.ceil(rows.length / columnCount);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const updateMetrics = () => {
      setViewportHeight(viewport.clientHeight || ROW_HEIGHT * 3);
      setViewportWidth(viewport.clientWidth);
    };

    updateMetrics();

    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(updateMetrics);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  const visibleRows = useMemo(() => {
    const startRow = Math.max(0, Math.floor(scrollTop / rowStride) - OVERSCAN_ROWS);
    const endRow = Math.min(totalRows, Math.ceil((scrollTop + viewportHeight) / rowStride) + OVERSCAN_ROWS);
    return Array.from({ length: Math.max(0, endRow - startRow) }, (_, index) => startRow + index);
  }, [rowStride, scrollTop, totalRows, viewportHeight]);

  if (rows.length === 0) {
    return (
      <p className="mt-5 rounded-3xl border border-violet-100 bg-white p-5 text-sm font-black text-violet-900 shadow-sm">
        No instant products match the current filters.
      </p>
    );
  }

  return (
    <section aria-label="Virtualized product search results" className="mt-5 rounded-3xl border border-violet-100 bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-2 px-2 py-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-950">Instant product results</h2>
          <p className="mt-1 text-sm font-semibold text-slate-600">Virtual scrolling keeps large catalog filters smooth while rendering only the visible cards.</p>
        </div>
        <p className="rounded-full bg-violet-100 px-4 py-2 text-sm font-black text-violet-950">
          {rows.length.toLocaleString('sv-SE')} products
        </p>
      </div>
      <div
        className="h-[42rem] overflow-y-auto pr-2"
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
        ref={viewportRef}
      >
        <div className="relative" style={{ height: Math.max(ROW_HEIGHT, totalRows * rowStride - ROW_GAP) }}>
          {visibleRows.map((rowIndex) => {
            const rowProducts = rows.slice(rowIndex * columnCount, rowIndex * columnCount + columnCount);

            return (
              <div
                className="absolute left-0 right-0 grid gap-3"
                key={rowIndex}
                style={{
                  gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                  height: ROW_HEIGHT,
                  transform: `translateY(${rowIndex * rowStride}px)`
                }}
              >
                {rowProducts.map((product) => (
                  <Link
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-violet-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-700"
                    href={`/products/${product.slug}`}
                    key={product.slug}
                  >
                    <div className="flex gap-3">
                      {product.imageUrl ? (
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white p-2 ring-1 ring-violet-100">
                          <Image alt={`${product.name} product image`} className="max-h-full max-w-full object-contain transition group-hover:scale-105" height={80} sizes="80px" src={product.imageUrl} width={80} />
                        </div>
                      ) : null}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">{product.brand}</p>
                          {product.isAvailable === false ? (
                            <span className="rounded-full bg-rose-100 px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.14em] text-rose-900">Out of stock</span>
                          ) : null}
                        </div>
                        <h3 className="mt-1 line-clamp-2 text-lg font-black text-slate-950">{product.name}</h3>
                        <p className="mt-1 text-xs font-semibold text-slate-500">{product.categoryLabel}</p>
                      </div>
                    </div>
                    <div className="mt-4 grid flex-1 content-start gap-2 text-xs font-black text-slate-700">
                      <p>{product.cheapestPriceLabel} · {product.unitPriceLabel}</p>
                      <p>{product.chainLabel}</p>
                      <p className="text-violet-800">sourceTables: {product.sourceTables.join(' · ')}</p>
                    </div>
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
