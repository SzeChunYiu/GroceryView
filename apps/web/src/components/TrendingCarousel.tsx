'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, History } from 'lucide-react';
import type { TrendingProductPriceChange } from '@groceryview/db';
import {
  getHiddenRecommendationProductSlugs,
  hiddenRecommendationPreferenceEvent,
  hideRecommendationProduct,
  productMatchesHiddenRecommendationPreference,
  restoreRecommendationProduct
} from '@/lib/user-preferences';

export type PreferenceAwareProductCard = Readonly<{
  id: string;
  productSlug: string;
  href: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  metric: string;
  detail: string;
}>;

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  }).format(value);
}

function formatPercent(value: number) {
  return `${value > 0 ? '+' : ''}${new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 1 }).format(value)}%`;
}

export function TrendingCarousel({ items }: Readonly<{ items: TrendingProductPriceChange[] }>) {
  const [hiddenSlugs, setHiddenSlugs] = useHiddenRecommendationProductSlugs();

  if (items.length === 0) return null;

  const visibleItems = items.filter((item) => !productMatchesHiddenRecommendationPreference(item, hiddenSlugs));
  const hiddenItems = items.filter((item) => productMatchesHiddenRecommendationPreference(item, hiddenSlugs));

  return (
    <section className="mt-6 rounded-[1.75rem] border border-cyan-200 bg-white/90 p-5 shadow-sm" aria-label="Trending products">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-800">Trending products</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Most price changes in the last 7 days</h2>
        </div>
        <p className="max-w-2xl text-sm font-semibold leading-6 text-slate-600">
          Ranked from dated price observations with the packages/db time-series summarizer; equal prices and missing history do not create changes.
        </p>
      </div>
      <HiddenPreferenceRestoreBar hiddenItems={hiddenItems} labelFor={(item) => item.productName} />
      <div className="mt-5 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory" data-trending-carousel>
        {visibleItems.map((item) => {
          const isDrop = item.changeAmount < 0;
          const TrendIcon = isDrop ? ArrowDownRight : ArrowUpRight;
          return (
            <article
              className="min-w-[17rem] max-w-[17rem] snap-start rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-cyan-700"
              data-trending-product-rank={item.rank}
              key={item.productSlug}
            >
              <Link href={`/products/${item.productSlug}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-800">#{item.rank} · {item.categoryLabel ?? 'Grocery'}</p>
                    <h3 className="mt-2 line-clamp-2 text-lg font-black leading-6 text-slate-950">{item.productName}</h3>
                    <p className="mt-1 line-clamp-1 text-sm font-semibold text-slate-600">{item.brand ?? 'Brand not reported'}</p>
                  </div>
                  <span className={`rounded-full p-2 ${isDrop ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`} aria-label={isDrop ? 'Price drop' : 'Price increase'}>
                    <TrendIcon aria-hidden="true" size={20} strokeWidth={3} />
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs font-bold text-slate-500">Latest</p>
                    <p className="mt-1 text-lg font-black text-slate-950">{formatMoney(item.latestPrice, item.currency)}</p>
                  </div>
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs font-bold text-slate-500">Move</p>
                    <p className={`mt-1 text-lg font-black ${isDrop ? 'text-emerald-800' : 'text-amber-800'}`}>
                      {formatMoney(item.changeAmount, item.currency)}
                    </p>
                  </div>
                </div>
                <p className="mt-3 flex items-center gap-2 text-sm font-black text-slate-700">
                  <History aria-hidden="true" size={16} />
                  {item.changeCount} changes · {item.observationCount} observations
                </p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                  {formatPercent(item.changePercent)} from {formatMoney(item.previousPrice, item.currency)} · latest {item.latestObservedAt.slice(0, 10)}
                </p>
              </Link>
              <button
                className="mt-4 w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:border-cyan-700"
                type="button"
                onClick={() => {
                  hideRecommendationProduct(item);
                  setHiddenSlugs(getHiddenRecommendationProductSlugs());
                }}
              >
                Hide from recommendations
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function PreferenceAwareProductGrid({
  items,
  columnsClassName = 'md:grid-cols-2 xl:grid-cols-4'
}: Readonly<{ items: PreferenceAwareProductCard[]; columnsClassName?: string }>) {
  const [hiddenSlugs, setHiddenSlugs] = useHiddenRecommendationProductSlugs();
  const visibleItems = items.filter((item) => !productMatchesHiddenRecommendationPreference(item, hiddenSlugs));
  const hiddenItems = items.filter((item) => productMatchesHiddenRecommendationPreference(item, hiddenSlugs));

  return (
    <>
      <HiddenPreferenceRestoreBar hiddenItems={hiddenItems} labelFor={(item) => item.title} />
      <div className={`mt-5 grid gap-3 ${columnsClassName}`}>
        {visibleItems.map((item) => (
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4 hover:border-emerald-700" data-product-slug={item.productSlug} key={item.id}>
            <Link href={item.href}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">{item.eyebrow}</p>
              <h3 className="mt-2 font-black text-slate-950">{item.title}</h3>
              {item.subtitle ? <p className="mt-1 text-sm text-slate-600">{item.subtitle}</p> : null}
              <p className="mt-3 text-2xl font-black text-emerald-800">{item.metric}</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">{item.detail}</p>
            </Link>
            <button
              className="mt-4 w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:border-emerald-700"
              type="button"
              onClick={() => {
                hideRecommendationProduct(item);
                setHiddenSlugs(getHiddenRecommendationProductSlugs());
              }}
            >
              Hide from recommendations
            </button>
          </article>
        ))}
      </div>
    </>
  );
}

function useHiddenRecommendationProductSlugs() {
  const [hiddenSlugs, setHiddenSlugs] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const refresh = () => setHiddenSlugs(getHiddenRecommendationProductSlugs());
    refresh();
    window.addEventListener(hiddenRecommendationPreferenceEvent, refresh);
    return () => window.removeEventListener(hiddenRecommendationPreferenceEvent, refresh);
  }, []);

  return [hiddenSlugs, setHiddenSlugs] as const;
}

function HiddenPreferenceRestoreBar<T extends { productSlug: string }>({
  hiddenItems,
  labelFor
}: Readonly<{ hiddenItems: T[]; labelFor: (item: T) => string }>) {
  const [, setHiddenSlugs] = useHiddenRecommendationProductSlugs();
  const uniqueHiddenItems = useMemo(
    () => hiddenItems.filter((item, index, list) => list.findIndex((candidate) => candidate.productSlug === item.productSlug) === index),
    [hiddenItems]
  );

  if (uniqueHiddenItems.length === 0) return null;

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Hidden recommendations</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {uniqueHiddenItems.map((item) => (
          <button
            className="rounded-full bg-white px-3 py-2 text-xs font-black text-slate-700 ring-1 ring-slate-200 hover:ring-emerald-700"
            key={item.productSlug}
            type="button"
            onClick={() => {
              restoreRecommendationProduct(item);
              setHiddenSlugs(getHiddenRecommendationProductSlugs());
            }}
          >
            Restore {labelFor(item)}
          </button>
        ))}
      </div>
    </div>
  );
}
