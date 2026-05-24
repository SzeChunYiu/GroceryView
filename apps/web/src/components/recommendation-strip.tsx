'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
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

export type RecommendationStripItem = RecommendationPreferenceItem & {
  productSlug: string;
  savingsLabel: string;
  priceLabel: string;
  reason: string;
  confidence: string;
  qualityRisk: string;
};

export function RecommendationStrip({
  sourceProductId,
  items,
  emptyMessage
}: Readonly<{
  sourceProductId: string;
  items: RecommendationStripItem[];
  emptyMessage: string;
}>) {
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

  const visibleItems = useMemo(() => filterDislikedRecommendations(items, preferences), [items, preferences]);
  const suppressedItems = useMemo(
    () => items.filter((item) => !visibleItems.some((visibleItem) => visibleItem.productId === item.productId)),
    [items, visibleItems]
  );

  function persist(nextPreferences: UserRecommendationPreferences) {
    setPreferences(nextPreferences);
    localStorage.setItem(USER_RECOMMENDATION_PREFERENCES_STORAGE_KEY, serializeUserRecommendationPreferences(nextPreferences));
    window.dispatchEvent(new CustomEvent(USER_RECOMMENDATION_PREFERENCES_UPDATED_EVENT));
  }

  function dislikeRecommendation(item: RecommendationStripItem) {
    persist(addRecommendationDislike(preferences, createRecommendationDislikeSignal(item, sourceProductId)));
  }

  function restoreRecommendation(productId: string) {
    persist(removeRecommendationDislike(preferences, productId));
  }

  return (
    <div data-recommendation-preferences-ready={isReady}>
      {visibleItems.length > 0 ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {visibleItems.map((item) => (
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-700" key={item.productId}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Save {item.savingsLabel}</p>
                  <h3 className="mt-2 text-lg font-black text-slate-950">
                    <Link className="underline decoration-emerald-300 underline-offset-4" href={`/products/${item.productSlug}`}>
                      {item.productName}
                    </Link>
                  </h3>
                </div>
                <button
                  className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                  onClick={() => dislikeRecommendation(item)}
                  type="button"
                >
                  Dislike
                </button>
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-600">{item.brand} - {item.priceLabel}</p>
              <p className="mt-3 text-sm leading-6 text-slate-700">{item.reason}</p>
              <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500">confidence {item.confidence} - qualityRisk {item.qualityRisk}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-950">{emptyMessage}</p>
      )}
      {suppressedItems.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Anti-recommendation list</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {suppressedItems.map((item) => (
              <button
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
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
    </div>
  );
}
