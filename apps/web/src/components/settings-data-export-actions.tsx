'use client';

import { useState } from 'react';

type ExportStatus = 'idle' | 'blocked' | 'loading' | 'ready' | 'error';
type BrowserSession = { accessToken: string; userId: string };

function readSession(): BrowserSession {
  const accessToken = sessionStorage.getItem('groceryview:accessToken') || '';
  const userId = sessionStorage.getItem('groceryview:userId') || '';
  return { accessToken, userId };
}

export function SettingsDataExportActions() {
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [message, setMessage] = useState('No anonymous data exports. Sign in first to download account-owned JSON records.');

  function requireSession(): BrowserSession | null {
    const session = readSession();
    if (!session.accessToken || !session.userId) {
      setStatus('blocked');
      setMessage('Sign in first. No anonymous data exports are sent to protected account endpoints.');
      return null;
    }
    setStatus('loading');
    return session;
  }

  async function downloadMyData() {
    const session = requireSession();
    if (!session) return;

    const { accessToken, userId } = session;
    try {
      const response = await fetch(`/api/settings/data-export?userId=${encodeURIComponent(userId)}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!response.ok) {
        setStatus('error');
        setMessage('Data export was rejected by the production API.');
        return;
      }

      const payload = await response.json();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `groceryview-data-export-${userId}.json`;
      link.click();
      URL.revokeObjectURL(objectUrl);

      setStatus('ready');
      setMessage('Download my data export prepared for the signed-in account.');
    } catch {
      setStatus('error');
      setMessage('Data export failed before a signed-in JSON file could be downloaded.');
    }
  }

  return (
    <section className="mt-6 rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm" aria-label="Settings data export controls">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Signed-in settings action</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Download my data</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
        The button reads only the production session token and user id from sessionStorage, then requests the account-bound GDPR export endpoint with bearer authorization.
      </p>
      <button className="mt-4 rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white" onClick={downloadMyData} type="button">
        Download my data
      </button>
      <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-950" data-status={status}>{message}</p>
    </section>
  );
}
