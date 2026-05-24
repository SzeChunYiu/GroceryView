import type { AdaptiveProductCard } from './verified-data';

export type VolatilityFilter = 'all' | 'stable' | 'watch' | 'volatile';
export type VolatilityBand = Exclude<VolatilityFilter, 'all'>;

export const volatilityFilterOptions: Array<{ value: VolatilityFilter; label: string; help: string }> = [
  { value: 'all', label: 'All volatility', help: 'Show every verified product card.' },
  { value: 'stable', label: 'Stable', help: 'Show cards whose observed 7-day price range stayed within 2%.' },
  { value: 'watch', label: 'Watch', help: 'Show cards with moderate movement or too little history for a stable call.' },
  { value: 'volatile', label: 'Volatile', help: 'Show cards whose observed 7-day price range moved at least 8%.' }
];

export function volatilityBadgeForProductCard(card: Pick<AdaptiveProductCard, 'sparklinePoints' | 'sparklineWindowDays'>) {
  const prices = card.sparklinePoints.map((point) => point.price).filter((price) => Number.isFinite(price));
  if (prices.length < 2) {
    return {
      band: 'watch' as VolatilityBand,
      label: 'Watch',
      rangePercent: null,
      detail: `Needs at least two observed points in the ${card.sparklineWindowDays}-day price history before calling the product stable or volatile.`
    };
  }

  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  const rangePercent = average > 0 ? ((high - low) / average) * 100 : 0;
  const band: VolatilityBand = rangePercent >= 8 ? 'volatile' : rangePercent <= 2 ? 'stable' : 'watch';

  return {
    band,
    label: band === 'stable' ? 'Stable' : band === 'volatile' ? 'Volatile' : 'Watch',
    rangePercent,
    detail: `${card.sparklineWindowDays}-day observed price range moved ${Math.round(rangePercent)}%; this badge uses loaded price-history card data only.`
  };
}

export function matchesVolatilityFilter(card: AdaptiveProductCard, filter: VolatilityFilter) {
  return filter === 'all' || volatilityBadgeForProductCard(card).band === filter;
}
