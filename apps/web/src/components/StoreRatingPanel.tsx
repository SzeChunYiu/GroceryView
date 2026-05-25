'use client';

import { useEffect, useMemo, useState } from 'react';

type StoreRatingSummary = {
  storeId: string;
  averageRating: number | null;
  ratingCount: number;
  userRating?: number | null;
};

type StoreRatingPanelProps = {
  apiBaseUrl: string;
  storeId: string;
  storeName: string;
};

const localUserKey = 'groceryview.storeRatingUserId';

function localRatingUserId() {
  const existing = window.localStorage.getItem(localUserKey);
  if (existing) return existing;
  const generated = window.crypto?.randomUUID?.() ?? `browser-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(localUserKey, generated);
  return generated;
}

function formatAverage(summary: StoreRatingSummary | null) {
  if (!summary || summary.ratingCount === 0 || summary.averageRating === null) return 'No ratings yet';
  return `${summary.averageRating.toFixed(1)} / 5`;
}

export function StoreRatingPanel({ apiBaseUrl, storeId, storeName }: StoreRatingPanelProps) {
  const [summary, setSummary] = useState<StoreRatingSummary | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [status, setStatus] = useState('Loading rating summary...');
  const endpoint = useMemo(() => `${apiBaseUrl.replace(/\/+$/, '')}/stores/${encodeURIComponent(storeId)}/rating`, [apiBaseUrl, storeId]);

  useEffect(() => {
    let cancelled = false;
    fetch(endpoint)
      .then((response) => response.ok ? response.json() as Promise<StoreRatingSummary> : Promise.reject(new Error('rating unavailable')))
      .then((payload) => {
        if (cancelled) return;
        setSummary(payload);
        setStatus(payload.ratingCount === 0 ? 'Be the first shopper to rate this store.' : `${payload.ratingCount} shopper rating${payload.ratingCount === 1 ? '' : 's'} captured.`);
      })
      .catch(() => {
        if (!cancelled) setStatus('Store ratings are unavailable right now.');
      });
    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  async function submitRating(rating: number) {
    setSelectedRating(rating);
    setStatus('Saving your rating...');
    try {
      const response = await fetch(endpoint, {
        body: JSON.stringify({ rating, userId: localRatingUserId() }),
        headers: { 'content-type': 'application/json' },
        method: 'POST'
      });
      if (!response.ok) throw new Error('rating failed');
      const payload = await response.json() as StoreRatingSummary;
      setSummary(payload);
      setStatus('Your store rating has been saved.');
    } catch {
      setStatus('Could not save the rating. Try again later.');
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-label={`Store rating for ${storeName}`}>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Shopper rating</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-4xl font-black text-slate-950">{formatAverage(summary)}</p>
          <p className="mt-1 text-sm font-bold text-slate-600">{status}</p>
        </div>
        <div className="flex gap-2" role="group" aria-label="Rate this store from 1 to 5">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              aria-label={`Rate ${storeName} ${rating} out of 5`}
              className={`h-10 w-10 rounded-full border text-sm font-black transition ${selectedRating === rating || summary?.userRating === rating ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-slate-300 bg-slate-50 text-slate-900 hover:border-emerald-700'}`}
              key={rating}
              onClick={() => void submitRating(rating)}
              type="button"
            >
              {rating}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
