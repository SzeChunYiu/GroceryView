'use client';

import { FormEvent, useState } from 'react';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';

type DeveloperApiKey = {
  id: string;
  label: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

function formatTimestamp(value: string | null) {
  if (!value) return 'Never';
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export default function ApiKeysSettingsPage() {
  const [bearerToken, setBearerToken] = useState('');
  const [label, setLabel] = useState('Local scripts');
  const [apiKeys, setApiKeys] = useState<DeveloperApiKey[]>([]);
  const [plainTextKey, setPlainTextKey] = useState('');
  const [status, setStatus] = useState('Paste a signed-in bearer token, then load your developer keys.');
  const [isBusy, setIsBusy] = useState(false);

  const authorizationHeaders = () => ({
    Authorization: `Bearer ${bearerToken.trim()}`
  });

  async function parseResponse(response: Response) {
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = typeof payload.message === 'string' ? payload.message : 'The settings API rejected the request.';
      throw new Error(message);
    }
    return payload;
  }

  async function loadKeys() {
    if (!bearerToken.trim()) {
      setStatus('Add a bearer token before loading API keys.');
      return;
    }
    setIsBusy(true);
    setStatus('Loading developer API keys…');
    try {
      const payload = await fetch('/api/settings/api-keys', {
        headers: authorizationHeaders()
      }).then(parseResponse);
      setApiKeys(payload.apiKeys ?? []);
      setStatus(`Loaded ${(payload.apiKeys ?? []).length} active developer API key${(payload.apiKeys ?? []).length === 1 ? '' : 's'}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to load developer API keys.');
    } finally {
      setIsBusy(false);
    }
  }

  async function createKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!bearerToken.trim()) {
      setStatus('Add a bearer token before creating API keys.');
      return;
    }
    setIsBusy(true);
    setPlainTextKey('');
    setStatus('Generating a new developer API key…');
    try {
      const payload = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authorizationHeaders()
        },
        body: JSON.stringify({ label })
      }).then(parseResponse);
      setPlainTextKey(payload.plainTextKey ?? '');
      setApiKeys((current) => [payload.apiKey, ...current.filter((key) => key.id !== payload.apiKey.id)]);
      setStatus('Developer API key generated. Copy the plaintext value now because it will not be shown again.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to create a developer API key.');
    } finally {
      setIsBusy(false);
    }
  }

  async function revokeKey(keyId: string) {
    if (!bearerToken.trim()) {
      setStatus('Add a bearer token before revoking API keys.');
      return;
    }
    setIsBusy(true);
    setStatus('Revoking developer API key…');
    try {
      await fetch(`/api/settings/api-keys/${keyId}`, {
        method: 'DELETE',
        headers: authorizationHeaders()
      }).then(parseResponse);
      setApiKeys((current) => current.filter((key) => key.id !== keyId));
      setStatus('Developer API key revoked. Existing scripts using it should fail on their next request.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to revoke the developer API key.');
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <PageShell>
      <Eyebrow>Developer access</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">API key management</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Advanced users can generate and revoke GroceryView API keys for scripts, dashboards, and other programmatic workflows. The plaintext secret is shown once, while GroceryView stores only a hash and a short prefix for account review.
      </p>

      <Card className="mt-6 border-sky-200 bg-sky-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-900">Authenticated settings API</p>
        <label className="mt-4 block text-sm font-black text-slate-900" htmlFor="bearer-token">
          Signed-in bearer token
        </label>
        <input
          className="mt-2 w-full rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none ring-sky-400 transition focus:ring-4"
          id="bearer-token"
          onChange={(event) => setBearerToken(event.target.value)}
          placeholder="Paste a session bearer token for /api/settings"
          type="password"
          value={bearerToken}
        />
        <button
          className="mt-4 rounded-full bg-sky-700 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={isBusy}
          onClick={loadKeys}
          type="button"
        >
          Load API keys
        </button>
      </Card>

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-900">Generate key</p>
        <form className="mt-4 flex flex-col gap-3 md:flex-row" onSubmit={createKey}>
          <label className="sr-only" htmlFor="api-key-label">
            API key label
          </label>
          <input
            className="min-w-0 flex-1 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none ring-emerald-400 transition focus:ring-4"
            id="api-key-label"
            maxLength={80}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Label this API key"
            value={label}
          />
          <button
            className="rounded-full bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isBusy}
            type="submit"
          >
            Generate API key
          </button>
        </form>
        {plainTextKey ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Shown once</p>
            <code className="mt-2 block break-all rounded-xl bg-slate-950 p-3 text-sm font-bold text-emerald-100">{plainTextKey}</code>
          </div>
        ) : null}
      </Card>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700" role="status" aria-live="polite">
        {status}
      </div>

      <Card className="mt-6 border-slate-200 bg-white">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Active keys</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Review and revoke developer access</h2>
          </div>
          <p className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-700">{apiKeys.length} active</p>
        </div>
        <div className="mt-5 grid gap-3">
          {apiKeys.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-bold text-slate-600">No active developer API keys loaded.</p>
          ) : (
            apiKeys.map((apiKey) => (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={apiKey.id}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-lg font-black text-slate-950">{apiKey.label}</p>
                    <p className="mt-1 text-sm font-bold text-slate-600">Prefix: {apiKey.keyPrefix}••••</p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                      Created {formatTimestamp(apiKey.createdAt)} · Last used {formatTimestamp(apiKey.lastUsedAt)}
                    </p>
                  </div>
                  <button
                    className="rounded-full bg-rose-600 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                    disabled={isBusy}
                    onClick={() => revokeKey(apiKey.id)}
                    type="button"
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </PageShell>
  );
}
