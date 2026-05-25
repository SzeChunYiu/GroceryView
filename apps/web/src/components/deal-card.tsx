'use client';

import { useMemo, useState } from 'react';
import { trackAffiliateOutboundClick, trackDealShare } from '@/lib/analytics';
import { buildDealContext, type DealHistoryPoint } from '@/lib/deal-context';
import { dealShareUrl } from '@/lib/seo';

type DealCardProps = {
  title: string;
  currentPrice: number;
  originalPrice?: number;
  discountStartedAt?: string;
  priceHistory?: DealHistoryPoint[];
  currency?: string;
  locale?: string;
  dealId?: string;
  sharePath?: string;
  retailerName?: string;
  retailerUrl?: string;
};

function formatPrice(value: number, locale: string, currency: string) {
  return new Intl.NumberFormat(locale, { currency, style: 'currency' }).format(value);
}

export function DealCard({
  title,
  currentPrice,
  originalPrice,
  discountStartedAt,
  priceHistory,
  currency = 'SEK',
  locale = 'sv-SE',
  dealId,
  sharePath,
  retailerName = 'retailer',
  retailerUrl
}: DealCardProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
  const context = buildDealContext({ currentPrice, discountStartedAt, priceHistory, currency, locale });
  const shareUrl = useMemo(() => dealShareUrl({ dealId, path: sharePath, title }), [dealId, sharePath, title]);
  const encodedShareUrl = encodeURIComponent(shareUrl);
  const encodedShareText = encodeURIComponent(`${title} is ${formatPrice(currentPrice, locale, currency)} on GroceryView`);
  const analyticsDealId = dealId ?? sharePath ?? title;
  const affiliateCampaign = 'groceryview-deal-card';
  const affiliateUrl = useMemo(() => {
    if (!retailerUrl) return null;
    try {
      const url = new URL(retailerUrl);
      url.searchParams.set('utm_source', 'groceryview');
      url.searchParams.set('utm_medium', 'affiliate');
      url.searchParams.set('utm_campaign', affiliateCampaign);
      url.searchParams.set('gv_deal_id', analyticsDealId);
      return url.toString();
    } catch {
      return retailerUrl;
    }
  }, [analyticsDealId, retailerUrl]);

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

  function trackRetailerClick() {
    if (!affiliateUrl) return;
    trackAffiliateOutboundClick({ campaign: affiliateCampaign, dealId: analyticsDealId, href: affiliateUrl, retailerName });
  }

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
        {affiliateUrl ? (
          <a
            className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-950 transition hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-market-mint"
            href={affiliateUrl}
            onClick={trackRetailerClick}
            rel="nofollow sponsored noopener noreferrer"
            target="_blank"
          >
            View at {retailerName} <span className="sr-only">(sponsored affiliate link)</span>
          </a>
        ) : null}
      </div>
      {affiliateUrl ? (
        <p className="mt-3 text-xs font-semibold leading-5 text-market-ink/70">
          Affiliate disclosure: GroceryView may earn a commission from this retailer link. Click analytics are sent only after analytics consent.
        </p>
      ) : null}
    </article>
  );
}
