'use client';

import { useState } from 'react';

type CouponStatus = 'idle' | 'blocked' | 'loading' | 'ready' | 'error';
type BrowserSession = { accessToken: string; userId: string };
type LoyaltyOffer = {
  productId?: string;
  chain?: string;
  savings?: number;
  status?: string;
  actionRequired?: boolean;
  requirement?: string;
  combinable?: boolean;
  clipped?: boolean;
  membershipEligible?: boolean;
  requiresMembership?: boolean;
};
type LoyaltyOfferResponse = { totalEligibleSavings?: number; requiresActionCount?: number; offers?: LoyaltyOffer[]; guardrails?: string[] };
type SubscriptionAccessResponse = { enforcementReasons?: string[]; accountActions?: string[]; entitlement?: { tier?: string; status?: string; plan?: string } | null };
const priceMatrixModes = ['regular', 'member', 'coupon', 'stacked'] as const;

function readSession(): BrowserSession {
  const accessToken = sessionStorage.getItem('groceryview:accessToken') || '';
  const userId = sessionStorage.getItem('groceryview:userId') || '';
  return { accessToken, userId };
}

function isReadyForBasketStack(offer: LoyaltyOffer) {
  const actionReady = !offer.actionRequired || offer.clipped || offer.status === 'clipped';
  const membershipReady = !offer.requiresMembership || offer.membershipEligible;
  return Boolean(offer.productId && offer.chain && (offer.savings ?? 0) > 0 && actionReady && membershipReady);
}

export function CouponLoyaltyActions() {
  const [status, setStatus] = useState<CouponStatus>('idle');
  const [message, setMessage] = useState('No anonymous coupon offers. Sign in first to load account-scoped coupon and loyalty savings.');
  const [loyalty, setLoyalty] = useState<LoyaltyOfferResponse | null>(null);
  const [subscriptionAccess, setSubscriptionAccess] = useState<SubscriptionAccessResponse | null>(null);
  const stackReadyOffers = loyalty?.offers?.filter(isReadyForBasketStack) ?? [];
  const basketOptimizerInputs = stackReadyOffers.map((offer) => ({
    key: `${offer.chain}-${offer.productId}`,
    chain: offer.chain ?? 'chain',
    productId: offer.productId ?? 'product',
    savings: offer.savings ?? 0,
    recommendation: offer.combinable === false
      ? 'Compare as an exclusive substitute against the regular item price.'
      : 'Combine with unit-price substitutions and other stackable offers.'
  }));

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
        The price matrix can compare regular, member, coupon, and stacked modes, but non-regular modes remain account-required until this response confirms eligibility.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="rounded-full bg-amber-700 px-4 py-2 text-sm font-black text-white" onClick={loadCouponOffers} type="button">Load signed-in coupon offers</button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-4">
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
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-950">Stack optimizer ready</p>
          <p className="mt-2 text-3xl font-black text-amber-800">{stackReadyOffers.length}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Offers with product, chain, clipped coupon, and membership gates satisfied can feed the basket builder cheapest-stack comparison.</p>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-lime-100 bg-lime-50 p-4">
        <p className="text-sm font-black text-slate-950">Coupon-aware basket optimizer handoff</p>
        {basketOptimizerInputs.length > 0 ? (
          <ul className="mt-3 grid gap-2 lg:grid-cols-2">
            {basketOptimizerInputs.slice(0, 4).map((input) => (
              <li className="rounded-2xl bg-white p-3 text-sm font-semibold text-lime-950" key={input.key}>
                {input.chain} · {input.productId}: {input.savings} kr eligible savings. {input.recommendation}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm font-semibold leading-6 text-lime-950">
            No offer is handed to the basket optimizer until product, chain, coupon clipping, and membership eligibility are all verified.
          </p>
        )}
      </div>
      <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4">
        <p className="text-sm font-black text-slate-950">Price matrix comparison modes</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {priceMatrixModes.map((mode) => (
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-amber-950" key={mode}>{mode}</span>
          ))}
        </div>
        <p className="mt-3 text-sm font-semibold leading-6 text-amber-950">
          Member, coupon, and stacked prices must come from account-bound loyalty offers; no anonymous coupon or membership savings are counted in the matrix.
        </p>
      </div>

      {loyalty?.offers?.length ? (
        <ul className="mt-4 grid gap-3 lg:grid-cols-2">
          {loyalty.offers.slice(0, 4).map((offer, index) => (
            <li className="rounded-2xl border border-slate-200 bg-white p-4 text-sm" key={`${offer.productId ?? 'offer'}-${index}`}>
              <p className="font-black text-slate-950">{offer.chain ?? 'chain'} · {offer.productId ?? 'product'}</p>
              <p className="mt-1 text-slate-700">{offer.savings ?? 0} kr savings · {offer.status ?? 'eligible'} {offer.actionRequired ? '· action required' : ''}</p>
              <p className="mt-1 text-slate-600">{offer.requirement ?? 'No extra coupon requirement returned.'}</p>
              <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-amber-800">
                {isReadyForBasketStack(offer) ? 'valid for basket stack optimizer' : 'blocked from stacked basket pricing'}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm font-bold text-amber-950" data-status={status}>{message}</p>
    </section>
  );
}
