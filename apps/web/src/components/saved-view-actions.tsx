'use client';

import { useState } from 'react';

import {
  defaultSavedViewAccountId,
  normalizeSavedViewState,
  savedViewId,
  savedViewStorageKey,
  savedViewSurfaceLabel,
  savedViewSupportsAlerts,
  type SavedViewRecord,
  type SavedViewState,
  type SavedViewSurface
} from '@/lib/saved-views';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'updated' | 'alerted' | 'error';

type SavedViewActionsProps = {
  accountId?: string;
  allowAlert?: boolean;
  href: string;
  label: string;
  resultLabel: string;
  state: SavedViewState;
  surface: SavedViewSurface;
};

function readLocalViews(): SavedViewRecord[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(savedViewStorageKey) || '[]') as SavedViewRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistLocalView(view: SavedViewRecord) {
  const current = readLocalViews().filter((item) => item.id !== view.id || item.accountId !== view.accountId);
  window.localStorage.setItem(savedViewStorageKey, JSON.stringify([view, ...current].slice(0, 30)));
}

export function SavedViewActions({
  accountId = defaultSavedViewAccountId,
  allowAlert = false,
  href,
  label,
  resultLabel,
  state,
  surface
}: Readonly<SavedViewActionsProps>) {
  const normalizedState = normalizeSavedViewState(state);
  const id = savedViewId(surface, label, normalizedState);
  const alertable = allowAlert && savedViewSupportsAlerts(surface);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [message, setMessage] = useState(`${savedViewSurfaceLabel(surface)} view can be saved to this account with a local browser fallback.`);

  async function saveView(createAlert = false) {
    const now = new Date().toISOString();
    const localView: SavedViewRecord = {
      accountId,
      createdAt: now,
      href,
      id,
      label,
      source: 'local',
      state: normalizedState,
      surface,
      updatedAt: now
    };

    setStatus('saving');
    persistLocalView(localView);

    try {
      const response = await fetch('/api/saved-views', {
        body: JSON.stringify({ accountId, createAlert, href, id, label, state: normalizedState, surface }),
        headers: { 'content-type': 'application/json' },
        method: 'POST'
      });
      const payload = await response.json() as { alert?: unknown; error?: string; status?: 'saved' | 'updated' };
      if (!response.ok) throw new Error(payload.error ?? 'Saved view API rejected this state.');

      setStatus(createAlert && payload.alert ? 'alerted' : payload.status === 'updated' ? 'updated' : 'saved');
      setMessage(createAlert && payload.alert
        ? 'Saved this view and created an account alert for future matching observed deals.'
        : payload.status === 'updated'
          ? 'Updated this saved view for the account and refreshed the local fallback.'
          : 'Saved this view for the account and kept a local browser fallback.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? `${error.message} Local fallback saved in this browser.` : 'Local fallback saved in this browser.');
    }
  }

  return (
    <section className="mt-6 rounded-[1.5rem] border border-violet-200 bg-violet-50 p-5 shadow-sm" aria-label={`${savedViewSurfaceLabel(surface)} saved view controls`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-800">Saved view</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">{label}</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-violet-950">{resultLabel}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-full bg-violet-800 px-4 py-2 text-sm font-black text-white disabled:bg-slate-300" disabled={status === 'saving'} onClick={() => { void saveView(false); }} type="button">
            {status === 'saving' ? 'Saving...' : 'Save view'}
          </button>
          {alertable ? (
            <button className="rounded-full border border-violet-300 bg-white px-4 py-2 text-sm font-black text-violet-950 disabled:bg-slate-100" disabled={status === 'saving'} onClick={() => { void saveView(true); }} type="button">
              Save + alert
            </button>
          ) : null}
        </div>
      </div>
      <p className="mt-3 text-xs font-bold text-violet-950" data-saved-view-status={status}>{message}</p>
    </section>
  );
}
