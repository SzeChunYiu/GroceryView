'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { trackItemCardImpression } from '@/lib/analytics';
import { rememberRecentlyViewedProduct, type RecentlyViewedProductInput } from '@/lib/personalization';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { dataGridVirtualStatusClass } from '@/components/data-grid';

export type LazyItemCardProps = {
  children: ReactNode;
  className: string;
  compareMode: string;
  href: string;
  itemId: string;
  itemName: string;
  linkRef?: (node: HTMLAnchorElement | null) => void;
  listId: string;
  listIndex: number;
  recentlyViewedProduct?: RecentlyViewedProductInput;
};

export function LazyItemCard({ children, className, compareMode, href, itemId, itemName, linkRef, listId, listIndex, recentlyViewedProduct }: Readonly<LazyItemCardProps>) {
  const hasTrackedImpression = useRef(false);
  const { isIntersecting, ref } = useIntersectionObserver<HTMLAnchorElement>({ freezeOnceVisible: true, rootMargin: '120px 0px', threshold: 0.4 });
  const combinedRef = useCallback((node: HTMLAnchorElement | null) => {
    ref(node);
    linkRef?.(node);
  }, [linkRef, ref]);

  useEffect(() => {
    if (!isIntersecting || hasTrackedImpression.current) return;
    hasTrackedImpression.current = true;
    trackItemCardImpression({ compareMode, itemId, itemName, listId, listIndex });
  }, [compareMode, isIntersecting, itemId, itemName, listId, listIndex]);

  function rememberView() {
    if (recentlyViewedProduct) rememberRecentlyViewedProduct({ ...recentlyViewedProduct, href });
  }

  return <Link className={className} data-analytics-item-id={itemId} data-analytics-list-id={listId} data-recently-viewed-product={recentlyViewedProduct ? itemId : undefined} href={href} onClick={rememberView} ref={combinedRef}>{children}</Link>;
}

type VirtualizedProduct = {
  allergenRiskBadges: { label: string; matchedTerms: string[] }[];
  brand: string;
  categoryLabel: string;
  chainLabel: string;
  cheapestPriceLabel: string;
  imageUrl?: string | null;
  isAvailable?: boolean;
  name: string;
  slug: string;
  sourceTables: string[];
  unitPriceLabel: string;
};

const ESTIMATED_ROW_HEIGHT = 236;
const GRID_GAP = 12;

export function VirtualizedProductGrid({ products }: Readonly<{ products: VirtualizedProduct[] }>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const productRefs = useRef<Map<number, HTMLAnchorElement>>(new Map());
  const measuredRows = useRef<Map<number, number>>(new Map());
  const [activeIndex, setActiveIndex] = useState(0);
  const [columns, setColumns] = useState(1);
  const [containerTop, setContainerTop] = useState(0);
  const [viewport, setViewport] = useState({ height: 900, scrollY: 0 });
  const [measurementVersion, setMeasurementVersion] = useState(0);

  useEffect(() => {
    const updateViewport = () => setViewport({ height: window.innerHeight || 900, scrollY: window.scrollY || 0 });
    updateViewport();
    window.addEventListener('resize', updateViewport);
    window.addEventListener('scroll', updateViewport, { passive: true });
    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('scroll', updateViewport);
    };
  }, []);

  useEffect(() => {
    const target = containerRef.current;
    if (!target) return undefined;
    const updateLayout = () => {
      const rect = target.getBoundingClientRect();
      const width = rect.width;
      setContainerTop(rect.top + window.scrollY);
      setColumns(width >= 1280 ? 3 : width >= 768 ? 2 : 1);
    };
    updateLayout();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(updateLayout);
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const rowCount = Math.ceil(products.length / columns);
  const rowOffsets = useMemo(() => {
    let offset = 0;
    return Array.from({ length: rowCount }, (_, rowIndex) => {
      const current = offset;
      offset += measuredRows.current.get(rowIndex) ?? ESTIMATED_ROW_HEIGHT;
      return current;
    });
  }, [measurementVersion, rowCount]);
  const totalHeight = rowOffsets[rowCount - 1] + (measuredRows.current.get(rowCount - 1) ?? ESTIMATED_ROW_HEIGHT) || 0;
  const viewportTop = Math.max(0, viewport.scrollY - containerTop - 480);
  const viewportBottom = viewport.scrollY - containerTop + viewport.height + 480;
  const visibleRows = rowOffsets
    .map((offset, rowIndex) => ({ offset, rowIndex }))
    .filter(({ offset, rowIndex }) => offset <= viewportBottom && offset + (measuredRows.current.get(rowIndex) ?? ESTIMATED_ROW_HEIGHT) >= viewportTop);

  const activeRow = products.length > 0 ? Math.floor(activeIndex / columns) : -1;
  const renderedRows = activeRow < 0 || visibleRows.some((row) => row.rowIndex === activeRow)
    ? visibleRows
    : [...visibleRows, { offset: rowOffsets[activeRow] ?? 0, rowIndex: activeRow }].sort((left, right) => left.rowIndex - right.rowIndex);

  const measureRow = useCallback((rowIndex: number) => (node: HTMLDivElement | null) => {
    if (!node) return;
    const height = node.getBoundingClientRect().height + GRID_GAP;
    if (Math.abs((measuredRows.current.get(rowIndex) ?? 0) - height) > 1) {
      measuredRows.current.set(rowIndex, height);
      setMeasurementVersion((version) => version + 1);
    }
  }, []);

  const focusProduct = useCallback((nextIndex: number) => {
    const boundedIndex = Math.max(0, Math.min(products.length - 1, nextIndex));
    if (products.length === 0) return;
    setActiveIndex(boundedIndex);
    const rowTop = rowOffsets[Math.floor(boundedIndex / columns)] ?? 0;
    window.scrollTo({ top: containerTop + Math.max(0, rowTop - 120), behavior: 'smooth' });
    window.requestAnimationFrame(() => productRefs.current.get(boundedIndex)?.focus());
  }, [columns, containerTop, products.length, rowOffsets]);

  const onGridKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'End', 'Home'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') focusProduct(0);
    else if (event.key === 'End') focusProduct(products.length - 1);
    else if (event.key === 'ArrowLeft') focusProduct(activeIndex - 1);
    else if (event.key === 'ArrowRight') focusProduct(activeIndex + 1);
    else if (event.key === 'ArrowUp') focusProduct(activeIndex - columns);
    else focusProduct(activeIndex + columns);
  }, [activeIndex, columns, focusProduct, products.length]);

  return (
    <>
      <p className={dataGridVirtualStatusClass}>Use Tab or arrow keys to move through {products.length.toLocaleString('sv-SE')} virtualized product cards.</p>
      <div aria-label="Virtualized product results" className="relative mt-5 focus:outline-none" onKeyDown={onGridKeyDown} ref={containerRef} role="list" style={{ height: totalHeight }} tabIndex={0}>
      {renderedRows.map(({ offset, rowIndex }) => (
        <div className="absolute left-0 grid w-full gap-3 md:grid-cols-2 xl:grid-cols-3" key={rowIndex} ref={measureRow(rowIndex)} style={{ transform: `translateY(${offset}px)` }}>
          {products.slice(rowIndex * columns, rowIndex * columns + columns).map((product, productOffset) => (
            <LazyItemCard className="group rounded-2xl border border-violet-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-700 focus:outline-none focus:ring-4 focus:ring-violet-300" compareMode="products-grid" href={`/products/${product.slug}`} itemId={product.slug} itemName={product.name} key={product.slug} linkRef={(node) => {
              const index = rowIndex * columns + productOffset;
              if (node) productRefs.current.set(index, node);
              else productRefs.current.delete(index);
            }} listId="products-grid" listIndex={rowIndex * columns + productOffset} recentlyViewedProduct={{
              slug: product.slug,
              name: product.name,
              brand: product.brand,
              imageUrl: product.imageUrl,
              priceLabel: product.cheapestPriceLabel,
              sourceLabel: product.sourceTables.join(' + ')
            }}>
              <div className="flex gap-3">
                {product.imageUrl ? <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white p-2 ring-1 ring-violet-100"><Image alt={`${product.name} product image`} className="max-h-full max-w-full object-contain transition group-hover:scale-105" height={80} loading="lazy" placeholder="empty" sizes="80px" src={product.imageUrl} width={80} /></div> : null}
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">{product.brand}</p>
                    {product.allergenRiskBadges.map((badge) => <span className="rounded-full bg-amber-100 px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.14em] text-amber-900" key={badge.label} title={"Matched: " + badge.matchedTerms.join(', ')}>{badge.label}</span>)}
                    {product.isAvailable === false ? <span className="rounded-full bg-rose-100 px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.14em] text-rose-900">Out of stock</span> : null}
                  </div>
                  <h3 className="mt-1 text-lg font-black text-slate-950">{product.name}</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{product.categoryLabel}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2 text-xs font-black text-slate-700">
                <p>{product.cheapestPriceLabel} · {product.unitPriceLabel}</p>
                <p>{product.chainLabel}</p>
                <p className="text-violet-800">sourceTables: {product.sourceTables.join(' · ')}</p>
              </div>
            </LazyItemCard>
          ))}
        </div>
      ))}
      </div>
    </>
  );
}
