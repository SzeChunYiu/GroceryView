'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { trackPriceAlertFunnelStep } from '@/lib/analytics';

export type SuggestedUnitPriceAlert = {
  productId: string;
  productName: string;
  currentPriceText: string;
  targetPrice: string;
  spreadText: string;
  lowestChain: string;
};

type PriceAlert = {
  id: string;
  userEmail: string;
  productId: string;
  targetPrice: number;
  createdAt: string;
};

type UnitPriceAlertStatus = 'idle' | 'blocked' | 'loading' | 'saved' | 'ready' | 'deleted' | 'error';

function formatTargetPrice(value: number): string {
  return `${value.toLocaleString('sv-SE', { maximumFractionDigits: 2, minimumFractionDigits: 2 })} kr`;
}

export function UnitPriceAlertActions({ suggestedAlerts }: Readonly<{ suggestedAlerts: SuggestedUnitPriceAlert[] }>) {
  const firstSuggestion = suggestedAlerts[0];
  const [userEmail, setUserEmail] = useState('');
  const [productId, setProductId] = useState(firstSuggestion?.productId ?? '');
  const [targetPrice, setTargetPrice] = useState(firstSuggestion?.targetPrice ?? '');
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [status, setStatus] = useState<UnitPriceAlertStatus>('idle');
  const [message, setMessage] = useState('Sign in or enter alert email first. No anonymous unit price alert writes are sent to the alert API.');
  const hasTrackedDialogOpen = useRef(false);

  useEffect(() => {
    if (hasTrackedDialogOpen.current || !productId) return;
    hasTrackedDialogOpen.current = true;
    trackPriceAlertFunnelStep({
      productId,
      source: 'unit-price-alert-actions',
      step: 'dialog_open',
      targetPrice: Number.isFinite(Number(targetPrice)) ? Number(targetPrice) : undefined
    });
  }, [productId, targetPrice]);

  function requireAlertEmail(): boolean {
    if (!userEmail.trim()) {
      setStatus('blocked');
      setMessage('Sign in or enter alert email first. No anonymous unit price alert writes are sent to the alert API.');
      return false;
    }
    return true;
  }

  function requireAlertInput(): boolean {
    if (!requireAlertEmail()) return false;
    if (!productId.trim() || !Number.isFinite(Number(targetPrice)) || Number(targetPrice) <= 0) {
      setStatus('blocked');
      setMessage('Choose a verified product and a positive target price before creating an alert.');
      return false;
    }
    return true;
  }

  async function loadAlerts() {
    if (!requireAlertEmail()) return;

    setStatus('loading');
    const response = await fetch(`/api/alerts?userEmail=${encodeURIComponent(userEmail)}`);
    if (!response.ok) {
      setStatus('error');
      setMessage('The alert API rejected the list request.');
      return;
    }

    const body = (await response.json()) as { alerts: PriceAlert[] };
    setAlerts(body.alerts);
    setStatus('ready');
    setMessage(`Loaded ${body.alerts.length} alert API rows for this email.`);
  }

  async function createAlert(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    trackPriceAlertFunnelStep({
      productId,
      source: 'unit-price-alert-actions',
      step: 'form_submit',
      targetPrice: Number.isFinite(Number(targetPrice)) ? Number(targetPrice) : undefined
    });
    if (!requireAlertInput()) return;

    setStatus('loading');
    const response = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userEmail, productId, targetPrice: Number(targetPrice) })
    });
    if (!response.ok) {
      setStatus('error');
      setMessage('The alert API rejected the create request.');
      return;
    }

    const alert = (await response.json()) as PriceAlert;
    trackPriceAlertFunnelStep({
      productId: alert.productId,
      source: 'unit-price-alert-actions',
      step: 'success',
      targetPrice: alert.targetPrice
    });
    setAlerts((current) => [alert, ...current.filter((row) => row.id !== alert.id)]);
    setStatus('saved');
    setMessage(`Created ${formatTargetPrice(alert.targetPrice)} alert for ${alert.productId}.`);
  }

  async function deleteAlert(alertId: string) {
    if (!requireAlertEmail()) return;

    setStatus('loading');
    const response = await fetch(`/api/alerts/${encodeURIComponent(alertId)}?userEmail=${encodeURIComponent(userEmail)}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      setStatus('error');
      setMessage('The alert API rejected the delete request.');
      return;
    }

    setAlerts((current) => current.filter((alert) => alert.id !== alertId));
    setStatus('deleted');
    setMessage('Deleted the selected unit price alert API row.');
  }

  return (
    <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5" aria-label="Unit price alert API controls">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-800">Alert API wiring</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Create, list, and delete unit price alerts</h2>
      <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
        This panel calls the live `/api/alerts` create/list/delete handlers. The public page does not write anonymous alert rows: an alert email, verified product id, and numeric target price are required before any request leaves the browser.
      </p>

      <form className="mt-5 grid gap-4 rounded-2xl bg-white p-4 shadow-sm lg:grid-cols-[1fr_1fr_0.7fr_auto]" onSubmit={createAlert}>
        <label className="text-sm font-black text-slate-950" htmlFor="unit-alert-email">
          Alert email
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-950"
            id="unit-alert-email"
            onChange={(event) => setUserEmail(event.target.value)}
            placeholder="name@example.com"
            type="email"
            value={userEmail}
          />
        </label>

        <label className="text-sm font-black text-slate-950" htmlFor="unit-alert-product">
          Verified product
          <select
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-950"
            id="unit-alert-product"
            onChange={(event) => {
              const nextProductId = event.target.value;
              setProductId(nextProductId);
              const suggestion = suggestedAlerts.find((item) => item.productId === nextProductId);
              if (suggestion) setTargetPrice(suggestion.targetPrice);
            }}
            value={productId}
          >
            {suggestedAlerts.map((suggestion) => (
              <option key={suggestion.productId} value={suggestion.productId}>
                {suggestion.productName}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-black text-slate-950" htmlFor="unit-alert-target">
          Target SEK
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-950"
            id="unit-alert-target"
            min="0.01"
            onChange={(event) => setTargetPrice(event.target.value)}
            step="0.01"
            type="number"
            value={targetPrice}
          />
        </label>

        <div className="flex items-end gap-2">
          <button
            className="rounded-full bg-amber-800 px-4 py-3 text-sm font-black text-white"
            onClick={() => trackPriceAlertFunnelStep({
              productId,
              source: 'unit-price-alert-actions',
              step: 'button_click',
              targetPrice: Number.isFinite(Number(targetPrice)) ? Number(targetPrice) : undefined
            })}
            type="submit"
          >
            Create alert
          </button>
          <button className="rounded-full border border-amber-300 px-4 py-3 text-sm font-black text-amber-950" onClick={loadAlerts} type="button">Load</button>
        </div>
      </form>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {suggestedAlerts.slice(0, 3).map((suggestion) => (
          <button
            className="rounded-2xl bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-amber-500"
            key={suggestion.productId}
            onClick={() => {
              setProductId(suggestion.productId);
              setTargetPrice(suggestion.targetPrice);
            }}
            type="button"
          >
            <p className="text-sm font-black text-slate-950">{suggestion.productName}</p>
            <p className="mt-1 text-xs font-semibold text-slate-600">
              {suggestion.lowestChain} now {suggestion.currentPriceText} · {suggestion.spreadText} spread
            </p>
            <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-amber-800">Target {suggestion.targetPrice} kr</p>
          </button>
        ))}
      </div>

      <p className="mt-4 rounded-2xl bg-white p-3 text-sm font-bold text-amber-950" data-status={status}>{message}</p>

      {alerts.length > 0 ? (
        <div className="mt-4 space-y-3">
          {alerts.map((alert) => (
            <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between" key={alert.id}>
              <div>
                <p className="font-black text-slate-950">{alert.productId}</p>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  Target {formatTargetPrice(alert.targetPrice)} · created {new Date(alert.createdAt).toLocaleString('sv-SE')}
                </p>
              </div>
              <button className="rounded-full border border-rose-200 px-4 py-2 text-sm font-black text-rose-900" onClick={() => deleteAlert(alert.id)} type="button">
                Delete alert
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
