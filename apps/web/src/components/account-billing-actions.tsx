'use client';

import { useState } from 'react';

type BillingStatus = 'idle' | 'blocked' | 'loading' | 'ready' | 'redirecting' | 'error';
type BrowserSession = { accessToken: string; userId: string };
type BillingPlan = 'premium_monthly' | 'premium_yearly';
type SubscriptionAccessResponse = {
  premiumFeaturesEnabled?: boolean;
  checkoutRequired?: boolean;
  accountActions?: string[];
  enforcementReasons?: string[];
  summary?: string;
  entitlement?: { tier?: string; status?: string; plan?: string } | null;
};
type CheckoutSessionResponse = { checkoutUrl?: string; plan?: string };
type PortalSessionResponse = { portalUrl?: string };

const premiumSavingsForecast = [
  { label: 'Alerts', amount: '42 kr', detail: 'watchlist drops and wait-window alerts' },
  { label: 'Swaps', amount: '58 kr', detail: 'verified chain substitutions' },
  { label: 'Basket planning', amount: '33 kr', detail: 'duplicate-buy and pantry timing guidance' }
];

function readSession(): BrowserSession {
  const accessToken = sessionStorage.getItem('groceryview:accessToken') || '';
  const userId = sessionStorage.getItem('groceryview:userId') || '';
  return { accessToken, userId };
}

export function AccountBillingActions() {
  const [status, setStatus] = useState<BillingStatus>('idle');
  const [message, setMessage] = useState('No anonymous billing sessions. Sign in first to load checkout and subscription management actions.');
  const [subscriptionAccess, setSubscriptionAccess] = useState<SubscriptionAccessResponse | null>(null);

  function requireSession(nextStatus: BillingStatus = 'loading'): BrowserSession | null {
    const session = readSession();
    if (!session.accessToken || !session.userId) {
      setStatus('blocked');
      setMessage('Sign in first. No anonymous billing sessions are created for checkout or subscription management.');
      return null;
    }
    setStatus(nextStatus);
    return session;
  }

  async function loadSubscriptionAccess() {
    const session = requireSession('loading');
    if (!session) return;
    const { accessToken, userId } = session;
    const response = await fetch(`/api/account/subscription-access?userId=${encodeURIComponent(userId)}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      setStatus('error');
      setMessage('Subscription access request was rejected by the production API.');
      return;
    }

    const body = (await response.json()) as SubscriptionAccessResponse;
    setSubscriptionAccess(body);
    setStatus('ready');
    setMessage(body.summary ?? `Loaded account-bound subscription access. checkoutRequired: ${String(body.checkoutRequired ?? true)}.`);
  }

  async function startCheckout(plan: BillingPlan) {
    const session = requireSession('redirecting');
    if (!session) return;
    const { accessToken, userId } = session;
    const response = await fetch(`/api/billing/checkout-sessions?userId=${encodeURIComponent(userId)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ plan })
    });

    if (!response.ok) {
      setStatus('error');
      setMessage('Checkout session request was rejected by the production API.');
      return;
    }

    const body = (await response.json()) as CheckoutSessionResponse;
    if (typeof body.checkoutUrl !== 'string' || !body.checkoutUrl) {
      setStatus('error');
      setMessage('Checkout session did not return a redirect URL.');
      return;
    }

    setMessage(`Redirecting signed-in account to ${body.plan ?? plan} checkout.`);
    window.location.assign(body.checkoutUrl);
  }

  async function manageSubscription() {
    const session = requireSession('redirecting');
    if (!session) return;
    const { accessToken, userId } = session;
    const response = await fetch(`/api/billing/portal-sessions?userId=${encodeURIComponent(userId)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      setStatus('error');
      setMessage('Billing portal session request was rejected by the production API.');
      return;
    }

    const body = (await response.json()) as PortalSessionResponse;
    if (typeof body.portalUrl !== 'string' || !body.portalUrl) {
      setStatus('error');
      setMessage('Billing portal session did not return a redirect URL.');
      return;
    }

    setMessage('Redirecting signed-in account to subscription management.');
    window.location.assign(body.portalUrl);
  }

  const enforcementReasons = subscriptionAccess?.enforcementReasons ?? ['missing_signed_in_subscription_context'];
  const accountActions = subscriptionAccess?.accountActions ?? ['load_subscription_access', 'start_checkout', 'manage_subscription'];
  const forecastUnlocked = Boolean(subscriptionAccess?.premiumFeaturesEnabled);

  return (
    <section className="mt-6 rounded-3xl border border-violet-200 bg-white p-5 shadow-sm" aria-label="Account billing controls">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-800">Signed-in billing actions</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Checkout and subscription management</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
        These controls call the protected subscription, Stripe checkout, and Stripe billing portal endpoints with the sessionStorage bearer token. They fail closed without a production session so public visitors cannot create anonymous billing sessions. Premium removes the free active price alert limit and unlocks priority deal monitoring.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button className="rounded-full bg-violet-700 px-4 py-2 text-sm font-black text-white" onClick={loadSubscriptionAccess} type="button">Load subscription status</button>
        <button className="rounded-full border border-violet-300 px-4 py-2 text-sm font-black text-violet-900" onClick={() => startCheckout('premium_monthly')} type="button">Upgrade monthly for unlimited alerts</button>
        <button className="rounded-full border border-violet-300 px-4 py-2 text-sm font-black text-violet-900" onClick={() => startCheckout('premium_yearly')} type="button">Upgrade yearly for unlimited alerts</button>
        <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-black text-slate-800" onClick={manageSubscription} type="button">Manage subscription</button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-950">premiumFeaturesEnabled</p>
          <p className="mt-2 text-3xl font-black text-violet-800">{subscriptionAccess ? String(subscriptionAccess.premiumFeaturesEnabled ?? false) : '—'}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Returned only after the signed-in account entitlement is loaded.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-950">checkoutRequired</p>
          <p className="mt-2 text-3xl font-black text-violet-800">{subscriptionAccess ? String(subscriptionAccess.checkoutRequired ?? true) : '—'}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Premium checkout stays account-bound before Stripe redirect.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-950">Entitlement</p>
          <p className="mt-2 text-sm font-bold text-slate-700">
            {subscriptionAccess?.entitlement?.tier ?? 'signed-in account required'} · {subscriptionAccess?.entitlement?.status ?? 'not loaded'}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">The billing portal button requires an existing Stripe-compatible customer on the signed-in account.</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black text-violet-950">Premium savings forecast</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-violet-950">
              Forecasted monthly savings stay premium-only and combine observed alerts, historical swaps, and basket-planning source rows after subscription access is loaded.
            </p>
          </div>
          <p className="rounded-full bg-white px-3 py-1 text-sm font-black text-violet-800">{forecastUnlocked ? 'Unlocked' : 'Locked'}</p>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {premiumSavingsForecast.map((driver) => (
            <div className="rounded-2xl bg-white p-3" key={driver.label}>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{driver.label}</p>
              <p className="mt-1 text-2xl font-black text-violet-800">{driver.amount}</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{driver.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
          <p className="text-sm font-black text-violet-950">Enforcement reasons</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm font-bold text-violet-950">
            {enforcementReasons.map((reason) => <li key={reason}>{reason}</li>)}
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-black text-slate-950">Account actions</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm font-bold text-slate-700">
            {accountActions.map((action) => <li key={action}>{action}</li>)}
          </ul>
        </div>
      </div>

      <p className="mt-4 rounded-2xl bg-violet-50 p-3 text-sm font-bold text-violet-950" data-status={status}>{message}</p>
    </section>
  );
}
