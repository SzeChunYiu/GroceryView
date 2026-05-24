'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type ProductGridPrice = {
  chain: string;
  priceText: string;
};

export type ProductGridRow = {
  slug: string;
  name: string;
  brand: string;
  subline: string;
  spreadText: string;
  prices: ProductGridPrice[];
};

type VirtualizedProductGridProps = {
  rows: ProductGridRow[];
};

const PAGE_SIZE = 24;
const ROW_HEIGHT = 244;
const OVERSCAN_ROWS = 4;

export function VirtualizedProductGrid({ rows }: VirtualizedProductGridProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [loadedCount, setLoadedCount] = useState(() => Math.min(PAGE_SIZE, rows.length));
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(ROW_HEIGHT * 4);

  useEffect(() => {
    setLoadedCount((current) => Math.min(Math.max(PAGE_SIZE, Math.min(current, rows.length)), rows.length));
  }, [rows.length]);

  const loadNextPage = useCallback(() => {
    setLoadedCount((current) => Math.min(current + PAGE_SIZE, rows.length));
  }, [rows.length]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const sentinel = sentinelRef.current;
    if (!viewport || !sentinel || loadedCount >= rows.length) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        loadNextPage();
      }
    }, {
      root: viewport,
      rootMargin: '320px 0px',
      threshold: 0
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadNextPage, loadedCount, rows.length]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const updateHeight = () => setViewportHeight(viewport.clientHeight || ROW_HEIGHT * 4);
    updateHeight();

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(updateHeight);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  const visibleWindow = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN_ROWS);
    const endIndex = Math.min(
      loadedCount,
      Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN_ROWS
    );

    return {
      startIndex,
      visibleRows: rows.slice(startIndex, endIndex)
    };
  }, [loadedCount, rows, scrollTop, viewportHeight]);

  if (rows.length === 0) {
    return (
      <p className="rounded-3xl border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm">
        No comparable products are available yet.
      </p>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm" aria-label="Virtualized product comparison results">
      <div className="flex flex-col gap-2 px-2 py-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-950">Matched product results</h2>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            Virtualized list with cursor pagination for dense compare sessions.
          </p>
        </div>
        <p className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-950">
          Showing {loadedCount.toLocaleString('sv-SE')} of {rows.length.toLocaleString('sv-SE')}
        </p>
      </div>
      <div
        className="h-[42rem] overflow-y-auto pr-2"
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
        ref={viewportRef}
      >
        <div className="relative" style={{ height: loadedCount * ROW_HEIGHT }}>
          {visibleWindow.visibleRows.map((product, index) => (
            <article
              className="absolute left-0 right-0 px-1 py-2"
              key={product.slug}
              style={{ height: ROW_HEIGHT, transform: `translateY(${(visibleWindow.startIndex + index) * ROW_HEIGHT}px)` }}
            >
              <div className="h-full rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-center">
                  <div>
                    <Link className="text-xl font-black text-slate-950 hover:text-emerald-800" href={`/products/${product.slug}`}>{product.name}</Link>
                    <p className="text-sm text-slate-600">{product.brand} · {product.subline}</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {product.prices.map((row) => (
                      <p className="rounded-2xl bg-slate-50 p-3 font-black capitalize" key={`${product.slug}-${row.chain}`}>{row.chain}: {row.priceText}</p>
                    ))}
                  </div>
                  <p className="rounded-full bg-emerald-100 px-4 py-2 text-center font-black text-emerald-950">{product.spreadText}</p>
                </div>
              </div>
            </article>
          ))}
          {loadedCount < rows.length ? (
            <div
              aria-hidden="true"
              className="absolute left-0 right-0 h-px"
              ref={sentinelRef}
              style={{ transform: `translateY(${Math.max(0, loadedCount * ROW_HEIGHT - 1)}px)` }}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
