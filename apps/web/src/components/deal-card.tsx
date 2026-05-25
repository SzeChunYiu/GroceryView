'use client';

import { useMemo, useState } from 'react';
import { trackDealShare } from '@/lib/analytics';
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
  categoryLabel?: string;
  replacementLabel?: string;
  sourceLabel?: string;
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
  categoryLabel,
  replacementLabel,
  sourceLabel
}: DealCardProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
  const context = buildDealContext({ currentPrice, discountStartedAt, priceHistory, currency, locale });
  const shareUrl = useMemo(() => dealShareUrl({ dealId, path: sharePath, title }), [dealId, sharePath, title]);
  const encodedShareUrl = encodeURIComponent(shareUrl);
  const encodedShareText = encodeURIComponent(`${title} is ${formatPrice(currentPrice, locale, currency)} on GroceryView`);
  const analyticsDealId = dealId ?? sharePath ?? title;

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
    <article className="rounded-2xl border border-market-ink/10 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          {replacementLabel ? (
            <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-800">{replacementLabel}</p>
          ) : null}
          <h3 className="text-base font-semibold text-market-ink">{title}</h3>
          {categoryLabel ? <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-market-ink/55">{categoryLabel}</p> : null}
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
        {sourceLabel ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">
            {sourceLabel}
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
