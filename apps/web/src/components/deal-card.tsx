import Image from 'next/image';
import { buildDealContext, type DealHistoryPoint } from '@/lib/deal-context';

const dealImageBlurDataUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDE2MCAxMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZyI+PHJlY3Qgd2lkdGg9IjE2MCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiNmOGZhZmMiLz48Y2lyY2xlIGN4PSI4MCIgY3k9IjYwIiByPSIzMiIgZmlsbD0iI2Q5ZjllYyIvPjwvc3ZnPg==';

type DealCardProps = {
  title: string;
  currentPrice: number;
  imageAlt?: string;
  imageUrl?: string | null;
  isAboveFold?: boolean;
  originalPrice?: number;
  discountStartedAt?: string;
  priceHistory?: DealHistoryPoint[];
  currency?: string;
  locale?: string;
};

function formatPrice(value: number, locale: string, currency: string) {
  return new Intl.NumberFormat(locale, { currency, style: 'currency' }).format(value);
}

export function DealCard({
  title,
  currentPrice,
  imageAlt,
  imageUrl,
  isAboveFold = false,
  originalPrice,
  discountStartedAt,
  priceHistory,
  currency = 'SEK',
  locale = 'sv-SE'
}: DealCardProps) {
  const context = buildDealContext({ currentPrice, discountStartedAt, priceHistory, currency, locale });

  return (
    <article className="rounded-2xl border border-market-ink/10 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-market-ink">{title}</h3>
          <p className="mt-2 text-2xl font-bold text-market-ink">{formatPrice(currentPrice, locale, currency)}</p>
          {originalPrice ? (
            <p className="text-sm text-market-ink/60">
              Was <span className="line-through">{formatPrice(originalPrice, locale, currency)}</span>
            </p>
          ) : null}
        </div>
        {imageUrl ? (
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-market-ink/10 bg-white">
            <Image
              alt={imageAlt ?? `${title} deal image`}
              blurDataURL={dealImageBlurDataUrl}
              className="object-contain p-2"
              fetchPriority={isAboveFold ? 'high' : 'auto'}
              fill
              loading={isAboveFold ? 'eager' : 'lazy'}
              placeholder="blur"
              preload={isAboveFold}
              sizes="(min-width: 1024px) 6rem, 5rem"
              src={imageUrl}
            />
          </div>
        ) : null}
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
    </article>
  );
}
