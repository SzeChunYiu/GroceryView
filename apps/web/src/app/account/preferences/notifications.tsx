'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId, useState } from 'react';

const notificationPreferenceStorageKey = 'groceryview:account:notification-opt-in';

type NotificationPreference = {
  optedIn: boolean;
  updatedAt: string;
  source: 'settings-ui';
};

function readStoredPreference(): NotificationPreference | null {
  if (typeof window === 'undefined') return null;

  try {
    const rawValue = window.localStorage.getItem(notificationPreferenceStorageKey);
    if (!rawValue) return null;

    const parsed = JSON.parse(rawValue) as Partial<NotificationPreference> | null;
    if (!parsed || typeof parsed.optedIn !== 'boolean') return null;

    return {
      optedIn: parsed.optedIn,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : 'Unknown',
      source: 'settings-ui'
    };
  } catch {
    return null;
  }
}

export function NotificationPreferenceToggle() {
  const router = useRouter();
  const fieldId = useId();
  const [currentPreference, setCurrentPreference] = useState<NotificationPreference | null>(null);
  const [draftOptIn, setDraftOptIn] = useState(false);
  const [status, setStatus] = useState('Loading saved notification preference…');

  useEffect(() => {
    const storedPreference = readStoredPreference();
    setCurrentPreference(storedPreference);
    setDraftOptIn(storedPreference?.optedIn ?? false);
    setStatus(storedPreference ? 'Saved preference loaded from this browser.' : 'No saved preference yet. Notifications default to off.');
  }, []);

  function savePreference() {
    const nextPreference: NotificationPreference = {
      optedIn: draftOptIn,
      updatedAt: new Date().toISOString(),
      source: 'settings-ui'
    };

    window.localStorage.setItem(notificationPreferenceStorageKey, JSON.stringify(nextPreference));
    setCurrentPreference(nextPreference);
    setStatus(draftOptIn ? 'Notifications are now opted in for this browser.' : 'Notifications are now opted out for this browser.');
    window.dispatchEvent(new CustomEvent('groceryview:notification-preference-saved', { detail: nextPreference }));
    router.refresh();
  }

  const currentLabel = currentPreference?.optedIn ? 'Opted in' : 'Opted out';

  return (
    <section className="mt-6 rounded-[1.75rem] border border-indigo-200 bg-indigo-50 p-5 shadow-sm" aria-labelledby={fieldId}>
      <div className="grid gap-5 lg:grid-cols-[1fr_0.7fr] lg:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-800">Notification preference</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950" id={fieldId}>
            Opt in to GroceryView notifications
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
            This settings control stores the shopper&apos;s notification opt-in choice in browser localStorage only. No backend subscription is created yet, so the saved value stays local until the account notification API is wired.
          </p>
          <p className="mt-3 rounded-2xl bg-white/80 p-3 text-sm font-bold text-indigo-950" role="status">
            {status}
          </p>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Current saved value</p>
          <p className="mt-2 text-3xl font-black text-slate-950" data-notification-opt-in={currentPreference?.optedIn ?? false}>
            {currentLabel}
          </p>
          <p className="mt-2 text-xs font-semibold text-slate-600">
            localStorage key: <code className="rounded bg-slate-100 px-1 py-0.5">{notificationPreferenceStorageKey}</code>
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-600">Last saved: {currentPreference?.updatedAt ?? 'Not saved'}</p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-indigo-100 bg-white p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-start gap-3 text-sm font-bold text-slate-800" htmlFor={`${fieldId}-toggle`}>
            <input
              checked={draftOptIn}
              className="mt-1 h-5 w-5 rounded border-indigo-300 text-indigo-700 focus:ring-indigo-600"
              id={`${fieldId}-toggle`}
              onChange={(event) => setDraftOptIn(event.target.checked)}
              type="checkbox"
            />
            <span>
              <span className="block text-base font-black text-slate-950">Send me GroceryView price alerts and digests</span>
              <span className="mt-1 block text-sm font-semibold leading-6 text-slate-600">
                Toggle the draft value, then save to persist it locally and refresh the current route.
              </span>
            </span>
          </label>

          <button
            className="rounded-full bg-indigo-800 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
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
