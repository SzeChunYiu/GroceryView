export type RetailerType = 'grocery' | 'variety' | 'pharmacy' | 'health_food' | 'specialty' | 'fuel_convenience' | 'unknown';

export type CrossCategoryPriceSource = {
  canonicalProductId: string;
  retailerId: string;
  retailerName: string;
  retailerType: RetailerType;
  listingId?: string;
  price: number;
  currency: string;
  observedAt: string;
  sourceUrl?: string;
  confidence?: number;
};

export type CrossCategoryBestPrice = {
  canonicalProductId: string;
  cheapest: CrossCategoryPriceSource | null;
  sources: CrossCategoryPriceSource[];
  retailerTypes: RetailerType[];
  guardrails: string[];
};

export function compareCrossCategoryPrices(input: {
  canonicalProductId: string;
  sources: readonly CrossCategoryPriceSource[];
  currency?: string;
  maxAgeDays?: number;
  now?: string;
}): CrossCategoryBestPrice {
  const nowMs = Date.parse(input.now ?? new Date().toISOString());
  const maxAgeMs = (input.maxAgeDays ?? 30) * 24 * 60 * 60 * 1000;
  const currency = input.currency;
  const sources = input.sources
    .filter((source) => source.canonicalProductId === input.canonicalProductId)
    .filter((source) => !currency || source.currency === currency)
    .filter((source) => Number.isFinite(source.price) && source.price >= 0)
    .filter((source) => {
      const observedAt = Date.parse(source.observedAt);
      return Number.isFinite(observedAt) && Number.isFinite(nowMs) ? nowMs - observedAt <= maxAgeMs : true;
    })
    .sort((left, right) => left.price - right.price || right.observedAt.localeCompare(left.observedAt) || left.retailerName.localeCompare(right.retailerName));

  return {
    canonicalProductId: input.canonicalProductId,
    cheapest: sources[0] ?? null,
    sources,
    retailerTypes: [...new Set(sources.map((source) => source.retailerType))].sort(),
    guardrails: [
      'Cross-category comparisons only include sources mapped to the same canonical product id.',
      'Variety, pharmacy, health-food, and grocery retailers can compete for best price when they carry the same SKU.',
      'Stale rows outside the configured maxAgeDays window are excluded from the best-price badge.'
    ]
  };
}
