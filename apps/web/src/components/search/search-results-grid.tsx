'use client';

import { SearchResultPreviewCard } from '@/components/preview/search-result-preview-card';
import { PublicAdSlot } from '@/components/public-ad-slot';

export type SearchResultGridCard = Readonly<{
  slug: string;
  name: string;
  brand: string;
  imageUrl?: string | null;
  categoryLabel: string;
  categorySlug: string;
  cheapestPrice: number | null;
  cheapestPriceLabel: string;
  unitPriceLabel: string;
  chainLabel: string;
  chainSlug?: string;
  sortConfidence: number;
  sortNewestObservedAt: string;
  sourceTables: string[];
  isAvailable: boolean;
}>;

type SearchResultsGridProps = Readonly<{
  cards: SearchResultGridCard[];
}>;

export function SearchResultsGrid({ cards }: SearchResultsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card, index) => (
        <div key={card.slug}>
          <SearchResultPreviewCard
            card={{
              slug: card.slug,
              name: card.name,
              brand: card.brand,
              imageUrl: card.imageUrl,
              categoryLabel: card.categoryLabel,
              categorySlug: card.categorySlug,
              cheapestPrice: card.cheapestPrice,
              cheapestPriceLabel: card.cheapestPriceLabel,
              unitPriceLabel: card.unitPriceLabel,
              chainLabel: card.chainLabel,
              sortConfidence: card.sortConfidence,
              sortNewestObservedAt: card.sortNewestObservedAt
            }}
            sourceLabel={card.sourceTables.join(' + ') || 'Verified product index'}
          />
          {index === 11 ? (
            <div className="mt-4">
              <PublicAdSlot slotId="search_after_results_12" />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
