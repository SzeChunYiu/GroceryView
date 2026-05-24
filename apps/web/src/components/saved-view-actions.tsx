'use client';

import { useEffect, useMemo, useState } from 'react';

import { SAVED_VIEWS_STORAGE_KEY, type SavedViewSurface } from '@/lib/saved-views';

const SAVED_VIEW_LIMIT = 16;

type SavedViewRecord = {
  id: string;
  surface: SavedViewSurface;
  label: string;
  url: string;
  createdAt: string;
  alertEligible: boolean;
};

type SavedViewActionsProps = {
  alertEligible?: boolean;
  defaultLabel: string;
  surface: SavedViewSurface;
};

function parseSavedViews(raw: string | null): SavedViewRecord[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as SavedViewRecord[];
    return Array.isArray(parsed)
      ? parsed.filter((view) => view && typeof view.id === 'string' && typeof view.url === 'string' && typeof view.surface === 'string')
      : [];
  } catch {
    return [];
  }
}

function describeCurrentView(defaultLabel: string, url: string) {
  const query = url.includes('?') ? url.slice(url.indexOf('?') + 1) : '';
  return query ? `${defaultLabel} · ${query.replaceAll('&', ' · ')}` : defaultLabel;
}

export function SavedViewActions({ alertEligible = false, defaultLabel, surface }: Readonly<SavedViewActionsProps>) {
  const [currentUrl, setCurrentUrl] = useState('');
  const [savedViews, setSavedViews] = useState<SavedViewRecord[]>([]);
  const [status, setStatus] = useState('Guest fallback ready');

  useEffect(() => {
    const sync = () => {
      setCurrentUrl(`${window.location.pathname}${window.location.search}`);
      setSavedViews(parseSavedViews(window.localStorage.getItem(SAVED_VIEWS_STORAGE_KEY)));
    };
    sync();
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const surfaceViews = useMemo(
    () => savedViews.filter((view) => view.surface === surface).sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [savedViews, surface]
  );
  const currentLabel = describeCurrentView(defaultLabel, currentUrl);
  const alreadySaved = surfaceViews.some((view) => view.url === currentUrl);
  const alertHref = alertEligible && currentUrl
    ? `/alerts?from_saved_view=${encodeURIComponent(currentUrl)}&surface=${encodeURIComponent(surface)}`
    : null;

  function writeViews(nextViews: SavedViewRecord[], nextStatus: string) {
    const bounded = nextViews.slice(0, SAVED_VIEW_LIMIT);
    window.localStorage.setItem(SAVED_VIEWS_STORAGE_KEY, JSON.stringify(bounded));
    setSavedViews(bounded);
    setStatus(nextStatus);
  }

  function saveCurrentView() {
    if (!currentUrl) return;
    const nextView: SavedViewRecord = {
      id: `${surface}-${Date.now()}`,
      surface,
      label: currentLabel,
      url: currentUrl,
      createdAt: new Date().toISOString(),
      alertEligible
    };
    writeViews(
      [nextView, ...savedViews.filter((view) => !(view.surface === surface && view.url === currentUrl))],
      'Saved to this browser; account sync waits for a signed-in session.'
    );
  }

  function removeSavedView(id: string) {
    writeViews(savedViews.filter((view) => view.id !== id), 'Saved view removed from this browser.');
  }

  return (
    <section className="mt-6 rounded-[2rem] border border-indigo-200 bg-indigo-50 p-5 shadow-sm" data-saved-view-surface={surface}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-800">Saved views</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Return to this {surface} setup</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
            Save the current path and query filters as a local guest fallback. Signed-in account persistence is routed through the protected saved-views API contract so private view state is not exposed in static pages.
          </p>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">{status}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-full bg-indigo-950 px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!currentUrl || alreadySaved}
            onClick={saveCurrentView}
            type="button"
          >
            {alreadySaved ? 'View saved' : 'Save current view'}
          </button>
          {alertHref ? (
            <a className="rounded-full border border-indigo-300 bg-white px-4 py-2 text-sm font-black text-indigo-950" href={alertHref}>
              Create alert from view
            </a>
          ) : (
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-500">Alerts not applicable</span>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {surfaceViews.length > 0 ? surfaceViews.map((view) => (
          <div className="rounded-2xl border border-indigo-100 bg-white p-3" key={view.id}>
            <a className="block font-black text-indigo-950 underline decoration-indigo-300 underline-offset-4" href={view.url}>{view.label}</a>
            <p className="mt-1 text-xs font-semibold text-slate-500">Saved {new Date(view.createdAt).toLocaleString('sv-SE')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {view.alertEligible ? <a className="text-xs font-black text-emerald-800 underline" href={`/alerts?from_saved_view=${encodeURIComponent(view.url)}&surface=${encodeURIComponent(view.surface)}`}>Alert</a> : null}
              <button className="text-xs font-black text-rose-700 underline" onClick={() => removeSavedView(view.id)} type="button">Remove</button>
            </div>
          </div>
        )) : (
          <p className="rounded-2xl border border-indigo-100 bg-white p-3 text-sm font-semibold text-slate-600">
            No saved {surface} views in this browser yet. Saving stores only the URL, surface, label, and timestamp.
          </p>
        )}
      </div>
    </section>
  );
}
