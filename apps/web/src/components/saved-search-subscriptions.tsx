'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  buildSavedSearchDealMatches,
  defaultSavedSearchAlertRules,
  type SavedSearchDealCandidate,
  type SavedSearchSubscription
} from '@/lib/alert-scheduler';

const storageKey = 'groceryview:saved-search-subscriptions';

function readSubscriptions(): SavedSearchSubscription[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) || '[]') as SavedSearchSubscription[];
    return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.id === 'string' && typeof item.href === 'string') : [];
  } catch {
    return [];
  }
}

function writeSubscriptions(subscriptions: SavedSearchSubscription[]): void {
  window.localStorage.setItem(storageKey, JSON.stringify(subscriptions.slice(0, 20)));
  window.dispatchEvent(new CustomEvent('groceryview:saved-search-subscriptions-changed', { detail: { count: subscriptions.length } }));
}

export function SaveSearchSubscriptionButton({ subscription }: Readonly<{ subscription: SavedSearchSubscription }>) {
  const hasFilters = Object.keys(subscription.filters).length > 0;
  const alertRules = subscription.alertRules?.length ? subscription.alertRules : defaultSavedSearchAlertRules;
  const [status, setStatus] = useState<'idle' | 'saved' | 'updated' | 'blocked'>('idle');

  function saveSubscription() {
    if (!hasFilters) {
      setStatus('blocked');
      return;
    }
    const current = readSubscriptions();
    const withoutCurrent = current.filter((item) => item.id !== subscription.id);
    const existing = current.length !== withoutCurrent.length;
    writeSubscriptions([{ ...subscription, createdAt: new Date().toISOString() }, ...withoutCurrent]);
    setStatus(existing ? 'updated' : 'saved');
  }

  return (
    <section className="mx-auto mt-6 w-full max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Saved search subscription">
      <div className="rounded-3xl border border-emerald-100 bg-emerald-50/80 p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Saved search alert</p>
            <p className="mt-2 text-sm font-bold leading-6 text-emerald-950">{hasFilters ? subscription.label : 'Add search filters before saving an alert subscription.'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white disabled:bg-slate-300" disabled={!hasFilters} onClick={saveSubscription} type="button">
              Save this search
            </button>
            <Link className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-900" href="/alerts">
              View alerts
            </Link>
          </div>
        </div>
        <p className="mt-3 text-xs font-bold text-emerald-900" data-saved-search-status={status}>
          {status === 'saved' ? 'Saved in this browser and ready on the alerts page.' : null}
          {status === 'updated' ? 'Updated the existing saved search subscription.' : null}
          {status === 'blocked' ? 'Choose a query, category, dietary, chain, or price filter before saving.' : null}
          {status === 'idle' ? subscription.alertReason : null}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {alertRules.map((rule) => (
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-900 shadow-sm" key={rule.type} title={rule.description}>
              {rule.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SavedSearchSubscriptionsPanel({ candidates }: Readonly<{ candidates: SavedSearchDealCandidate[] }>) {
  const [subscriptions, setSubscriptions] = useState<SavedSearchSubscription[]>([]);

  useEffect(() => {
    function load() {
      setSubscriptions(readSubscriptions());
    }
    load();
    window.addEventListener('storage', load);
    window.addEventListener('groceryview:saved-search-subscriptions-changed', load);
    return () => {
      window.removeEventListener('storage', load);
      window.removeEventListener('groceryview:saved-search-subscriptions-changed', load);
    };
  }, []);

  const matches = useMemo(() => buildSavedSearchDealMatches(subscriptions, candidates), [subscriptions, candidates]);

  function removeSubscription(id: string) {
    const next = subscriptions.filter((subscription) => subscription.id !== id);
    writeSubscriptions(next);
    setSubscriptions(next);
  }

  return (
    <section className="mt-6 rounded-3xl border border-indigo-100 bg-indigo-50/70 p-5" aria-label="Saved search alert subscriptions">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-800">Saved search alerts</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Recurring search subscriptions</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-indigo-950">
            Saved searches stay in this browser and match against current verified deal candidates until account-backed alert persistence is available.
          </p>
        </div>
        <Link className="rounded-full bg-white px-4 py-2 text-sm font-black text-indigo-900 shadow-sm" href="/search">
          Add search
        </Link>
      </div>

      {subscriptions.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {subscriptions.map((subscription) => (
            <article className="rounded-2xl bg-white p-4 shadow-sm" key={subscription.id}>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-950">{subscription.label}</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-600">Saved {new Date(subscription.createdAt).toLocaleString('sv-SE')}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link className="rounded-full border border-indigo-200 px-3 py-2 text-xs font-black text-indigo-900" href={subscription.href}>Open search</Link>
                  <button className="rounded-full border border-rose-200 px-3 py-2 text-xs font-black text-rose-900" onClick={() => removeSubscription(subscription.id)} type="button">Remove</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-dashed border-indigo-200 bg-white p-4 text-sm font-semibold text-slate-600">
          No saved search subscriptions are stored in this browser yet.
        </p>
      )}

      {matches.length > 0 ? (
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {matches.map((match) => (
            <Link className="rounded-2xl bg-white p-4 shadow-sm transition hover:bg-indigo-50" href={match.href} key={`${match.subscriptionId}:${match.id}`}>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Matching deal</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{match.name}</h3>
              <p className="mt-1 text-sm font-bold text-slate-700">{match.currentPriceText} · {match.chain}</p>
              <p className="mt-2 text-xs font-semibold text-indigo-900">{match.matchedFilters.join(' · ') || match.dealSummary}</p>
              <p className="mt-2 text-xs font-black text-emerald-800">
                {match.alertRuleTypes.includes('price_drop') && match.priceDropText ? match.priceDropText : 'New-match alert rule active'}
              </p>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
