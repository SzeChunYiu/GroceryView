'use client';

import Image from 'next/image';
import Link from 'next/link';
import { memo } from 'react';
import { QuickView, type QuickViewData } from '@/components/QuickView';
import { useHover } from '@/hooks/useHover';

type ItemCardBase = {
  slug: string;
  name: string;
  brand: string;
  categoryLabel: string;
  cheapestPriceLabel: string;
  unitPriceLabel: string;
  chainLabel: string;
  sourceTables: string[];
  isAvailable: boolean;
  imageUrl?: string | null;
  hasSparkline: boolean;
};

type ItemCardProps = Readonly<{
  card: ItemCardBase;
  quickView?: QuickViewData;
  dataProduct?: string;
}>

export const ItemCard = memo(function ItemCard({ card, quickView, dataProduct }: ItemCardProps) {
  const { hovered, enabled, onPointerEnter, onPointerLeave, onFocus, onBlur } = useHover();

  return (
    <div className="relative">
      <Link
        className="group block rounded-2xl border border-violet-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-700"
        data-product-slug={dataProduct}
        href={`/products/${card.slug}`}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onFocus={onFocus}
        onBlur={onBlur}
      >
        <div className="flex gap-3">
          {card.imageUrl ? (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white p-2 ring-1 ring-violet-100">
              <Image
                alt={`${card.name} product image`}
                className="max-h-full max-w-full object-contain transition group-hover:scale-105"
                height={80}
                sizes="80px"
                src={card.imageUrl}
                width={80}
              />
            </div>
          ) : null}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">{card.brand}</p>
              {card.isAvailable === false ? (
                <span className="rounded-full bg-rose-100 px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.14em] text-rose-900">Out of stock</span>
              ) : null}
            </div>
            <h3 className="mt-1 text-lg font-black text-slate-950">{card.name}</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">{card.categoryLabel}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 text-xs font-black text-slate-700">
          <p>{card.cheapestPriceLabel} · {card.unitPriceLabel}</p>
          <p>{card.chainLabel}</p>
          <p className="text-violet-800">sourceTables: {card.sourceTables.join(' · ')}</p>
        </div>
      </Link>
      {enabled && quickView && hovered ? (
        <div className="pointer-events-none absolute left-full top-1/2 z-20 ml-2 -translate-y-1/2">
          <QuickView
            points={quickView.points}
            sparklineLabel={quickView.sparklineLabel}
            stores={quickView.stores}
            title={quickView.title}
          />
        </div>
      ) : null}
      <p className="sr-only" aria-live="polite">{card.hasSparkline ? 'Quick view available after 300 ms hover on desktop.' : 'Quick view overlay not available.'}</p>
    </div>
  );
});
