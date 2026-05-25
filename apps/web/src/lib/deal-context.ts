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

export type DealExplanationFactor = {
  label: string;
  detail: string;
};

export type DealExplanationPanel = {
  summary: string;
  factors: DealExplanationFactor[];
};

export type DealExplanationInput = {
  chainSpreadLabel?: string;
  confidenceLabel?: string;
  evidenceLabel?: string;
  freshnessLabel?: string;
  rankLabel?: string;
  unitPriceBaselineLabel?: string;
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

export type ExpiringDealUrgencyInput = {
  category?: string;
  hoursUntilExpiry: number;
  markdownPercent: number;
  productName: string;
  radarScore?: number;
  storeName?: string;
  verificationCount?: number;
};

export type ExpiringDealUrgencyRank = {
  urgencyRank: number;
  urgencyScore: number;
  urgencySummary: string;
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

export type BasketChainPrice = {
  chain: string;
  price: number;
};

export type BasketStackItem = {
  id: string;
  name?: string;
  chainPrices?: BasketChainPrice[];
};

export type BasketStackOffer = {
  id?: string;
  productId: string;
  chain: string;
  type: 'coupon' | 'loyalty' | 'promotion';
  amount: number;
  label?: string;
  combinable?: boolean;
  isActive?: boolean;
  isClipped?: boolean;
  requiresAction?: boolean;
  requiresMembership?: boolean;
  membershipEligible?: boolean;
};

export type BasketItemStack = {
  itemId: string;
  itemName?: string;
  basePrice: number;
  finalPrice: number;
  savings: number;
  appliedOffers: BasketStackOffer[];
};

export type BasketChainStack = {
  chain: string;
  subtotal: number;
  total: number;
  savings: number;
  totalLabel: string;
  savingsLabel: string;
  items: BasketItemStack[];
};

export type BasketSubstitutionCandidate = BasketStackItem & {
  replacesItemId: string;
  substitutionLabel?: string;
};

export type CouponAwareBasketOptimization = BasketChainStack & {
  substitutionCount: number;
  substitutionLabels: string[];
  recommendationLabel: string;
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

export function buildDealExplanationPanel({
  chainSpreadLabel,
  confidenceLabel,
  evidenceLabel,
  freshnessLabel,
  rankLabel,
  unitPriceBaselineLabel
}: DealExplanationInput): DealExplanationPanel {
  const factors: DealExplanationFactor[] = [
    rankLabel ? { label: 'Ranking signal', detail: rankLabel } : null,
    unitPriceBaselineLabel ? { label: 'Unit-price baseline', detail: unitPriceBaselineLabel } : null,
    chainSpreadLabel ? { label: 'Chain spread', detail: chainSpreadLabel } : null,
    freshnessLabel ? { label: 'Freshness', detail: freshnessLabel } : null,
    confidenceLabel ? { label: 'Confidence', detail: confidenceLabel } : null,
    evidenceLabel ? { label: 'Evidence', detail: evidenceLabel } : null
  ].filter((factor): factor is DealExplanationFactor => factor !== null);

  return {
    summary: factors.length > 0
      ? `Why ranked: ${factors.slice(0, 3).map((factor) => factor.label.toLocaleLowerCase('sv-SE')).join(', ')}`
      : 'Why ranked: price and availability signals',
    factors: factors.length > 0 ? factors : [{ label: 'Deal ranking', detail: 'Ranked from the current observed price and available retailer evidence.' }]
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

function scoreUserRelevance(item: ExpiringDealUrgencyInput, preferredCategories: Set<string>, preferredTerms: Set<string>) {
  const categoryScore = item.category && preferredCategories.has(item.category.toLowerCase()) ? 10 : 0;
  const itemTokens = normalizedTokens(`${item.productName} ${item.storeName ?? ''}`);
  const termScore = [...preferredTerms].some((term) => itemTokens.has(term)) ? 8 : 0;
  return categoryScore + termScore;
}

export function rankExpiringDealsByUrgency<T extends ExpiringDealUrgencyInput>(
  items: T[],
  options: {
    preferredCategories?: string[];
    preferredTerms?: string[];
  } = {}
): Array<T & ExpiringDealUrgencyRank> {
  const preferredCategories = new Set((options.preferredCategories ?? []).map((category) => category.toLowerCase()));
  const preferredTerms = new Set((options.preferredTerms ?? []).flatMap((term) => [...normalizedTokens(term)]));

  return items
    .map((item) => {
      const hoursScore = Math.max(0, Math.min(45, ((48 - item.hoursUntilExpiry) / 48) * 45));
      const discountScore = Math.max(0, Math.min(30, (item.markdownPercent / 50) * 30));
      const relevanceScore = scoreUserRelevance(item, preferredCategories, preferredTerms);
      const evidenceScore = Math.min(10, (item.verificationCount ?? 0) * 4);
      const urgencyScore = Math.round(hoursScore + discountScore + relevanceScore + evidenceScore + Math.min(item.radarScore ?? 0, 100) / 10);

      return {
        ...item,
        urgencyRank: 0,
        urgencyScore,
        urgencySummary: `${Math.round(hoursScore)} time · ${Math.round(discountScore)} discount · ${Math.round(relevanceScore)} relevance`
      };
    })
    .sort((left, right) => (
      right.urgencyScore - left.urgencyScore
      || left.hoursUntilExpiry - right.hoursUntilExpiry
      || right.markdownPercent - left.markdownPercent
      || left.productName.localeCompare(right.productName)
    ))
    .map((item, index) => ({ ...item, urgencyRank: index + 1 }));
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

function isValidStackOffer(offer: BasketStackOffer) {
  if (offer.isActive === false) return false;
  if (offer.requiresAction && !offer.isClipped) return false;
  if (offer.requiresMembership && !offer.membershipEligible) return false;
  return offer.amount > 0;
}

function bestItemStack(item: BasketStackItem, chainPrice: BasketChainPrice, offers: BasketStackOffer[]): BasketItemStack {
  const matchingOffers = offers.filter(
    (offer) => offer.productId === item.id && offer.chain === chainPrice.chain && isValidStackOffer(offer)
  );
  const combinableOffers = matchingOffers.filter((offer) => offer.combinable !== false);
  const exclusiveOffers = matchingOffers.filter((offer) => offer.combinable === false);
  const stackCandidates = [
    combinableOffers,
    ...exclusiveOffers.map((offer) => [offer])
  ];

  const bestOffers = stackCandidates.reduce<BasketStackOffer[]>((best, candidate) => {
    const bestSavings = best.reduce((sum, offer) => sum + offer.amount, 0);
    const candidateSavings = candidate.reduce((sum, offer) => sum + offer.amount, 0);
    return candidateSavings > bestSavings ? candidate : best;
  }, []);
  const savings = Math.min(chainPrice.price, bestOffers.reduce((sum, offer) => sum + offer.amount, 0));

  return {
    itemId: item.id,
    itemName: item.name,
    basePrice: chainPrice.price,
    finalPrice: Math.max(0, chainPrice.price - savings),
    savings,
    appliedOffers: bestOffers
  };
}

function chainPriceFor(item: BasketStackItem, chain: string) {
  return item.chainPrices?.find((price) => price.chain === chain);
}

function couponAwareChoiceFor(
  item: BasketStackItem,
  chain: string,
  offers: BasketStackOffer[],
  substitutes: BasketSubstitutionCandidate[]
) {
  const choices = [
    { isSubstitute: false, originalItem: item, item },
    ...substitutes
      .filter((substitute) => substitute.replacesItemId === item.id)
      .map((substitute) => ({ isSubstitute: true, originalItem: item, item: substitute }))
  ];

  return choices
    .flatMap((choice) => {
      const chainPrice = chainPriceFor(choice.item, chain);
      return chainPrice ? [{ ...choice, stack: bestItemStack(choice.item, chainPrice, offers) }] : [];
    })
    .sort((left, right) => (
      left.stack.finalPrice - right.stack.finalPrice
      || right.stack.savings - left.stack.savings
      || Number(left.isSubstitute) - Number(right.isSubstitute)
      || (left.item.name ?? left.item.id).localeCompare(right.item.name ?? right.item.id)
    ))[0];
}

type CouponAwareChoice = NonNullable<ReturnType<typeof couponAwareChoiceFor>>;

export function buildCouponAwareBasketOptimization({
  currency = 'SEK',
  items,
  locale = 'sv-SE',
  offers = [],
  substitutes = []
}: {
  currency?: string;
  items: BasketStackItem[];
  locale?: string;
  offers?: BasketStackOffer[];
  substitutes?: BasketSubstitutionCandidate[];
}): CouponAwareBasketOptimization[] {
  const chainNames = [...new Set([...items, ...substitutes].flatMap((item) => item.chainPrices?.map((price) => price.chain) ?? []))];

  return chainNames
    .flatMap((chain) => {
      const choices = items.map((item) => couponAwareChoiceFor(item, chain, offers, substitutes));
      if (choices.some((choice) => choice === undefined)) return [];

      const chosen = choices.filter((choice): choice is CouponAwareChoice => choice !== undefined);
      const stackedItems = chosen.map((choice) => choice.stack);
      const subtotal = stackedItems.reduce((sum, item) => sum + item.basePrice, 0);
      const total = stackedItems.reduce((sum, item) => sum + item.finalPrice, 0);
      const savings = subtotal - total;
      const substitutionLabels = chosen
        .filter((choice) => choice.isSubstitute)
        .map((choice) => {
          const fallback = `Swap ${choice.originalItem.name ?? choice.originalItem.id} for ${choice.item.name ?? choice.item.id}`;
          return 'substitutionLabel' in choice.item && choice.item.substitutionLabel ? choice.item.substitutionLabel : fallback;
        });

      return [{
        chain,
        subtotal,
        total,
        savings,
        totalLabel: formatPrice(total, locale, currency),
        savingsLabel: formatPrice(savings, locale, currency),
        items: stackedItems,
        substitutionCount: substitutionLabels.length,
        substitutionLabels,
        recommendationLabel: substitutionLabels.length > 0
          ? `${chain}: ${substitutionLabels.length} substitution${substitutionLabels.length === 1 ? '' : 's'} plus eligible coupons`
          : `${chain}: keep selected items and apply eligible coupons`
      }];
    })
    .sort((a, b) => a.total - b.total || b.savings - a.savings || b.substitutionCount - a.substitutionCount || a.chain.localeCompare(b.chain));
}

export function buildBasketCouponStackOptimizer({
  currency = 'SEK',
  items,
  locale = 'sv-SE',
  offers = []
}: {
  currency?: string;
  items: BasketStackItem[];
  locale?: string;
  offers?: BasketStackOffer[];
}): BasketChainStack[] {
  const chains = [...new Set(items.flatMap((item) => item.chainPrices?.map((price) => price.chain) ?? []))];

  return chains
    .map((chain) => {
      const stackedItems = items.flatMap((item) => {
        const chainPrice = item.chainPrices?.find((price) => price.chain === chain);
        return chainPrice ? [bestItemStack(item, chainPrice, offers)] : [];
      });
      const subtotal = stackedItems.reduce((sum, item) => sum + item.basePrice, 0);
      const total = stackedItems.reduce((sum, item) => sum + item.finalPrice, 0);
      const savings = subtotal - total;

      return {
        chain,
        subtotal,
        total,
        savings,
        totalLabel: formatPrice(total, locale, currency),
        savingsLabel: formatPrice(savings, locale, currency),
        items: stackedItems
      };
    })
    .filter((stack) => stack.items.length === items.length)
    .sort((a, b) => a.total - b.total || b.savings - a.savings || a.chain.localeCompare(b.chain));
}
