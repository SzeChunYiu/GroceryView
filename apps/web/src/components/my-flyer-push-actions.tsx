'use client';

import { useEffect, useState } from 'react';
import { readStoredAlgorithmChoice, USER_PREFERENCES_STORAGE_KEY, type AlgorithmChoice } from '@/components/algorithm-picker';

import {
  buildMyFlyerRefreshUrl,
  readBrowserAccountSession,
  readPushConsentPayload,
  requestPushConsentPayload,
  savePushConsent
} from '@/lib/push';

type MyFlyerPushActionsProps = Readonly<{
  city: string;
  country: string;
  defaultAlgorithm: string;
  limit: number;
  vapidPublicKey?: string;
}>;

type ActionState = 'idle' | 'blocked' | 'loading' | 'saved' | 'error';
type MyFlyerRequestAlgorithm = Exclude<AlgorithmChoice, 'balanced'>;

const myFlyerReadyChannels = ['my-flyer-ready'];
const myFlyerRequestAlgorithms = new Set<string>(['watchlist_first', 'best_savings', 'best_unit_price']);

function requestAlgorithmForChoice(choice: AlgorithmChoice): MyFlyerRequestAlgorithm {
  return myFlyerRequestAlgorithms.has(choice) ? choice as MyFlyerRequestAlgorithm : 'watchlist_first';
}

export function MyFlyerPushActions({
  city,
  country,
  defaultAlgorithm,
  limit,
  vapidPublicKey = ''
}: MyFlyerPushActionsProps) {
  const [algorithm, setAlgorithm] = useState<MyFlyerRequestAlgorithm>(() => requestAlgorithmForChoice(defaultAlgorithm as AlgorithmChoice));
  const [state, setState] = useState<ActionState>('idle');
  const [message, setMessage] = useState('Sign in to refresh your account-bound MyFlyer and enable ready alerts.');

  useEffect(() => {
    setAlgorithm(requestAlgorithmForChoice(readStoredAlgorithmChoice()));

    function handlePreferenceChange(event: Event) {
      if (!(event instanceof CustomEvent) || event.detail?.storageKey !== USER_PREFERENCES_STORAGE_KEY) return;
      setAlgorithm(requestAlgorithmForChoice(event.detail.algorithm_choice));
    }

    window.addEventListener('groceryview:user-preferences-changed', handlePreferenceChange);
    return () => window.removeEventListener('groceryview:user-preferences-changed', handlePreferenceChange);
  }, []);

  function requireSignedInSession() {
    const session = readBrowserAccountSession();
    if (!session) {
      setState('blocked');
      setMessage('Sign in first. MyFlyer push consent and refreshes require the authenticated browser session account id.');
      return null;
    }
    setState('loading');
    return session;
  }

  async function saveReadyAlertConsent() {
    const session = requireSignedInSession();
    if (!session) return;

    try {
      const payload = await requestPushConsentPayload(vapidPublicKey);
      const body = await savePushConsent({
        channels: myFlyerReadyChannels,
        payload,
        session
      });
      setState('saved');
      setMessage(`MyFlyer ready alerts saved for signed-in account ${body.accountId}.`);
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Unable to save MyFlyer push consent.');
    }
  }

  async function refreshMyFlyer() {
    const session = requireSignedInSession();
    if (!session) return;

    try {
      const consentPayload = await readPushConsentPayload();
      await savePushConsent({
        channels: myFlyerReadyChannels,
        payload: consentPayload,
        session
      });
      const response = await fetch(buildMyFlyerRefreshUrl({
        algorithm,
        country,
        limit,
        userId: session.userId
      }), {
        headers: {
          Authorization: `Bearer ${session.accessToken}`
        }
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof body.error === 'string' ? body.error : 'Unable to refresh MyFlyer.');
      }
      setState('saved');
      setMessage(`Refreshed ${body.rows?.length ?? 0} ${city} MyFlyer rows for signed-in account ${body.userId ?? session.userId}.`);
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Unable to refresh MyFlyer for this account.');
    }
  }

  return (
    <section className="my-flyer-screen-only my-6 rounded-3xl border border-indigo-200 bg-indigo-50 p-5" data-print-hide>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-indigo-800">Signed-in MyFlyer controls</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Refresh account-ranked offers and ready alerts</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
            These browser actions read the production session token and account id from sessionStorage before calling
            <code className="mx-1 rounded bg-white/80 px-1 py-0.5 text-indigo-900">/api/my-flyer</code>
            or saving <code className="mx-1 rounded bg-white/80 px-1 py-0.5 text-indigo-900">my-flyer-ready</code> push consent.
            They fail closed without a signed-in session, so static pages never write anonymous notification consent.
          </p>
        </div>
        <div className="rounded-2xl border border-indigo-100 bg-white p-4 text-sm font-bold text-indigo-950">
          <p>City: {city}</p>
          <p>Country: {country.toUpperCase()}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <p className="rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-black text-slate-950">
          API ranking: {algorithm.replace(/_/g, ' ')}
        </p>
        <button className="rounded-full bg-indigo-900 px-4 py-2 text-sm font-black text-white" onClick={refreshMyFlyer} type="button">
          Refresh signed-in MyFlyer
        </button>
        <button className="rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-black text-indigo-900" onClick={saveReadyAlertConsent} type="button">
          Enable ready alert
        </button>
      </div>

      <p className="mt-4 rounded-2xl bg-white p-3 text-sm font-bold text-indigo-950" data-status={state}>{message}</p>
    </section>
  );
}
