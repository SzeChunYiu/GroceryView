'use client';

import { useEffect, useMemo, useState } from 'react';

type StoreRatingSummary = {
  storeId: string;
  averageRating: number | null;
  ratingCount: number;
  myRating: number | null;
};

type StoreRatingCardProps = {
  storeId: string;
  storeName: string;
};

const ratingOptions = [1, 2, 3, 4, 5] as const;
const userIdStorageKey = 'groceryview-store-rating-user-id';

function getOrCreateRatingUserId(): string {
  if (typeof window === 'undefined') return 'web-anonymous';
  const existing = window.localStorage.getItem(userIdStorageKey);
  if (existing) return existing;
  const generated = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(userIdStorageKey, generated);
  return generated;
}

function averageLabel(summary: StoreRatingSummary | null): string {
  if (!summary || summary.averageRating === null || summary.ratingCount === 0) return 'No ratings yet';
  return `${summary.averageRating.toFixed(1)} / 5`;
}

export function StoreRatingCard({ storeId, storeName }: Readonly<StoreRatingCardProps>) {
  const [summary, setSummary] = useState<StoreRatingSummary | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [pendingRating, setPendingRating] = useState<number | null>(null);
  const [message, setMessage] = useState('Loading store ratings…');

  const endpoint = useMemo(() => `/api/stores/${encodeURIComponent(storeId)}/rating`, [storeId]);

  useEffect(() => {
    const currentUserId = getOrCreateRatingUserId();
    setUserId(currentUserId);
    let cancelled = false;

    async function loadRating() {
      try {
        const response = await fetch(`${endpoint}?userId=${encodeURIComponent(currentUserId)}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Store ratings are temporarily unavailable.');
        const data = await response.json() as StoreRatingSummary;
        if (!cancelled) {
          setSummary(data);
          setMessage(data.ratingCount > 0 ? 'Average rating from GroceryView users.' : 'Be the first GroceryView user to rate this store.');
        }
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : 'Store ratings are temporarily unavailable.');
      }
    }

    void loadRating();
    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  async function submitRating(rating: number) {
    if (!userId) return;
    setPendingRating(rating);
    setMessage(`Saving your ${rating}-star rating…`);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId, rating })
      });
      if (!response.ok) throw new Error('Could not save your store rating.');
      const data = await response.json() as StoreRatingSummary;
      setSummary(data);
      setMessage('Thanks — your store rating was saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save your store rating.');
    } finally {
      setPendingRating(null);
    }
  }

  return (
    <section className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5 shadow-sm" aria-labelledby="store-rating-heading">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">Community store rating</p>
          <h2 className="mt-2 text-2xl font-black text-amber-950" id="store-rating-heading">Rate {storeName}</h2>
          <p className="mt-3 text-sm font-bold text-amber-900" role="status" aria-live="polite">{message}</p>
        </div>
        <div className="rounded-2xl bg-white px-5 py-4 text-center shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-700">Average</p>
          <p className="mt-1 text-4xl font-black text-amber-950">{averageLabel(summary)}</p>
          <p className="mt-1 text-sm font-bold text-amber-800">
            {summary?.ratingCount ? `${summary.ratingCount.toLocaleString('sv-SE')} rating${summary.ratingCount === 1 ? '' : 's'}` : 'No ratings'}
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2" aria-label="Choose your store rating">
        {ratingOptions.map((rating) => {
          const selected = summary?.myRating === rating;
          const disabled = pendingRating !== null;
          return (
            <button
              aria-pressed={selected}
              className={`rounded-full border px-4 py-2 text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300 ${
                selected
                  ? 'border-amber-500 bg-amber-500 text-white'
                  : 'border-amber-300 bg-white text-amber-950 hover:border-amber-500 hover:bg-amber-100'
              } ${disabled ? 'cursor-wait opacity-70' : ''}`}
              disabled={disabled}
              key={rating}
              onClick={() => void submitRating(rating)}
              type="button"
            >
              <span aria-hidden="true">{'★'.repeat(rating)}</span>
              <span className="sr-only">Rate {storeName} {rating} out of 5 stars</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
