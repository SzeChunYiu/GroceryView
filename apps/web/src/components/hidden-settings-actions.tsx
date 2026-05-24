'use client';

import { useState } from 'react';

type HiddenPreferences = {
  hiddenProductIds: string[];
  hiddenStoreIds: string[];
};

type Status = 'idle' | 'blocked' | 'loading' | 'ready' | 'error';

function readSession() {
  return {
    accessToken: sessionStorage.getItem('groceryview:accessToken') || '',
    userId: sessionStorage.getItem('groceryview:userId') || ''
  };
}

function splitIds(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function HiddenSettingsActions() {
  const [productText, setProductText] = useState('');
  const [storeText, setStoreText] = useState('');
  const [preferences, setPreferences] = useState<HiddenPreferences>({ hiddenProductIds: [], hiddenStoreIds: [] });
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('Hidden products and stores apply only after sign-in and are excluded from comparisons and signed-in result lists.');

  function sessionOrBlock() {
    const session = readSession();
    if (!session.accessToken || !session.userId) {
      setStatus('blocked');
      setMessage('Sign in first. Hidden preferences are account-owned and are not saved anonymously.');
      return null;
    }
    setStatus('loading');
    return session;
  }

  async function loadHidden() {
    const session = sessionOrBlock();
    if (!session) return;
    const response = await fetch(`/api/settings/hidden?userId=${encodeURIComponent(session.userId)}`, {
      headers: { Authorization: `Bearer ${session.accessToken}` }
    });
    if (!response.ok) {
      setStatus('error');
      setMessage('Hidden preferences could not be loaded from the signed-in settings endpoint.');
      return;
    }
    const payload = await response.json() as HiddenPreferences;
    setPreferences(payload);
    setProductText(payload.hiddenProductIds.join('\n'));
    setStoreText(payload.hiddenStoreIds.join('\n'));
    setStatus('ready');
    setMessage('Hidden preferences loaded for this account.');
  }

  async function saveHidden() {
    const session = sessionOrBlock();
    if (!session) return;
    const response = await fetch(`/api/settings/hidden?userId=${encodeURIComponent(session.userId)}`, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`
      },
      body: JSON.stringify({
        hiddenProductIds: splitIds(productText),
        hiddenStoreIds: splitIds(storeText)
      })
    });
    if (!response.ok) {
      setStatus('error');
      setMessage('Hidden preferences were rejected. Check that every product and store id exists.');
      return;
    }
    const payload = await response.json() as HiddenPreferences;
    setPreferences(payload);
    setStatus('ready');
    setMessage('Hidden preferences saved. Comparisons and signed-in result lists now exclude these ids.');
  }

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-2">
        <label className="block text-sm font-bold text-slate-900">
          Hidden product ids
          <textarea
            className="mt-2 min-h-40 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm"
            onChange={(event) => setProductText(event.target.value)}
            value={productText}
          />
        </label>
        <label className="block text-sm font-bold text-slate-900">
          Hidden store ids
          <textarea
            className="mt-2 min-h-40 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm"
            onChange={(event) => setStoreText(event.target.value)}
            value={storeText}
          />
        </label>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white" onClick={saveHidden} type="button">
          Save hidden list
        </button>
        <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-black text-slate-800" onClick={loadHidden} type="button">
          Load saved list
        </button>
      </div>
      <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm font-bold text-emerald-950" data-status={status}>{message}</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Hidden products</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{preferences.hiddenProductIds.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Hidden stores</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{preferences.hiddenStoreIds.length}</p>
        </div>
      </div>
    </>
  );
}
