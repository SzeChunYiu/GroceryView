export type DealHistoryPoint = {
  price: number;
  observedAt?: string;
};

export type DealContextInput = {
  currentPrice: number;
  originalPrice?: number;
  discountStartedAt?: string;
  priceHistory?: DealHistoryPoint[];
  currency?: string;
  locale?: string;
  now?: Date;
};

export type DealContext = {
  streakDays?: number;
  streakLabel?: string;
  previousLowestPrice?: number;
  previousLowestLabel?: string;
  isNewLowestPrice: boolean;
};

const dayInMs = 24 * 60 * 60 * 1000;

function formatPrice(value: number, locale: string, currency: string) {
  return new Intl.NumberFormat(locale, { currency, style: 'currency' }).format(value);
}

function parseDate(value?: string) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? undefined : date;
}

export function buildDealContext({
  currentPrice,
  discountStartedAt,
  priceHistory = [],
  currency = 'SEK',
  locale = 'sv-SE',
  now = new Date()
}: DealContextInput): DealContext {
  const startedAt = parseDate(discountStartedAt);
  const streakDays = startedAt ? Math.max(1, Math.floor((now.getTime() - startedAt.getTime()) / dayInMs) + 1) : undefined;
  const previousLowestPrice = priceHistory.length > 0 ? Math.min(...priceHistory.map((point) => point.price)) : undefined;

  return {
    streakDays,
    streakLabel: streakDays ? `Discounted ${streakDays} ${streakDays === 1 ? 'day' : 'days'}` : undefined,
    previousLowestPrice,
    previousLowestLabel:
      previousLowestPrice === undefined ? undefined : `Previous low ${formatPrice(previousLowestPrice, locale, currency)}`,
    isNewLowestPrice: previousLowestPrice === undefined ? false : currentPrice <= previousLowestPrice
  };
}
