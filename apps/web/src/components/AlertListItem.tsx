'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';

export type ManagedPriceAlert = {
  id: string;
  userEmail: string;
  productId: string;
  targetPrice: number;
  createdAt: string;
};

export type AlertProductSummary = {
  productId: string;
  productName: string;
  currentPrice: number;
  currentPriceText: string;
  lastObservedAt?: string;
  lowestChain: string;
  productHref: string;
};

type AlertListItemProps = {
  alert: ManagedPriceAlert;
  product?: AlertProductSummary;
  staleAfterHours: number;
  onDelete(alertId: string): void;
};

function formatTargetPrice(value: number): string {
  return `${value.toLocaleString('sv-SE', { maximumFractionDigits: 2, minimumFractionDigits: 2 })} kr`;
}

function alertStatus(alert: ManagedPriceAlert, product?: AlertProductSummary): string {
  if (!product) return 'Current price unavailable; keeping alert active until verified product price evidence exists.';
  if (product.currentPrice <= alert.targetPrice) return 'Target reached by current verified chain price.';
  return 'Waiting: current verified chain price is still above target.';
}

function priceFreshnessLabel(product: AlertProductSummary | undefined, staleAfterHours: number): string {
  if (!product?.lastObservedAt) return 'Freshness warning: no lastObservedAt timestamp is available for this product price.';
  const lastObservedAt = new Date(product.lastObservedAt);
  const ageHours = Math.max(0, Math.floor((Date.now() - lastObservedAt.getTime()) / 3_600_000));
  if (!Number.isFinite(ageHours)) return 'Freshness warning: lastObservedAt is not a valid timestamp.';
  if (ageHours > staleAfterHours) return `Freshness warning: lastObservedAt is ${ageHours} hours old, outside the selected ${staleAfterHours}-hour window.`;
  return `Fresh price evidence: lastObservedAt is ${ageHours} hours old, within the selected ${staleAfterHours}-hour window.`;
}

export function AlertListItem({ alert, product, staleAfterHours, onDelete }: Readonly<AlertListItemProps>) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" data-alert-id={alert.id}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Active price alert</p>
          <h2 className="mt-2 text-xl font-black text-slate-950">{product?.productName ?? alert.productId}</h2>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Target {formatTargetPrice(alert.targetPrice)} · created {new Date(alert.createdAt).toLocaleString('sv-SE')}
          </p>
        </div>
        <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-950 lg:min-w-64">
          <p>{product ? `${product.lowestChain} current ${product.currentPriceText}` : 'No verified current price found'}</p>
          <p className="mt-1 text-xs font-semibold text-emerald-800">{alertStatus(alert, product)}</p>
          <p className="mt-1 text-xs font-semibold text-amber-800" data-alert-freshness>{priceFreshnessLabel(product, staleAfterHours)}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link className="rounded-full border border-emerald-200 px-4 py-2 text-sm font-black text-emerald-900" href={product?.productHref ?? '/products'}>
          View product
        </Link>
        <button className="rounded-full border border-rose-200 px-4 py-2 text-sm font-black text-rose-900" onClick={() => onDelete(alert.id)} type="button">
          Delete alert
        </button>
      </div>
    </article>
  );
}

export function AlertManagementPanel({ products }: Readonly<{ products: AlertProductSummary[] }>) {
  const [userEmail, setUserEmail] = useState('');
  const [alerts, setAlerts] = useState<ManagedPriceAlert[]>([]);
  const [staleAfterHours, setStaleAfterHours] = useState(24);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'deleted' | 'blocked' | 'error'>('idle');
  const [message, setMessage] = useState('Enter the email used for price alerts. No anonymous alert rows are loaded.');
  const productsById = useMemo(() => new Map(products.map((product) => [product.productId, product])), [products]);

  function requireEmail(): boolean {
    if (!userEmail.trim()) {
      setStatus('blocked');
      setMessage('Enter an alert email before loading active price alerts.');
      return false;
    }
    return true;
  }

  async function loadAlerts(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!requireEmail()) return;
    setStatus('loading');
    const response = await fetch(`/api/alerts?userEmail=${encodeURIComponent(userEmail)}&staleAfterHours=${encodeURIComponent(staleAfterHours)}`);
    if (!response.ok) {
      setStatus('error');
      setMessage('The alert API rejected the list request. Check the email and try again.');
      return;
    }
    const body = (await response.json()) as { alerts: ManagedPriceAlert[] };
    setAlerts(body.alerts);
    setStatus('ready');
    setMessage(`Loaded ${body.alerts.length} active price alert${body.alerts.length === 1 ? '' : 's'}.`);
  }

  async function deleteAlert(alertId: string) {
    if (!requireEmail()) return;
    setStatus('loading');
    const response = await fetch(`/api/alerts/${encodeURIComponent(alertId)}?userEmail=${encodeURIComponent(userEmail)}`, { method: 'DELETE' });
    if (!response.ok) {
      setStatus('error');
      setMessage('The alert API rejected the delete request.');
      return;
    }
    setAlerts((current) => current.filter((alert) => alert.id !== alertId));
    setStatus('deleted');
    setMessage('Deleted the selected price alert.');
  }

  return (
    <section className="mt-6 rounded-3xl border border-emerald-100 bg-emerald-50/70 p-5" aria-label="Price alert management">
      <form className="grid gap-3 md:grid-cols-[1fr_12rem_auto] md:items-end" onSubmit={loadAlerts}>
        <label className="text-sm font-black text-slate-950" htmlFor="alerts-email">
          Alert email
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-950"
            id="alerts-email"
            onChange={(event) => setUserEmail(event.target.value)}
            placeholder="name@example.com"
            type="email"
            value={userEmail}
          />
        </label>
        <label className="text-sm font-black text-slate-950" htmlFor="alerts-stale-after-hours">
          Stale window (hours)
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-950"
            id="alerts-stale-after-hours"
            min={1}
            onChange={(event) => setStaleAfterHours(Math.max(1, Number(event.target.value) || 1))}
            type="number"
            value={staleAfterHours}
          />
        </label>
        <button className="rounded-full bg-emerald-800 px-5 py-3 text-sm font-black text-white" type="submit">Load active alerts</button>
      </form>
      <p className="mt-4 rounded-2xl bg-white p-3 text-sm font-bold text-emerald-950" data-alert-management-status={status}>{message}</p>

      {alerts.length > 0 ? (
        <div className="mt-5 grid gap-4">
          {alerts.map((alert) => (
            <AlertListItem alert={alert} key={alert.id} onDelete={deleteAlert} product={productsById.get(alert.productId)} staleAfterHours={staleAfterHours} />
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-2xl border border-dashed border-emerald-200 bg-white p-5 text-sm font-semibold text-slate-600">
          No active alerts are displayed until the alert API returns rows for the supplied email.
        </p>
      )}
    </section>
  );
}
