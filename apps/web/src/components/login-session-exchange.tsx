'use client';

import { useState } from 'react';

type SessionExchangeResponse = {
  accessToken: string;
  userId: string;
  email?: string;
  expiresAt: string;
};

export function LoginSessionExchange() {
  const [validCode, setValidCode] = useState('');
  const [status, setStatus] = useState('Waiting for a verified auth provider assertion.');

  async function exchangeSession() {
    setStatus('Exchanging verified auth provider assertion...');
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ provider: 'magic_link', assertion: validCode })
    });
    if (!response.ok) {
      setStatus('Production auth session exchange is unavailable.');
      return;
    }

    const session = await response.json() as SessionExchangeResponse;
    sessionStorage.setItem('groceryview:accessToken', session.accessToken);
    sessionStorage.setItem('groceryview:userId', session.userId);

    await fetch('/api/account/profile', {
      headers: { Authorization: `Bearer ${session.accessToken}` }
    }).catch(() => undefined);

    setStatus(`Session established for ${session.userId}`);
  }

  return (
    <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5">
      <h2 className="text-2xl font-black text-emerald-950">Production session exchange</h2>
      <p className="mt-2 text-sm leading-6 text-emerald-900">
        Paste a validCode from the production identity provider. The browser exchanges it at /api/auth/session and stores only the short-lived bearer token in sessionStorage.
      </p>
      <label className="mt-4 block text-sm font-black text-emerald-950" htmlFor="validCode">Verified auth provider assertion</label>
      <input
        className="mt-2 w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950"
        id="validCode"
        onChange={(event) => setValidCode(event.target.value)}
        placeholder="validCode"
        type="password"
        value={validCode}
      />
      <button className="mt-3 rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white" disabled={!validCode.trim()} onClick={exchangeSession} type="button">
        Exchange session
      </button>
      <p className="mt-3 rounded-2xl bg-white/70 p-3 text-sm font-semibold text-emerald-950">{status}</p>
    </div>
  );
}
