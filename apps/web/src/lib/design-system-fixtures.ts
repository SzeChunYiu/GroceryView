import type { DealEvaluation, ProductSummary } from '@/lib/mvp/types';
import type { FilterRailOption, SortOption } from '@/components/design-system';

export const designSystemProductFixture: ProductSummary = {
  id: 'preview-milk',
  slug: 'preview-milk',
  name: 'Standardmjölk 3%',
  brand: 'Arla',
  categorySlug: 'dairy',
  categoryName: 'Dairy',
  imageUrl: undefined,
  currentBestPrice: 15.95,
  currentBestPriceCurrency: 'SEK',
  currentBestChain: 'Willys',
  historicMedianPrice: 17.5,
  priceChangeWeeklyPct: -4.8,
  dealLabel: 'real_deal',
  isAvailable: true,
  sourceLabel: 'OpenPrices SEK observations',
  lastObservedAt: '2026-04-12T00:00:00.000Z',
  freshnessLabel: 'fresh',
  confidence: 0.86,
  confidenceLabel: 'high',
  observationCount: 24
};

export const designSystemDealFixture: DealEvaluation = {
  id: 'preview-deal-milk',
  product: designSystemProductFixture,
  chain: 'Willys',
  currentPrice: 15.95,
  currency: 'SEK',
  historicMedianPrice: 17.5,
  historicDiscountPct: 8.9,
  nearbyDiscountPct: 3.2,
  dealScore: 82,
  dealLabel: 'real_deal',
  reasons: ['Current price is below the verified historic median.', 'Nearby stores show a smaller discount on the same package size.'],
  sourceLabel: 'OpenPrices SEK observations',
  lastObservedAt: '2026-04-12T00:00:00.000Z',
  freshnessLabel: 'fresh',
  confidence: 0.86,
  confidenceLabel: 'high',
  observationCount: 24
};

export const designSystemFilterOptions: FilterRailOption[] = [
  { id: 'all', label: 'All deals', count: 128 },
  { id: 'real_deal', label: 'Real deals', count: 42 },
  { id: 'fair_discount', label: 'Fair discounts', count: 61 },
  { id: 'not_really_a_deal', label: 'Not really deals', count: 25 }
];

export const designSystemSortOptions: SortOption[] = [
  { id: 'best_deal', label: 'Best deal score' },
  { id: 'price_low', label: 'Lowest price' },
  { id: 'freshness', label: 'Most recently observed' }
];

export const designSystemChartTableFallback = {
  headers: ['Date', 'Price', 'Source'],
  rows: [
    ['2026-04-05', '15.95 kr', 'Axfood observed row'],
    ['2026-03-05', '16.95 kr', 'Axfood observed row'],
    ['2026-02-05', '17.50 kr', 'Axfood observed row']
  ]
};
