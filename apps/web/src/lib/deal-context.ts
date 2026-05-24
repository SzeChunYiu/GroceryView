export type DealPricePoint = {
  price: number;
  observedAt: string;
};

export type DealHistoryContext = {
  discountStreakDays: number;
  previousLowestPrice: number | null;
  previousLowestObservedAt: string | null;
  urgency: 'new-low' | 'steady-deal' | 'watch';
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function buildDealHistoryContext(history: DealPricePoint[], currentPrice: number, currentDate = new Date()) {
  const orderedHistory = [...history].sort((first, second) => Date.parse(second.observedAt) - Date.parse(first.observedAt));
  const previousPrices = orderedHistory.filter((point) => Date.parse(point.observedAt) < currentDate.getTime());
  const previousLowest = previousPrices.reduce<DealPricePoint | null>(
    (lowest, point) => (!lowest || point.price < lowest.price ? point : lowest),
    null
  );

  let discountStreakDays = 0;

  for (const point of orderedHistory) {
    if (point.price <= currentPrice) {
      discountStreakDays += 1;
    } else {
      break;
    }
  }

  const previousLowestPrice = previousLowest?.price ?? null;
  const previousLowestObservedAt = previousLowest?.observedAt ?? null;
  const daysSincePreviousLowest = previousLowestObservedAt
    ? Math.max(1, Math.round((currentDate.getTime() - Date.parse(previousLowestObservedAt)) / DAY_MS))
    : null;

  return {
    discountStreakDays,
    previousLowestPrice,
    previousLowestObservedAt,
    daysSincePreviousLowest,
    urgency: previousLowestPrice === null || currentPrice <= previousLowestPrice ? 'new-low' : discountStreakDays >= 7 ? 'steady-deal' : 'watch'
  };
}

export function formatDealStreak(days: number) {
  if (days <= 0) {
    return 'New discount';
  }

  return `${days} day${days === 1 ? '' : 's'} discounted`;
}
