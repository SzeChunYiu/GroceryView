export type StorePriceVolatility = {
  productId: string;
  storeId: string;
  sampleCount: number;
  minPrice: number;
  maxPrice: number;
  averagePrice: number;
  volatilityScore: number;
  source: 'postgres.price_daily_or_latest_prices' | 'generated.open_prices_fixture';
};

function seedFor(value: string): number {
  return [...value].reduce((seed, char) => seed + char.charCodeAt(0), 0);
}

export function volatilityScoreFromPrices(prices: number[]): number {
  const validPrices = prices.filter((price) => Number.isFinite(price) && price > 0);
  if (validPrices.length === 0) return 0;
  const average = validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length;
  const variance = validPrices.reduce((sum, price) => sum + (price - average) ** 2, 0) / validPrices.length;
  return average === 0 ? 0 : Math.round((Math.sqrt(variance) / average) * 10000) / 100;
}

export function generatedVolatilityFallback(productId: string, storeIds: string[]): StorePriceVolatility[] {
  return [...new Set(storeIds.map((storeId) => storeId.trim()).filter(Boolean))].map((storeId) => {
    const seed = seedFor(`${productId}:${storeId}`);
    const averagePrice = 20 + (seed % 900) / 10;
    const spread = 1 + (seed % 11);
    const minPrice = Math.max(1, averagePrice - spread / 2);
    const maxPrice = averagePrice + spread / 2;

    return {
      productId,
      storeId,
      sampleCount: 7,
      minPrice: Math.round(minPrice * 100) / 100,
      maxPrice: Math.round(maxPrice * 100) / 100,
      averagePrice: Math.round(averagePrice * 100) / 100,
      volatilityScore: volatilityScoreFromPrices([minPrice, averagePrice, maxPrice]),
      source: 'generated.open_prices_fixture'
    };
  });
}
