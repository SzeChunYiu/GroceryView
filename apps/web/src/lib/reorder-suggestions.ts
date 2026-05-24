export type ReorderPricePoint = {
  observedAt: string;
  price: number;
};

export type ReorderStapleSignal = {
  category: string;
  currentPrice: number;
  itemName: string;
  matchedNames: string[];
  normalQuantity: number;
  priceHistory: ReorderPricePoint[];
  unit: string;
};

export type ReorderWarning = {
  currentPrice: number;
  itemName: string;
  latestSignalPrice: number;
  latestObservedAt: string;
  recommendedQuantity: number;
  risePercent: number;
  trendLabel: string;
  unit: string;
  usualPrice: number;
};

export type ReorderWarningInput = {
  itemName: string;
  quantity: string;
};

const sharpRiseThresholdPercent = 12;
const cheapNowThresholdPercent = 4;

export const stapleReorderSignals: ReorderStapleSignal[] = [
  {
    category: 'breakfast',
    currentPrice: 28.9,
    itemName: 'Oats',
    matchedNames: ['oats', 'havregryn'],
    normalQuantity: 1,
    priceHistory: [
      { observedAt: '2026-05-03', price: 24.5 },
      { observedAt: '2026-05-10', price: 25.9 },
      { observedAt: '2026-05-17', price: 27.2 },
      { observedAt: '2026-05-24', price: 31.9 }
    ],
    unit: 'bags'
  },
  {
    category: 'pantry',
    currentPrice: 52.9,
    itemName: 'Coffee',
    matchedNames: ['coffee', 'kaffe'],
    normalQuantity: 1,
    priceHistory: [
      { observedAt: '2026-05-03', price: 49.9 },
      { observedAt: '2026-05-10', price: 51.9 },
      { observedAt: '2026-05-17', price: 55.9 },
      { observedAt: '2026-05-24', price: 61.9 }
    ],
    unit: 'packages'
  },
  {
    category: 'dairy',
    currentPrice: 17.9,
    itemName: 'Milk or fil',
    matchedNames: ['milk', 'fil', 'mjolk', 'mjölk'],
    normalQuantity: 2,
    priceHistory: [
      { observedAt: '2026-05-03', price: 17.5 },
      { observedAt: '2026-05-10', price: 17.9 },
      { observedAt: '2026-05-17', price: 18.2 },
      { observedAt: '2026-05-24', price: 19.5 }
    ],
    unit: 'cartons'
  }
];

function medianFor(values: number[]) {
  const sorted = values.filter((value) => Number.isFinite(value)).sort((left, right) => left - right);
  if (sorted.length === 0) return null;
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[midpoint - 1]! + sorted[midpoint]!) / 2 : sorted[midpoint]!;
}

function percentChange(fromPrice: number, toPrice: number) {
  return fromPrice > 0 ? ((toPrice - fromPrice) / fromPrice) * 100 : 0;
}

function itemMatchesSignal(item: ReorderWarningInput, signal: ReorderStapleSignal) {
  const haystack = `${item.itemName} ${item.quantity}`.toLowerCase();
  return signal.matchedNames.some((name) => haystack.includes(name.toLowerCase()));
}

export function buildReorderWarnings(
  items: ReorderWarningInput[],
  signals: ReorderStapleSignal[] = stapleReorderSignals
): ReorderWarning[] {
  return signals
    .filter((signal) => items.some((item) => itemMatchesSignal(item, signal)))
    .map((signal) => {
      const orderedHistory = [...signal.priceHistory]
        .filter((point) => Number.isFinite(point.price) && point.price > 0)
        .sort((left, right) => left.observedAt.localeCompare(right.observedAt));
      const usualPrice = medianFor(orderedHistory.slice(0, -1).map((point) => point.price));
      const latestPrice = orderedHistory.at(-1);
      if (!usualPrice || !latestPrice) return null;

      const risePercent = percentChange(usualPrice, latestPrice.price);
      const cheapNowPercent = percentChange(signal.currentPrice, latestPrice.price);
      if (risePercent < sharpRiseThresholdPercent || cheapNowPercent < cheapNowThresholdPercent) return null;

      return {
        currentPrice: signal.currentPrice,
        itemName: signal.itemName,
        latestSignalPrice: latestPrice.price,
        latestObservedAt: latestPrice.observedAt,
        recommendedQuantity: signal.normalQuantity + 1,
        risePercent,
        trendLabel: `${signal.category} price rose ${Math.round(risePercent)}% in the latest staple signal`,
        unit: signal.unit,
        usualPrice
      };
    })
    .filter((warning): warning is ReorderWarning => warning !== null)
    .sort((left, right) => right.risePercent - left.risePercent);
}
