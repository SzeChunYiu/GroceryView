'use client';

import { useEffect, useMemo, useState } from 'react';

const storageKey = 'groceryview:settings:notification-opt-in';

type StoredNotificationPreference = {
  optedIn: boolean;
  savedAt: string;
};

function readPreference(): StoredNotificationPreference | null {
  if (typeof window === 'undefined') return null;

  try {
    const rawPreference = window.localStorage.getItem(storageKey);
    if (!rawPreference) return null;

    const parsedPreference = JSON.parse(rawPreference) as Partial<StoredNotificationPreference>;
    if (typeof parsedPreference.optedIn !== 'boolean') return null;

    return {
      optedIn: parsedPreference.optedIn,
      savedAt: typeof parsedPreference.savedAt === 'string' ? parsedPreference.savedAt : 'unknown'
    };
  } catch {
    return null;
  }
}

function formatSavedAt(savedAt: string) {
  if (savedAt === 'unknown') return 'Saved time unavailable';

  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) return 'Saved time unavailable';

  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

export function NotificationOptInToggle() {
  const [savedPreference, setSavedPreference] = useState<StoredNotificationPreference | null>(null);
  const [draftOptIn, setDraftOptIn] = useState(false);
  const [status, setStatus] = useState('Loading notification preference from this browser…');

  useEffect(() => {
    const preference = readPreference();
    setSavedPreference(preference);
    setDraftOptIn(preference?.optedIn ?? false);
    setStatus(preference ? 'Saved notification preference loaded from localStorage.' : 'No saved notification preference yet. Notifications default to off.');
  }, []);

  const currentValue = savedPreference?.optedIn ? 'Opted in' : 'Opted out';
  const draftValue = draftOptIn ? 'Opt in' : 'Opt out';
  const hasUnsavedChange = useMemo(() => (savedPreference?.optedIn ?? false) !== draftOptIn, [draftOptIn, savedPreference]);

  function savePreference() {
    const nextPreference: StoredNotificationPreference = {
      optedIn: draftOptIn,
      savedAt: new Date().toISOString()
    };

    window.localStorage.setItem(storageKey, JSON.stringify(nextPreference));
    setSavedPreference(nextPreference);
    setStatus(`Saved ${draftOptIn ? 'opt-in' : 'opt-out'} locally. Reloading this page so settings stay in sync…`);

    window.setTimeout(() => {
      window.location.reload();
    }, 250);
  }

  return (
    <section className="mt-6 rounded-[1.75rem] border border-violet-200 bg-violet-50 p-5 shadow-sm" aria-labelledby="notification-opt-in-title">
      <div className="grid gap-5 lg:grid-cols-[1fr_0.7fr] lg:items-start">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-800">Notification preference</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950" id="notification-opt-in-title">
            Browser notification opt-in toggle
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
            Choose whether this browser should be opted in for GroceryView notifications. This setting is intentionally local-only until the backend preference API is connected, so no server account state is changed by this control.
          </p>
          <p className="mt-3 rounded-2xl bg-white/80 p-3 text-sm font-bold text-violet-950" role="status">
            {status}
          </p>
        </div>

        <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Current saved value</p>
          <p className="mt-2 text-3xl font-black text-slate-950" data-notification-opt-in={savedPreference?.optedIn ?? false}>
            {currentValue}
          </p>
          <p className="mt-2 text-xs font-semibold text-slate-600">
            localStorage key: <code className="rounded bg-slate-100 px-1 py-0.5">{storageKey}</code>
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-600">Last saved: {savedPreference ? formatSavedAt(savedPreference.savedAt) : 'Not saved'}</p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-violet-100 bg-white p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-start gap-3 text-sm font-bold text-slate-800" htmlFor="notification-opt-in-toggle">
            <input
              checked={draftOptIn}
              className="mt-1 h-5 w-5 rounded border-violet-300 text-violet-700 focus:ring-violet-600"
              id="notification-opt-in-toggle"
              onChange={(event) => setDraftOptIn(event.target.checked)}
              type="checkbox"
            />
            <span>
              <span className="block text-base font-black text-slate-950">Opt in to GroceryView notifications on this browser</span>
              <span className="mt-1 block text-sm font-semibold leading-6 text-slate-600">
                Draft value: {draftValue}. Save to persist the choice in localStorage and reload the page.
              </span>
            </span>
          </label>

          <button
            className="rounded-full bg-violet-800 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-violet-900 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-violet-300"
            disabled={!hasUnsavedChange && savedPreference !== null}
            onClick={savePreference}
            type="button"
          >
            Save notification setting
          </button>
        </div>
      </div>
    </section>
  );
}
