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

export type SeasonalProduceMonthPoint = {
  monthIndex?: number;
  monthLabel: string;
  historicalMonthlyAverage?: number | null;
  historicalMonthlyAverageLabel?: string;
};

export type SeasonalProduceInput = {
  slug: string;
  productName: string;
  brand?: string;
  categoryLabel: string;
  bestBuyMonth: string;
  bestBuyMonthIndex?: number;
  confidenceLabel: string;
  historicalMonthlyAverageLabel: string;
  monthlyAverages?: SeasonalProduceMonthPoint[];
  savingsVsTypicalLabel: string;
  typicalMonthlyAverageLabel: string;
};

export type SeasonalDealInput = {
  categoryLabel?: string;
  categorySlug?: string;
  evidenceLabel?: string;
  price?: number;
  productName: string;
  productSlug?: string;
  productId?: string;
  storeName?: string;
};

export type ExpiringPromotionInput = {
  currentPrice: number;
  expiresAt: string;
  id: string;
  markdownPercent: number;
  originalPrice: number;
  productId: string;
  productName: string;
  reportedAt: string;
  storeName: string;
  verificationCount?: number;
};

export type ExpiringPromotionRailItem = ExpiringPromotionInput & {
  currentPriceLabel: string;
  evidenceLabel: string;
  hoursRemaining: number;
  originalPriceLabel: string;
  urgencyLabel: string;
};

export type SeasonalProduceDiscoveryCard = {
  slug: string;
  productName: string;
  brand?: string;
  categoryLabel: string;
  bestBuyMonth: string;
  peakMonths: string[];
  typicalPriceRangeLabel: string;
  historicalMonthlyAverageLabel: string;
  savingsVsTypicalLabel: string;
  confidenceLabel: string;
  linkedCurrentDeals: Array<{
    productName: string;
    productSlug: string;
    storeName?: string;
    priceLabel?: string;
    evidenceLabel?: string;
  }>;
};

const dayInMs = 24 * 60 * 60 * 1000;
const seasonalMonthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

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

function peakMonthsFor(row: SeasonalProduceInput) {
  if (typeof row.bestBuyMonthIndex !== 'number') return [row.bestBuyMonth];
  const idx = row.bestBuyMonthIndex;
  return [-1, 0, 1].map((offset) => seasonalMonthLabels[(idx + offset + 12) % 12]!);
}

function typicalPriceRangeLabel(row: SeasonalProduceInput) {
  const averages = (row.monthlyAverages ?? [])
    .map((month) => month.historicalMonthlyAverage)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

  if (averages.length === 0) {
    return `Typical historical month ${row.typicalMonthlyAverageLabel}`;
  }

  const low = Math.min(...averages);
  const high = Math.max(...averages);
  return `Typical observed range ${formatPrice(low, 'sv-SE', 'SEK')} - ${formatPrice(high, 'sv-SE', 'SEK')}`;
}

function normalizedTokens(value: string | undefined) {
  return new Set(
    (value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .filter((token) => token.length >= 3)
  );
}

function isLinkedSeasonalDeal(row: SeasonalProduceInput, deal: SeasonalDealInput) {
  if (deal.productSlug === row.slug || deal.productId === row.slug) return true;
  if (deal.categoryLabel && deal.categoryLabel === row.categoryLabel) return true;

  const rowTokens = normalizedTokens(row.productName);
  const dealTokens = normalizedTokens(deal.productName);
  return [...rowTokens].some((token) => dealTokens.has(token));
}

export function buildExpiringPromotionRail({
  basketProductIds,
  limit = 4,
  promotions,
  windowHours = 36,
  now = new Date()
}: {
  basketProductIds: readonly string[];
  limit?: number;
  now?: Date;
  promotions: ExpiringPromotionInput[];
  windowHours?: number;
}): ExpiringPromotionRailItem[] {
  const basketIds = new Set(basketProductIds);
  const windowMs = windowHours * 60 * 60 * 1000;
  const nowMs = now.getTime();

  return promotions
    .map((promotion) => {
      const expiresMs = Date.parse(promotion.expiresAt);
      return { expiresMs, promotion };
    })
    .filter(({ expiresMs, promotion }) => (
      basketIds.has(promotion.productId)
      && Number.isFinite(expiresMs)
      && expiresMs > nowMs
      && expiresMs - nowMs <= windowMs
    ))
    .sort((left, right) => left.expiresMs - right.expiresMs || right.promotion.markdownPercent - left.promotion.markdownPercent)
    .slice(0, limit)
    .map(({ expiresMs, promotion }) => {
      const hoursRemaining = Math.max(1, Math.ceil((expiresMs - nowMs) / (60 * 60 * 1000)));
      return {
        ...promotion,
        currentPriceLabel: formatPrice(promotion.currentPrice, 'sv-SE', 'SEK'),
        evidenceLabel: `${promotion.verificationCount ?? 0} community checks · reported ${promotion.reportedAt.slice(0, 10)}`,
        hoursRemaining,
        originalPriceLabel: formatPrice(promotion.originalPrice, 'sv-SE', 'SEK'),
        urgencyLabel: hoursRemaining <= 12 ? 'expires today' : `expires in ${hoursRemaining}h`
      };
    });
}

export function buildSeasonalProduceDiscoveryCards({
  deals,
  limit = 6,
  rows
}: {
  deals: SeasonalDealInput[];
  limit?: number;
  rows: SeasonalProduceInput[];
}): SeasonalProduceDiscoveryCard[] {
  return rows.slice(0, limit).map((row) => ({
    slug: row.slug,
    productName: row.productName,
    brand: row.brand,
    categoryLabel: row.categoryLabel,
    bestBuyMonth: row.bestBuyMonth,
    peakMonths: peakMonthsFor(row),
    typicalPriceRangeLabel: typicalPriceRangeLabel(row),
    historicalMonthlyAverageLabel: row.historicalMonthlyAverageLabel,
    savingsVsTypicalLabel: row.savingsVsTypicalLabel,
    confidenceLabel: row.confidenceLabel,
    linkedCurrentDeals: deals
      .filter((deal) => isLinkedSeasonalDeal(row, deal))
      .slice(0, 2)
      .map((deal) => ({
        productName: deal.productName,
        productSlug: deal.productSlug ?? deal.productId ?? row.slug,
        storeName: deal.storeName,
        priceLabel: typeof deal.price === 'number' ? formatPrice(deal.price, 'sv-SE', 'SEK') : undefined,
        evidenceLabel: deal.evidenceLabel
      }))
  }));
}
