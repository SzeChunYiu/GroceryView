'use client';

import { useState } from 'react';
import {
  affiliateDisclosureKind,
  affiliateDisclosureLabel,
  buildAffiliateOutboundUrl,
  type AffiliateDisclosureKind,
  type AffiliateLinkMetadata
} from '@/lib/analytics';
import { buildDealMonetizationDisclosure } from '@/lib/deal-context';

type DisclosureStatus = 'idle' | 'blocked' | 'loading' | 'ready' | 'error';
type BrowserSession = { accessToken: string; userId: string };
type AdPlacementSlot = {
  disclosure?: string;
  id?: string;
  surface?: string;
  provider?: string;
  label?: string;
  organicRankingSeparated?: boolean;
};
type AdDisclosureReport = {
  userId?: string;
  userTier?: string;
  placementPlan?: { slots?: AdPlacementSlot[]; excludedSurfaces?: string[]; affectsDealScore?: boolean };
  allowedCount?: number;
  blockedCount?: number;
  excludedSurfaces?: string[];
  premiumAdsRemoved?: boolean;
  affectsDealScore?: false;
  guardrails?: string[];
};

const defaultSponsoredPlacementSlots: AdPlacementSlot[] = [
  {
    disclosure: 'Paid grocery partner placement shown in a clearly separated discovery rail slot.',
    id: 'sponsored-discovery-rail',
    label: 'Sponsored',
    organicRankingSeparated: true,
    provider: 'GroceryView Ads',
    surface: 'discovery_rail'
  }
];

const disclosurePreviewLinks: Record<AffiliateDisclosureKind, AffiliateLinkMetadata> = {
  affiliate: {
    campaignId: 'spring-grocery-affiliate',
    dealId: 'preview-affiliate-deal',
    destinationUrl: 'https://example.com/deals/affiliate',
    disclosureKind: 'affiliate',
    placement: 'deal_card',
    productId: 'preview-product',
    retailerName: 'Example Market',
    surface: 'deal-card-primary'
  },
  outbound: {
    destinationUrl: 'https://example.com/store',
    disclosureKind: 'outbound',
    placement: 'store_link',
    retailerName: 'Example Market',
    sponsored: false,
    surface: 'deal-card-store'
  },
  sponsored: {
    campaignId: 'sponsored-slot-preview',
    dealId: 'preview-sponsored-deal',
    destinationUrl: 'https://example.com/sponsored',
    disclosureKind: 'sponsored',
    placement: 'deal_card',
    productId: 'preview-product',
    retailerName: 'Example Market',
    sponsored: true,
    surface: 'sponsored-discovery-rail'
  }
};

export function AffiliateDisclosureNotice({ metadata }: Readonly<{ metadata: AffiliateLinkMetadata }>) {
  const kind = affiliateDisclosureKind(metadata);
  const label = affiliateDisclosureLabel(metadata);
  const disclosure = buildDealMonetizationDisclosure({ kind, retailerName: metadata.retailerName });
  return (
    <div className="mt-2 block rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-950" data-affiliate-disclosure={kind}>
      <span className="block font-black uppercase tracking-[0.14em]">{disclosure.partnerLabel}</span>
      <span>{label}</span>
      <details className="mt-1">
        <summary className="cursor-pointer font-black">{disclosure.actionLabel}</summary>
        <span className="mt-1 block">{disclosure.complianceNote}</span>
      </details>
    </div>
  );
}

export function affiliateTrackedHref(metadata: AffiliateLinkMetadata) {
  return buildAffiliateOutboundUrl(metadata);
}

function readSession(): BrowserSession {
  const accessToken = sessionStorage.getItem('groceryview:accessToken') || '';
  const userId = sessionStorage.getItem('groceryview:userId') || '';
  return { accessToken, userId };
}

export function AdDisclosureActions() {
  const [status, setStatus] = useState<DisclosureStatus>('idle');
  const [message, setMessage] = useState('No anonymous ad disclosure. Sign in first to load account-scoped sponsored placement rules.');
  const [disclosure, setDisclosure] = useState<AdDisclosureReport | null>(null);
  const [previewDisclosureKind, setPreviewDisclosureKind] = useState<AffiliateDisclosureKind>('affiliate');

  function requireSession(): BrowserSession | null {
    const session = readSession();
    if (!session.accessToken || !session.userId) {
      setStatus('blocked');
      setMessage('Sign in first. No anonymous ad disclosure or sponsored ranking state is loaded from protected account endpoints.');
      return null;
    }
    setStatus('loading');
    return session;
  }

  async function loadAdDisclosure() {
    const session = requireSession();
    if (!session) return;
    const { accessToken, userId } = session;
    const response = await fetch(`/api/ads/disclosure?userId=${encodeURIComponent(userId)}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      setStatus('error');
      setMessage('Ad disclosure request was rejected by the production API.');
      return;
    }

    const body = (await response.json()) as AdDisclosureReport;
    setDisclosure(body);
    setStatus('ready');
    setMessage(`Loaded account-bound ad disclosure: ${body.allowedCount ?? 0} allowed sponsored slots and ${body.blockedCount ?? 0} blocked placements.`);
  }

  const excludedSurfaces = disclosure?.excludedSurfaces ?? disclosure?.placementPlan?.excludedSurfaces ?? [];
  const slots = disclosure?.placementPlan?.slots ?? [];
  const sponsoredSlotPreview = slots.length ? slots : defaultSponsoredPlacementSlots;
  const guardrails = disclosure?.guardrails ?? ['Sponsored placements cannot change Deal Score, basket totals, or store ordering.'];
  const previewMetadata = disclosurePreviewLinks[previewDisclosureKind];

  return (
    <section className="mt-6 rounded-3xl border border-sky-200 bg-white p-5 shadow-sm" aria-label="Ad disclosure controls">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-800">Signed-in ad disclosure</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Account-bound sponsored placement rules</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
        These controls call the protected ad disclosure endpoint with the sessionStorage bearer token. Public pages can explain GroceryView ad policy, including sponsored affiliate retailer links, but sponsored-slot eligibility, premium removals, and excluded surfaces stay tied to the signed-in account entitlement.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="rounded-full bg-sky-700 px-4 py-2 text-sm font-black text-white" onClick={loadAdDisclosure} type="button">Load signed-in ad disclosure</button>
      </div>

      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-black text-amber-950">Outbound link disclosure contract</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-amber-950">
          Store and deal links must carry affiliate metadata, open with sponsored/noopener rel attributes, and show a nearby disclosure that commissions never affect Deal Score, basket totals, or ranking.
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4" aria-label="Affiliate disclosure preview controls">
        <p className="text-sm font-black text-slate-950">Deal-card disclosure preview</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(['affiliate', 'sponsored', 'outbound'] as const).map((kind) => (
            <button
              className={`rounded-full px-3 py-1.5 text-xs font-black ${previewDisclosureKind === kind ? 'bg-slate-950 text-white' : 'bg-white text-slate-700'}`}
              key={kind}
              onClick={() => setPreviewDisclosureKind(kind)}
              type="button"
            >
              {kind}
            </button>
          ))}
        </div>
        <AffiliateDisclosureNotice metadata={previewMetadata} />
        <p className="mt-2 break-all rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-700">
          Tracked href: {affiliateTrackedHref(previewMetadata)}
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-950">premiumAdsRemoved</p>
          <p className="mt-2 text-3xl font-black text-sky-800">{disclosure?.premiumAdsRemoved ? 'Yes' : disclosure ? 'No' : '—'}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Premium entitlements can remove non-critical ads before delivery.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-950">excludedSurfaces</p>
          <p className="mt-2 text-sm font-bold text-slate-700">{excludedSurfaces.length ? excludedSurfaces.join(', ') : '—'}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Deal score and checkout decision surfaces remain protected by the disclosure report.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-950">Deal Score separation</p>
          <p className="mt-2 text-sm font-bold text-slate-700">affectsDealScore: {String(disclosure?.affectsDealScore ?? false)}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Sponsored placements cannot change Deal Score, basket totals, or store ordering.</p>
        </div>
      </div>

      {slots.length ? (
        <ul className="mt-4 grid gap-3 lg:grid-cols-2">
          {slots.slice(0, 4).map((slot, index) => (
            <li className="rounded-2xl border border-slate-200 bg-white p-4 text-sm" key={`${slot.surface ?? 'surface'}-${index}`}>
              <p className="font-black text-slate-950">{slot.surface ?? 'surface'} · {slot.provider ?? 'provider'}</p>
              <p className="mt-1 text-slate-700">{slot.label ?? 'Sponsored'} · organicRankingSeparated: {String(slot.organicRankingSeparated ?? true)}</p>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4" aria-label="Sponsored discovery rail slot preview">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-800">Sponsored discovery slots</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-amber-950">
          These labeled components can appear in discovery rails, but they remain outside organic deal rankings and cannot affect Deal Score.
        </p>
        <ul className="mt-3 grid gap-3 lg:grid-cols-2">
          {sponsoredSlotPreview.slice(0, 4).map((slot, index) => (
            <li className="rounded-2xl border border-amber-300 bg-white p-4 text-sm" key={slot.id ?? `${slot.surface ?? 'surface'}-${index}`}>
              <p className="font-black uppercase tracking-[0.18em] text-amber-800">{slot.label ?? 'Sponsored'}</p>
              <p className="mt-2 font-black text-slate-950">{slot.surface ?? 'discovery_rail'} · {slot.provider ?? 'provider'}</p>
              <p className="mt-1 font-semibold leading-6 text-slate-700">
                {slot.disclosure ?? 'Paid placement shown in a separate sponsored slot.'}
              </p>
              <p className="mt-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-900">
                organicRankingSeparated: {String(slot.organicRankingSeparated ?? true)}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <ul className="mt-4 list-disc space-y-1 rounded-2xl bg-sky-50 p-4 pl-8 text-sm font-bold text-sky-950">
        <li>Retailer outbound links must carry a sponsored disclosure, campaign parameters, and consent-aware click tracking.</li>
        {guardrails.map((guardrail) => <li key={guardrail}>{guardrail}</li>)}
      </ul>
      <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-700" data-status={status}>{message}</p>
    </section>
  );
}
