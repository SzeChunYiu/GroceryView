export type FreshnessLabel = 'fresh' | 'aging' | 'stale' | 'unknown';
export type ConfidenceLabel = 'high' | 'medium' | 'low' | 'unknown';
export type DealLabel = 'real_deal' | 'fair_discount' | 'not_really_a_deal' | 'unknown';

export type VerifiedEvidence = {
  sourceLabel: string;
  lastObservedAt: string;
  freshnessLabel: FreshnessLabel;
  confidence: number;
  confidenceLabel: ConfidenceLabel;
  observationCount: number;
};

export type ProductSummary = VerifiedEvidence & {
  id: string;
  slug: string;
  name: string;
  brand?: string;
  categorySlug: string;
  categoryName: string;
  imageUrl?: string;
  currentBestPrice?: number;
  currentBestPriceCurrency: 'SEK';
  currentBestChain?: string;
  historicMedianPrice?: number;
  priceChangeWeeklyPct?: number;
  dealLabel?: DealLabel;
  isAvailable?: boolean;
};

export type DealEvaluation = VerifiedEvidence & {
  id: string;
  product: ProductSummary;
  chain?: string;
  currentPrice: number;
  currency: 'SEK';
  historicMedianPrice?: number;
  historicDiscountPct?: number;
  nearbyDiscountPct?: number;
  dealScore: number;
  dealLabel: DealLabel;
  reasons: string[];
};

export type IndexPoint = { date: string; value: number };

export type CategoryIndexRow = VerifiedEvidence & {
  categorySlug: string;
  categoryName: string;
  weeklyChangePct?: number;
  threeMonthChangePct?: number;
  oneYearChangePct?: number;
  sparkline: IndexPoint[];
  cheapestChain?: string;
  mostExpensiveChain?: string;
};

export type ChainIndexSeries = {
  chain: string;
  region: string;
  indexType: string;
  points: IndexPoint[];
  weeklyChangePct?: number;
  sourceLabel: string;
  confidence: number;
  observationCount: number;
};

export type MarketMover = {
  productSlug: string;
  productName: string;
  categoryLabel: string;
  changePercent: number;
  latestPrice: number;
  sourceLabel: string;
  confidenceLabel: ConfidenceLabel;
};

export type MarketOverview = {
  selectedRegion: string;
  selectedIndexType: string;
  lastUpdatedAt: string;
  confidenceLabel: ConfidenceLabel;
  chainIndexSeries: ChainIndexSeries[];
  categoryIndexRows: CategoryIndexRow[];
  biggestMovers: MarketMover[];
};

export type CategoryMarketData = {
  categorySlug: string;
  categoryName: string;
  overview: MarketOverview;
  bestDeals: DealEvaluation[];
  chainCards: Array<{ chain: string; productCount: number; medianSpreadPct?: number }>;
  subcategories: Array<{ slug: string; label: string; productCount: number }>;
  productPreview: ProductSummary[];
};

export type BrowseCategoryCard = {
  slug: string;
  label: string;
  productCount: number;
  hasVerifiedPrices: boolean;
};

export type WatchlistPageData = {
  signedIn: boolean;
  productItems: ProductSummary[];
  storeItems: Array<{ slug: string; name: string; chain: string }>;
  categoryItems: Array<{ slug: string; label: string }>;
};
