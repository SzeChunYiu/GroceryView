'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { trackItemCardImpression } from '@/lib/analytics';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

export type LazyItemCardProps = {
  children: ReactNode;
  className: string;
  compareMode: string;
  href: string;
  itemId: string;
  itemName: string;
  listId: string;
  listIndex: number;
};

export function LazyItemCard({ children, className, compareMode, href, itemId, itemName, listId, listIndex }: Readonly<LazyItemCardProps>) {
  const hasTrackedImpression = useRef(false);
  const { isIntersecting, ref } = useIntersectionObserver<HTMLAnchorElement>({ freezeOnceVisible: true, rootMargin: '120px 0px', threshold: 0.4 });

  useEffect(() => {
    if (!isIntersecting || hasTrackedImpression.current) return;
    hasTrackedImpression.current = true;
    trackItemCardImpression({ compareMode, itemId, itemName, listId, listIndex });
  }, [compareMode, isIntersecting, itemId, itemName, listId, listIndex]);

  return <Link className={className} data-analytics-item-id={itemId} data-analytics-list-id={listId} href={href} ref={ref}>{children}</Link>;
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
  const measuredRows = useRef<Map<number, number>>(new Map());
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

  const measureRow = useCallback((rowIndex: number) => (node: HTMLDivElement | null) => {
    if (!node) return;
    const height = node.getBoundingClientRect().height + GRID_GAP;
    if (Math.abs((measuredRows.current.get(rowIndex) ?? 0) - height) > 1) {
      measuredRows.current.set(rowIndex, height);
      setMeasurementVersion((version) => version + 1);
    }
  }, []);

  return (
    <div className="relative mt-5" ref={containerRef} style={{ height: totalHeight }}>
      {visibleRows.map(({ offset, rowIndex }) => (
        <div className="absolute left-0 grid w-full gap-3 md:grid-cols-2 xl:grid-cols-3" key={rowIndex} ref={measureRow(rowIndex)} style={{ transform: `translateY(${offset}px)` }}>
          {products.slice(rowIndex * columns, rowIndex * columns + columns).map((product, productOffset) => (
            <LazyItemCard className="group rounded-2xl border border-violet-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-700" compareMode="products-grid" href={`/products/${product.slug}`} itemId={product.slug} itemName={product.name} key={product.slug} listId="products-grid" listIndex={rowIndex * columns + productOffset}>
              <div className="flex gap-3">
                {product.imageUrl ? <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white p-2 ring-1 ring-violet-100"><ResponsiveProductImage alt={`${product.name} product image`} className="max-h-full max-w-full object-contain transition group-hover:scale-105" height={80} sizes="(min-width: 1280px) 7vw, (min-width: 768px) 10vw, 80px" src={product.imageUrl} width={80} /></div> : null}
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
  );
}

export function ResponsiveProductImage({
  alt,
  className = 'max-h-full max-w-full object-contain',
  height,
  sizes,
  src,
  width
}: Readonly<{
  alt: string;
  className?: string;
  height: number;
  sizes: string;
  src?: string | null;
  width: number;
}>) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-center text-xs font-black text-slate-500">
        Image unavailable
      </div>
    );
  }

  return (
    <Image
      alt={alt}
      className={className}
      height={height}
      loading="lazy"
      onError={() => setFailed(true)}
      placeholder="empty"
      sizes={sizes}
      src={src}
      width={width}
    />
  );
}
