import type { ReactNode } from 'react';
import { buildDealContext, type DealHistoryPoint } from '@/lib/deal-context';
import { affiliateDisclosureLabel, buildAffiliateOutboundUrl, type AffiliateLinkMetadata } from '@/lib/analytics';

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
}: AffiliateLinkMetadata & { campaignId?: string }) {
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
  affiliateCampaignId
}: DealCardProps) {
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

  return (
    <article className="rounded-2xl border border-market-ink/10 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-market-ink">{title}</h3>
          <p className="mt-2 text-2xl font-bold text-market-ink">{formatPrice(currentPrice, locale, currency)}</p>
          {originalPrice ? (
            <p className="text-sm text-market-ink/60">
              Was <span className="line-through">{formatPrice(originalPrice, locale, currency)}</span>
            </p>
          ) : null}
        </div>
        {context.isNewLowestPrice ? (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">New low</span>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Deal history context">
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

      {dealLinkMetadata || storeLinkMetadata ? (
        <div className="mt-4 flex flex-wrap gap-3" aria-label="Outbound store and deal links with affiliate disclosure">
          {dealLinkMetadata ? <OutboundAffiliateLink metadata={dealLinkMetadata}>Open deal at {retailerName}</OutboundAffiliateLink> : null}
          {storeLinkMetadata ? <OutboundAffiliateLink metadata={storeLinkMetadata}>Visit {retailerName} store</OutboundAffiliateLink> : null}
        </div>
      ) : null}
    </article>
  );
}
