'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export type SavedMarketViewSurface = 'map' | 'deals' | 'screener' | 'categories' | 'compare';

type SavedMarketView = {
  alertEligible: boolean;
  alertMetric: string;
  createdAt: string;
  href: string;
  id: string;
  name: string;
  ownerScope: 'account' | 'guest';
  surface: SavedMarketViewSurface;
  userId?: string;
};

type SavedViewAlertDraft = {
  createdAt: string;
  href: string;
  id: string;
  metric: string;
  ownerScope: 'account' | 'guest';
  status: 'draft';
  surface: SavedMarketViewSurface;
  viewId: string;
  viewName: string;
};

type SavedMarketViewActionsProps = {
  alertEligible?: boolean;
  alertMetric?: string;
  description: string;
  surface: SavedMarketViewSurface;
  title: string;
};

const savedViewStoragePrefix = 'groceryview:saved-market-views:v1';
const savedViewAlertStoragePrefix = 'groceryview:saved-market-view-alerts:v1';

function scopedKey(prefix: string, userId: string | null) {
  return userId ? `${prefix}:account:${userId}` : `${prefix}:guest`;
}

function readStoredArray<T>(key: string): T[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || '[]') as unknown;
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

function writeStoredArray<T>(key: string, value: T[]) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function currentViewHref() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function defaultViewName(surface: SavedMarketViewSurface) {
  return `${surface[0].toUpperCase()}${surface.slice(1)} view`;
}

export function SavedMarketViewActions({
  alertEligible = false,
  alertMetric = 'Price or availability movement for this saved view',
  description,
  surface,
  title
}: Readonly<SavedMarketViewActionsProps>) {
  const [userId, setUserId] = useState<string | null>(null);
  const [viewName, setViewName] = useState(defaultViewName(surface));
  const [views, setViews] = useState<SavedMarketView[]>([]);
  const [message, setMessage] = useState('Saved views load in this browser. Sign in to scope them to an account session.');

  const storageKey = scopedKey(savedViewStoragePrefix, userId);
  const alertStorageKey = scopedKey(savedViewAlertStoragePrefix, userId);
  const ownerScope: SavedMarketView['ownerScope'] = userId ? 'account' : 'guest';

  useEffect(() => {
    const sessionUserId = window.sessionStorage.getItem('groceryview:userId');
    setUserId(sessionUserId || null);
  }, []);

  useEffect(() => {
    setViews(readStoredArray<SavedMarketView>(storageKey).filter((view) => view.surface === surface));
  }, [storageKey, surface]);

  function saveCurrentView() {
    const now = new Date().toISOString();
    const trimmedName = viewName.trim() || defaultViewName(surface);
    const view: SavedMarketView = {
      alertEligible,
      alertMetric,
      createdAt: now,
      href: currentViewHref(),
      id: `${surface}-${Date.now()}`,
      name: trimmedName,
      ownerScope,
      surface,
      userId: userId || undefined
    };
    const allViews = readStoredArray<SavedMarketView>(storageKey).filter((stored) => stored.id !== view.id);
    const nextViews = [view, ...allViews].slice(0, 24);
    writeStoredArray(storageKey, nextViews);
    setViews(nextViews.filter((stored) => stored.surface === surface));
    setMessage(`${trimmedName} saved for ${ownerScope === 'account' ? `account ${userId}` : 'local guest fallback'}.`);
  }

  function removeView(viewId: string) {
    const nextViews = readStoredArray<SavedMarketView>(storageKey).filter((view) => view.id !== viewId);
    writeStoredArray(storageKey, nextViews);
    setViews(nextViews.filter((view) => view.surface === surface));
    setMessage('Saved view removed from this browser scope.');
  }

  function createAlertDraft(view: SavedMarketView) {
    if (!view.alertEligible) {
      setMessage('Alerts are only offered when the saved view has a product, category, deal, or comparison signal to monitor.');
      return;
    }
    const draft: SavedViewAlertDraft = {
      createdAt: new Date().toISOString(),
      href: view.href,
      id: `saved-view-alert-${Date.now()}`,
      metric: view.alertMetric,
      ownerScope,
      status: 'draft',
      surface: view.surface,
      viewId: view.id,
      viewName: view.name
    };
    const drafts = readStoredArray<SavedViewAlertDraft>(alertStorageKey);
    writeStoredArray(alertStorageKey, [draft, ...drafts].slice(0, 24));
    setMessage(`Alert draft created from ${view.name}. Review it from alerts before enabling notifications.`);
  }

  return (
    <section className="mt-6 rounded-[2rem] border border-indigo-200 bg-indigo-50/80 p-5 shadow-sm" aria-labelledby={`saved-${surface}-views-heading`}>
      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr] lg:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-800">Saved market views</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950" id={`saved-${surface}-views-heading`}>{title}</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{description}</p>
          <p className="mt-3 rounded-2xl bg-white/80 p-3 text-xs font-bold uppercase tracking-[0.16em] text-indigo-900">
            {ownerScope === 'account' ? `Persisting to account scope: ${userId}` : 'Persisting to local guest fallback until sign-in'}
          </p>
        </div>
        <div className="rounded-3xl border border-indigo-100 bg-white p-4 shadow-sm">
          <label className="text-sm font-black uppercase tracking-[0.18em] text-slate-600" htmlFor={`saved-${surface}-view-name`}>View name</label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-950"
            id={`saved-${surface}-view-name`}
            onChange={(event) => setViewName(event.target.value)}
            value={viewName}
          />
          <button className="mt-3 w-full rounded-xl bg-indigo-900 px-4 py-2 text-sm font-black text-white" onClick={saveCurrentView} type="button">
            Save current filters / sort / view
          </button>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-600" role="status">{message}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {views.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-indigo-200 bg-white/70 p-4 text-sm font-semibold leading-6 text-slate-600">
            No saved {surface} views in this browser scope yet. Save the current URL state to return to it quickly.
          </p>
        ) : views.map((view) => (
          <article className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm" key={view.id}>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-800">{view.ownerScope} · {view.surface}</p>
            <h3 className="mt-2 text-lg font-black text-slate-950">{view.name}</h3>
            <p className="mt-1 break-all text-xs font-semibold text-slate-500">{view.href}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link className="rounded-full bg-slate-950 px-3 py-2 text-xs font-black text-white" href={view.href}>Open view</Link>
              {view.alertEligible ? (
                <button className="rounded-full border border-emerald-300 px-3 py-2 text-xs font-black text-emerald-900" onClick={() => createAlertDraft(view)} type="button">
                  Create alert draft
                </button>
              ) : (
                <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-500">Alerts not valid</span>
              )}
              <button className="rounded-full border border-slate-200 px-3 py-2 text-xs font-black text-slate-700" onClick={() => removeView(view.id)} type="button">
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
