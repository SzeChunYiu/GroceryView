import type { BasketComparisonInput } from '@groceryview/core';

export type BasketForecastChain = {
  storeId: string;
  storeName: string;
  currentTotal: number;
  forecastTotal: number;
  delta: number;
  volatilitySignal: 'low' | 'medium' | 'high';
  flyerSignal: string;
  pricedLineCount: number;
  missingLineCount: number;
};

export type BasketForecastSummary = {
  snapshotAt: string;
  forecastWindowLabel: string;
  chains: BasketForecastChain[];
  bestChain: BasketForecastChain | null;
  guardrail: string;
};

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function volatilityForItem(prices: number[]) {
  if (prices.length < 2) return 0;
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  return low > 0 ? (high - low) / low : 0;
}

function volatilityLabel(value: number): BasketForecastChain['volatilitySignal'] {
  if (value >= 0.18) return 'high';
  if (value >= 0.08) return 'medium';
  return 'low';
}

export function buildBasketForecastSummary(input: BasketComparisonInput, snapshotAt: string): BasketForecastSummary {
  const favoriteStoreIds = new Set(input.favoriteStoreIds);
  const stores = new Map<string, { storeName: string; currentTotal: number; forecastTotal: number; pricedLineCount: number; flyerLines: number; volatilityTotal: number }>();

  for (const item of input.items) {
    const favoritePrices = item.prices.filter((price) => favoriteStoreIds.has(price.storeId));
    const itemVolatility = volatilityForItem(favoritePrices.map((price) => price.price));

    for (const price of favoritePrices) {
      const row = stores.get(price.storeId) ?? {
        storeName: price.storeName,
        currentTotal: 0,
        forecastTotal: 0,
        pricedLineCount: 0,
        flyerLines: 0,
        volatilityTotal: 0
      };
      const hasFlyerSignal = price.priceType === 'member' || price.priceType === 'promotion';
      const directionalChange = itemVolatility * (hasFlyerSignal ? -0.35 : 0.4);
      row.currentTotal += price.price * item.quantity;
      row.forecastTotal += price.price * (1 + directionalChange) * item.quantity;
      row.pricedLineCount += 1;
      row.flyerLines += hasFlyerSignal ? 1 : 0;
      row.volatilityTotal += itemVolatility;
      stores.set(price.storeId, row);
    }
  }

  const chains = input.favoriteStoreIds
    .map((storeId) => {
      const row = stores.get(storeId);
      if (!row) return null;
      const averageVolatility = row.pricedLineCount ? row.volatilityTotal / row.pricedLineCount : 0;
      const currentTotal = roundMoney(row.currentTotal);
      const forecastTotal = roundMoney(row.forecastTotal);
      return {
        storeId,
        storeName: row.storeName,
        currentTotal,
        forecastTotal,
        delta: roundMoney(forecastTotal - currentTotal),
        volatilitySignal: volatilityLabel(averageVolatility),
        flyerSignal: row.flyerLines > 0 ? `${row.flyerLines} flyer/member line${row.flyerLines === 1 ? '' : 's'} pulling forecast down` : 'No flyer signal; volatility nudges forecast up',
        pricedLineCount: row.pricedLineCount,
        missingLineCount: input.items.length - row.pricedLineCount
      } satisfies BasketForecastChain;
    })
    .filter((chain): chain is BasketForecastChain => chain !== null)
    .sort((a, b) => a.forecastTotal - b.forecastTotal || a.storeName.localeCompare(b.storeName, 'sv'));

  return {
    snapshotAt,
    forecastWindowLabel: 'Next weekly basket',
    chains,
    bestChain: chains[0] ?? null,
    guardrail: 'Forecast uses only observed visible favorite-store prices, cross-store volatility, and explicit member/promotion price rows; missing lines are counted, not estimated.'
  };
}
