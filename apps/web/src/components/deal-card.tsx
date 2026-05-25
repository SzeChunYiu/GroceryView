'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  affiliateDisclosureLabel,
  buildAffiliateOutboundUrl,
  trackAffiliateOutboundClick,
  type AffiliateLinkMetadata,
  trackDealShare,
  trackSponsoredPlacementImpression
} from '@/lib/analytics';
import { buildDealContext, type DealHistoryPoint } from '@/lib/deal-context';
import { dealShareUrl } from '@/lib/seo';

export type SponsoredDealPlacement = {
  disclosure?: string;
  label?: string;
  placementId?: string;
  provider: string;
  separatedFromOrganicRankings?: boolean;
  surface?: string;
};

type DealCardProps = {
  title: string;
  currentPrice: number;
  originalPrice?: number;
  discountStartedAt?: string;
  priceHistory?: DealHistoryPoint[];
  currency?: string;
  locale?: string;
  retailerName?: string;
  productId?: string;
  dealId?: string;
  outboundDealUrl?: string;
  outboundStoreUrl?: string;
  affiliateCampaignId?: string;
  sharePath?: string;
  productHref?: string;
  rankLabel?: string;
  categoryLabel?: string;
  imageAlt?: string;
  imageUrl?: string | null;
  localityLabel?: string;
  dropPercentLabel?: string;
  unitPriceDropLabel?: string;
  evidenceLabel?: string;
  replacementLabel?: string;
  sourceLabel?: string;
  sponsoredPlacement?: SponsoredDealPlacement;
  dealEndsAt?: string;
};

function formatPrice(value: number, locale: string, currency: string) {
  return new Intl.NumberFormat(locale, { currency, style: 'currency' }).format(value);
}

function outboundMetadata({
  campaignId,
  dealId,
  destinationUrl,
  placement,
  productId,
  retailerName,
  sponsored,
  surface
}: AffiliateLinkMetadata) {
  return {
    campaignId,
    dealId,
    destinationUrl,
    placement,
    productId,
    retailerName,
    sponsored,
    surface
  } satisfies AffiliateLinkMetadata;
}

function OutboundAffiliateLink({
  children,
  metadata
}: Readonly<{
  children: ReactNode;
  metadata: AffiliateLinkMetadata;
}>) {
  const disclosureKind = metadata.sponsored === false ? 'outbound' : 'affiliate';
  return (
    <div className="min-w-44 flex-1">
      <a
        className="inline-flex w-full items-center justify-center rounded-full bg-market-mint px-4 py-2 text-sm font-black text-market-ink transition hover:bg-emerald-300"
        data-affiliate-campaign={metadata.campaignId ?? metadata.surface}
        data-affiliate-disclosure={disclosureKind}
        data-affiliate-placement={metadata.placement}
        data-affiliate-retailer={metadata.retailerName}
        href={buildAffiliateOutboundUrl(metadata)}
        onClick={() => trackAffiliateOutboundClick(metadata)}
        rel="sponsored noopener noreferrer"
        target="_blank"
      >
        {children}
      </a>
      <span className="mt-2 block rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-950" data-affiliate-disclosure={disclosureKind}>
        {affiliateDisclosureLabel(metadata)}
      </span>
    </div>
  );
}

export function DealCard({
  title,
  currentPrice,
  originalPrice,
  discountStartedAt,
  priceHistory,
  currency = 'SEK',
  locale = 'sv-SE',
  retailerName = 'the retailer',
  productId,
  dealId,
  outboundDealUrl,
  outboundStoreUrl,
  affiliateCampaignId,
  sharePath,
  productHref,
  rankLabel,
  categoryLabel,
  imageAlt,
  imageUrl,
  localityLabel,
  dropPercentLabel,
  unitPriceDropLabel,
  evidenceLabel,
  replacementLabel,
  sourceLabel,
  sponsoredPlacement,
  dealEndsAt
}: DealCardProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
  const context = buildDealContext({ currentPrice, discountStartedAt, priceHistory, currency, locale });
  const dealLinkMetadata = outboundDealUrl ? outboundMetadata({
    campaignId: affiliateCampaignId,
    dealId,
    destinationUrl: outboundDealUrl,
    placement: 'deal_card',
    productId,
    retailerName,
    sponsored: true,
    surface: 'deal-card-primary'
  }) : null;
  const storeLinkMetadata = outboundStoreUrl ? outboundMetadata({
    campaignId: affiliateCampaignId,
    dealId,
    destinationUrl: outboundStoreUrl,
    placement: 'store_link',
    productId,
    retailerName,
    sponsored: false,
    surface: 'deal-card-store'
  }) : null;
  const shareUrl = useMemo(() => dealShareUrl({ dealId, path: sharePath, title }), [dealId, sharePath, title]);
  const encodedShareUrl = encodeURIComponent(shareUrl);
  const encodedShareText = encodeURIComponent(`${title} is ${formatPrice(currentPrice, locale, currency)} on GroceryView`);
  const analyticsDealId = dealId ?? sharePath ?? title;
  const sponsoredLabel = sponsoredPlacement?.label ?? 'Sponsored';
  const sponsoredProvider = sponsoredPlacement?.provider;
  const sponsoredSurface = sponsoredPlacement?.surface ?? 'discovery_rail';
  const sponsoredPlacementId = sponsoredPlacement?.placementId ?? analyticsDealId;
  const separatedFromOrganicRankings = true;
  const metaLabel = [rankLabel, categoryLabel, localityLabel].filter(Boolean).join(' · ');
  const countdownLabel = useMemo(() => {
    if (!dealEndsAt) return null;
    const endsAt = new Date(dealEndsAt).getTime();
    if (!Number.isFinite(endsAt)) return null;
    const hoursRemaining = Math.ceil((endsAt - Date.now()) / (60 * 60 * 1000));
    if (hoursRemaining <= 0) return 'Ends today';
    if (hoursRemaining <= 24) return `Ends in ${hoursRemaining}h`;
    const daysRemaining = Math.ceil(hoursRemaining / 24);
    return daysRemaining <= 7 ? `Ends in ${daysRemaining}d` : null;
  }, [dealEndsAt]);

  useEffect(() => {
    if (!sponsoredProvider) return;
    trackSponsoredPlacementImpression({
      label: sponsoredLabel,
      placementId: sponsoredPlacementId,
      provider: sponsoredProvider,
      separatedFromOrganicRankings,
      surface: sponsoredSurface
    });
  }, [separatedFromOrganicRankings, sponsoredLabel, sponsoredPlacementId, sponsoredProvider, sponsoredSurface]);

  async function copyShareLink() {
    trackDealShare({ dealId: analyticsDealId, shareUrl, channel: 'copy_link' });

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 1800);
    } catch {
      window.prompt('Copy this GroceryView deal link', shareUrl);
    }
  }

  function trackNativeShare() {
    trackDealShare({ dealId: analyticsDealId, shareUrl, channel: 'web_share' });
  }

  return (
    <article
      aria-label={sponsoredPlacement ? `${sponsoredLabel} deal placement separate from organic rankings` : undefined}
      className={`rounded-2xl border p-4 shadow-sm ${sponsoredPlacement ? 'border-amber-300 bg-amber-50/70' : 'border-market-ink/10 bg-white'}`}
      data-organic-ranking-separated={sponsoredPlacement ? String(separatedFromOrganicRankings) : undefined}
      data-sponsored-placement={sponsoredPlacement ? 'true' : undefined}
    >
      {sponsoredPlacement ? (
        <div className="mb-3 rounded-2xl border border-amber-300 bg-white p-3 text-xs font-semibold text-amber-950">
          <p className="font-black uppercase tracking-[0.18em] text-amber-800">{sponsoredLabel}</p>
          <p className="mt-1">{sponsoredPlacement.disclosure ?? 'Paid placement shown in a separate sponsored slot. It does not affect organic deal rankings.'}</p>
          <p className="mt-1 text-amber-900">Provider: {sponsoredPlacement.provider} · Organic ranking separated: {String(separatedFromOrganicRankings)}</p>
        </div>
      ) : null}
      <div className="flex items-start justify-between gap-3">
        {imageUrl ? (
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-white p-2 ring-1 ring-market-ink/10">
            <Image
              alt={imageAlt ?? `${title} deal image`}
              className="max-h-full max-w-full object-contain"
              height={96}
              loading="lazy"
              placeholder="empty"
              sizes="(min-width: 768px) 96px, 80px"
              src={imageUrl}
              width={96}
            />
          </div>
        ) : null}
        <div>
          {replacementLabel ? (
            <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-800">{replacementLabel}</p>
          ) : null}
          {metaLabel ? (
            <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-800">{metaLabel}</p>
          ) : null}
          <h3 className="text-base font-semibold text-market-ink">
            {productHref ? (
              <a className="hover:text-emerald-700 hover:underline" href={productHref}>
                {title}
              </a>
            ) : title}
          </h3>
          <p className="mt-2 text-2xl font-bold text-market-ink">{formatPrice(currentPrice, locale, currency)}</p>
          {originalPrice ? (
            <p className="text-sm text-market-ink/60">
              Was <span className="line-through">{formatPrice(originalPrice, locale, currency)}</span>
            </p>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-2">
          {countdownLabel ? (
            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-800">{countdownLabel}</span>
          ) : null}
          {context.isNewLowestPrice ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">New low</span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Deal history context">
        {sourceLabel ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">
            {sourceLabel}
          </span>
        ) : null}
        {dropPercentLabel ? (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
            {dropPercentLabel}
          </span>
        ) : null}
        {unitPriceDropLabel ? (
          <span className="rounded-full bg-market-mint/15 px-3 py-1 text-xs font-semibold text-market-ink">
            {unitPriceDropLabel}
          </span>
        ) : null}
        {context.streakLabel ? (
          <span className="rounded-full bg-market-mint/15 px-3 py-1 text-xs font-semibold text-market-ink">
            {context.streakLabel}
          </span>
        ) : null}
        {context.previousLowestLabel ? (
          <span className="rounded-full bg-market-oat px-3 py-1 text-xs font-semibold text-market-ink/80">
            {context.previousLowestLabel}
          </span>
        ) : null}
      </div>

      {evidenceLabel ? (
        <p className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-market-ink/70">
          {evidenceLabel}
        </p>
      ) : null}

      {dealLinkMetadata || storeLinkMetadata ? (
        <div className="mt-4 flex flex-wrap gap-3" aria-label="Outbound store and deal links with affiliate disclosure">
          {dealLinkMetadata ? <OutboundAffiliateLink metadata={dealLinkMetadata}>Open deal at {retailerName}</OutboundAffiliateLink> : null}
          {storeLinkMetadata ? <OutboundAffiliateLink metadata={storeLinkMetadata}>Visit {retailerName} store</OutboundAffiliateLink> : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-market-ink/10 pt-4" aria-label="Share this deal">
        <button
          type="button"
          onClick={copyShareLink}
          className="rounded-full bg-market-ink px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-market-ink/85 focus:outline-none focus:ring-2 focus:ring-market-mint"
        >
          {copyState === 'copied' ? 'Link copied' : 'Copy deal link'}
        </button>
        <a
          href={`https://twitter.com/intent/tweet?url=${encodedShareUrl}&text=${encodedShareText}`}
          onClick={trackNativeShare}
          className="rounded-full bg-market-oat px-3 py-1.5 text-xs font-semibold text-market-ink transition hover:bg-market-oat/80 focus:outline-none focus:ring-2 focus:ring-market-mint"
        >
          Share deal
        </a>
      </div>
    </article>
  );
}
