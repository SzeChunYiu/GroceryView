'use client';

import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight, History } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { TrendingProductPriceChange } from '@groceryview/db';
import {
  USER_RECOMMENDATION_PREFERENCES_STORAGE_KEY,
  USER_RECOMMENDATION_PREFERENCES_UPDATED_EVENT,
  addRecommendationDislike,
  createRecommendationDislikeSignal,
  filterDislikedRecommendations,
  parseUserRecommendationPreferences,
  removeRecommendationDislike,
  serializeUserRecommendationPreferences,
  type RecommendationPreferenceItem,
  type UserRecommendationPreferences
} from '@/lib/user-preferences';

type TrendingRecommendationItem = TrendingProductPriceChange & RecommendationPreferenceItem;

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

function useRecommendationPreferences() {
  const [preferences, setPreferences] = useState<UserRecommendationPreferences>({ dislikedRecommendations: [] });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    function syncFromStorage() {
      try {
        setPreferences(parseUserRecommendationPreferences(localStorage.getItem(USER_RECOMMENDATION_PREFERENCES_STORAGE_KEY)));
      } catch {
        setPreferences({ dislikedRecommendations: [] });
      } finally {
        setIsReady(true);
      }
    }

    syncFromStorage();
    window.addEventListener('storage', syncFromStorage);
    window.addEventListener(USER_RECOMMENDATION_PREFERENCES_UPDATED_EVENT, syncFromStorage);
    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener(USER_RECOMMENDATION_PREFERENCES_UPDATED_EVENT, syncFromStorage);
    };
  }, []);

  function persist(nextPreferences: UserRecommendationPreferences) {
    setPreferences(nextPreferences);
    localStorage.setItem(USER_RECOMMENDATION_PREFERENCES_STORAGE_KEY, serializeUserRecommendationPreferences(nextPreferences));
    window.dispatchEvent(new CustomEvent(USER_RECOMMENDATION_PREFERENCES_UPDATED_EVENT));
  }

  return { isReady, persist, preferences };
}

export function TrendingCarousel({ items }: Readonly<{ items: TrendingProductPriceChange[] }>) {
  const { isReady, persist, preferences } = useRecommendationPreferences();
  const preferenceItems = useMemo<TrendingRecommendationItem[]>(
    () => items.map((item) => ({
      ...item,
      productId: item.productSlug,
      category: item.categoryLabel ?? 'Grocery',
      brand: item.brand ?? ''
    })),
    [items]
  );
  const visibleItems = useMemo(
    () => filterDislikedRecommendations(preferenceItems, preferences),
    [preferenceItems, preferences]
  );
  const suppressedItems = useMemo(
    () => preferenceItems.filter((item) => !visibleItems.some((visibleItem) => visibleItem.productId === item.productId)),
    [preferenceItems, visibleItems]
  );

  function dislikeRecommendation(item: TrendingRecommendationItem) {
    persist(addRecommendationDislike(preferences, createRecommendationDislikeSignal(item, 'trending-carousel')));
  }

  function restoreRecommendation(productId: string) {
    persist(removeRecommendationDislike(preferences, productId));
  }

  if (items.length === 0) return null;

  return (
    <section
      className="mt-6 rounded-[1.75rem] border border-cyan-200 bg-white/90 p-5 shadow-sm"
      aria-label="Trending products"
      data-recommendation-preferences-ready={isReady}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-800">Trending products</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Most price changes in the last 7 days</h2>
        </div>
        <p className="max-w-2xl text-sm font-semibold leading-6 text-slate-600">
          Ranked from dated price observations with the packages/db time-series summarizer; equal prices and missing history do not create changes.
        </p>
      </div>
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
                className="mt-3 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                onClick={() => dislikeRecommendation(item)}
                type="button"
              >
                Hide from recommendations
              </button>
            </article>
          );
        })}
      </div>
      {suppressedItems.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Hidden trending products</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {suppressedItems.map((item) => (
              <button
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                key={item.productId}
                onClick={() => restoreRecommendation(item.productId)}
                type="button"
              >
                Restore {item.productName}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
