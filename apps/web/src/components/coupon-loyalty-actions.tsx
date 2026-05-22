'use client';

import { useState } from 'react';

type CouponStatus = 'idle' | 'blocked' | 'loading' | 'ready' | 'error';
type BrowserSession = { accessToken: string; userId: string };
type LoyaltyOffer = { productId?: string; chain?: string; savings?: number; status?: string; actionRequired?: boolean; requirement?: string };
type LoyaltyOfferResponse = { totalEligibleSavings?: number; requiresActionCount?: number; offers?: LoyaltyOffer[]; guardrails?: string[] };
type SubscriptionAccessResponse = { enforcementReasons?: string[]; accountActions?: string[]; entitlement?: { tier?: string; status?: string; plan?: string } | null };

function readSession(): BrowserSession {
  const accessToken = sessionStorage.getItem('groceryview:accessToken') || '';
  const userId = sessionStorage.getItem('groceryview:userId') || '';
  return { accessToken, userId };
}

export function CouponLoyaltyActions() {
  const [status, setStatus] = useState<CouponStatus>('idle');
  const [message, setMessage] = useState('No anonymous coupon offers. Sign in first to load account-scoped coupon and loyalty savings.');
  const [loyalty, setLoyalty] = useState<LoyaltyOfferResponse | null>(null);
  const [subscriptionAccess, setSubscriptionAccess] = useState<SubscriptionAccessResponse | null>(null);

  function requireSession(): BrowserSession | null {
    const session = readSession();
    if (!session.accessToken || !session.userId) {
      setStatus('blocked');
      setMessage('Sign in first. No anonymous coupon offers or membership savings are loaded from protected account endpoints.');
      return null;
    }
    setStatus('loading');
    return session;
  }

  async function loadCouponOffers() {
    const session = requireSession();
    if (!session) return;
    const { accessToken, userId } = session;
    const headers = { Authorization: `Bearer ${accessToken}` };
    const [loyaltyResponse, subscriptionResponse] = await Promise.all([
      fetch(`/api/loyalty/offers?userId=${encodeURIComponent(userId)}`, { method: 'GET', headers }),
      fetch(`/api/account/subscription-access?userId=${encodeURIComponent(userId)}`, { method: 'GET', headers })
    ]);

    if (!loyaltyResponse.ok || !subscriptionResponse.ok) {
      setStatus('error');
      setMessage('Coupon and loyalty request was rejected by the production API.');
      return;
    }

    const loyaltyBody = (await loyaltyResponse.json()) as LoyaltyOfferResponse;
    const subscriptionBody = (await subscriptionResponse.json()) as SubscriptionAccessResponse;
    setLoyalty(loyaltyBody);
    setSubscriptionAccess(subscriptionBody);
    setStatus('ready');
    setMessage(`Loaded account-bound offers: ${loyaltyBody.totalEligibleSavings ?? 0} kr eligible savings and ${loyaltyBody.requiresActionCount ?? 0} required coupon actions.`);
  }

  return (
    <section className="mt-6 rounded-3xl border border-amber-200 bg-white p-5 shadow-sm" aria-label="Coupon and loyalty offer controls">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-800">Signed-in coupon actions</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Account-bound coupon and loyalty offers</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
        These controls call the protected loyalty and subscription endpoints with the sessionStorage bearer token. Public pages can describe coupon readiness, but actual savings stay tied to the signed-in account, membership state, and required clip actions.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="rounded-full bg-amber-700 px-4 py-2 text-sm font-black text-white" onClick={loadCouponOffers} type="button">Load signed-in coupon offers</button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-950">totalEligibleSavings</p>
          <p className="mt-2 text-3xl font-black text-amber-800">{loyalty?.totalEligibleSavings ?? '—'} kr</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Only returned after the protected /api/loyalty/offers response confirms account-scoped offers.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-950">requiresActionCount</p>
          <p className="mt-2 text-3xl font-black text-amber-800">{loyalty?.requiresActionCount ?? '—'}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">needs_coupon rows require explicit clipping before checkout savings can be claimed.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-950">Membership gate</p>
          <p className="mt-2 text-sm font-bold text-slate-700">{subscriptionAccess?.enforcementReasons?.join(', ') ?? 'missing_subscription_entitlement until signed in'}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">needs_membership offers remain blocked until subscription or loyalty entitlement is confirmed.</p>
        </div>
      </div>

      {loyalty?.offers?.length ? (
        <ul className="mt-4 grid gap-3 lg:grid-cols-2">
          {loyalty.offers.slice(0, 4).map((offer, index) => (
            <li className="rounded-2xl border border-slate-200 bg-white p-4 text-sm" key={`${offer.productId ?? 'offer'}-${index}`}>
              <p className="font-black text-slate-950">{offer.chain ?? 'chain'} · {offer.productId ?? 'product'}</p>
              <p className="mt-1 text-slate-700">{offer.savings ?? 0} kr savings · {offer.status ?? 'eligible'} {offer.actionRequired ? '· action required' : ''}</p>
              <p className="mt-1 text-slate-600">{offer.requirement ?? 'No extra coupon requirement returned.'}</p>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-950" data-status={status}>{message}</p>
    </section>
  );
}
