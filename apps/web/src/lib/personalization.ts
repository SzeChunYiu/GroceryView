export type HouseholdCategorySignal = {
  householdId: string;
  categorySlug: string;
  clicks: number;
  conversions: number;
};

export type AccountReorderSignalType = 'favorite' | 'watchlist' | 'pantry' | 'recurring_list';

export type AccountReorderSignal = {
  productId: string;
  productName: string;
  categoryLabel: string;
  currentPriceLabel: string;
  signal: AccountReorderSignalType;
  confidence: number;
  urgency: number;
  reason: string;
};

export type AccountReorderRecommendation = {
  productId: string;
  productName: string;
  categoryLabel: string;
  currentPriceLabel: string;
  confidenceLabel: 'high' | 'medium' | 'low';
  evidenceSignals: AccountReorderSignalType[];
  primaryReason: string;
  score: number;
};

export const defaultHouseholdId = 'stockholm-family-demo';

export const householdCategorySignals: HouseholdCategorySignal[] = [
  { householdId: defaultHouseholdId, categorySlug: 'mejeri-ost-agg', clicks: 18, conversions: 7 },
  { householdId: defaultHouseholdId, categorySlug: 'frukt-gront', clicks: 16, conversions: 6 },
  { householdId: defaultHouseholdId, categorySlug: 'brod-bageri', clicks: 10, conversions: 5 },
  { householdId: 'new-arrival-demo', categorySlug: 'varldens-mat', clicks: 22, conversions: 8 },
  { householdId: 'new-arrival-demo', categorySlug: 'skafferi', clicks: 14, conversions: 6 },
  { householdId: 'new-arrival-demo', categorySlug: 'frys', clicks: 9, conversions: 3 },
];

export const accountReorderSignals: AccountReorderSignal[] = [
  {
    productId: 'kaffe-mellanrost',
    productName: 'Kaffe mellanrost',
    categoryLabel: 'Pantry staples',
    currentPriceLabel: '49.90 SEK',
    signal: 'favorite',
    confidence: 0.84,
    urgency: 7,
    reason: 'Favorited staple with repeated account opens before weekly shops.'
  },
  {
    productId: 'kaffe-mellanrost',
    productName: 'Kaffe mellanrost',
    categoryLabel: 'Pantry staples',
    currentPriceLabel: '49.90 SEK',
    signal: 'recurring_list',
    confidence: 0.88,
    urgency: 8,
    reason: 'Appears in the recurring basket and is due for the next shop.'
  },
  {
    productId: 'havregryn-extra-fylliga',
    productName: 'Havregryn extra fylliga',
    categoryLabel: 'Breakfast',
    currentPriceLabel: '21.90 SEK',
    signal: 'pantry',
    confidence: 0.78,
    urgency: 9,
    reason: 'Pantry quantity is low and the item is usually consumed weekly.'
  },
  {
    productId: 'havregryn-extra-fylliga',
    productName: 'Havregryn extra fylliga',
    categoryLabel: 'Breakfast',
    currentPriceLabel: '21.90 SEK',
    signal: 'watchlist',
    confidence: 0.72,
    urgency: 6,
    reason: 'Watched breakfast staple has a current price inside the shopper target range.'
  },
  {
    productId: 'bananer-klass-1',
    productName: 'Bananer klass 1',
    categoryLabel: 'Fresh produce',
    currentPriceLabel: '24.90 SEK/kg',
    signal: 'recurring_list',
    confidence: 0.7,
    urgency: 6,
    reason: 'Recurring fresh item commonly added before weekend shopping.'
  }
];

type CategoryRankInput = {
  slug: string;
};

type LandingShortcutInput = {
  href: string;
  categorySlug?: string;
};

const conversionWeight = 4;
const demoHistoryWeights = [
  { clicks: 12, conversions: 4 },
  { clicks: 18, conversions: 7 },
  { clicks: 10, conversions: 5 },
  { clicks: 16, conversions: 6 },
  { clicks: 8, conversions: 3 },
  { clicks: 6, conversions: 2 },
  { clicks: 4, conversions: 1 },
  { clicks: 2, conversions: 1 },
];

export function buildDemoHouseholdCategorySignals<T extends CategoryRankInput>(
  categories: readonly T[],
  householdId = defaultHouseholdId,
) {
  return categories.slice(0, demoHistoryWeights.length).map((category, index) => {
    const weight = demoHistoryWeights[index] ?? { clicks: 0, conversions: 0 };
    return {
      householdId,
      categorySlug: category.slug,
      clicks: weight.clicks,
      conversions: weight.conversions,
    };
  });
}

export function getHouseholdCategoryScore(
  categorySlug: string,
  householdId = defaultHouseholdId,
  signals = householdCategorySignals,
) {
  const signal = signals.find((entry) => entry.householdId === householdId && entry.categorySlug === categorySlug);
  return signal ? signal.conversions * conversionWeight + signal.clicks : 0;
}

export function rankCategoriesByPurchaseHistory<T extends CategoryRankInput>(
  categories: readonly T[],
  householdId = defaultHouseholdId,
  signals = householdCategorySignals,
) {
  return categories
    .map((category, index) => ({ category, index, score: getHouseholdCategoryScore(category.slug, householdId, signals) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ category }) => category);
}

export function rankLandingShortcuts<T extends LandingShortcutInput>(
  shortcuts: readonly T[],
  householdId = defaultHouseholdId,
  signals = householdCategorySignals,
) {
  return shortcuts
    .map((shortcut, index) => {
      const slug = shortcut.categorySlug ?? shortcut.href.split('/').filter(Boolean).pop() ?? '';
      return { shortcut, index, score: getHouseholdCategoryScore(slug, householdId, signals) };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ shortcut }) => shortcut);
}

export function buildAccountReorderRecommendations(
  signals: readonly AccountReorderSignal[] = accountReorderSignals,
  limit = 4,
): AccountReorderRecommendation[] {
  const grouped = new Map<string, AccountReorderSignal[]>();
  for (const signal of signals) {
    grouped.set(signal.productId, [...(grouped.get(signal.productId) ?? []), signal]);
  }

  return Array.from(grouped.entries())
    .map(([productId, productSignals]) => {
      const strongest = [...productSignals].sort((a, b) => b.urgency - a.urgency || b.confidence - a.confidence)[0]!;
      const evidenceSignals = Array.from(new Set(productSignals.map((signal) => signal.signal)));
      const confidence = productSignals.reduce((sum, signal) => sum + signal.confidence, 0) / productSignals.length;
      const signalScore = productSignals.reduce((sum, signal) => {
        const signalWeight = signal.signal === 'pantry' ? 24 : signal.signal === 'recurring_list' ? 20 : signal.signal === 'favorite' ? 18 : 16;
        return sum + signalWeight + signal.urgency * 2 + signal.confidence * 10;
      }, 0);

      return {
        productId,
        productName: strongest.productName,
        categoryLabel: strongest.categoryLabel,
        currentPriceLabel: strongest.currentPriceLabel,
        confidenceLabel: confidence >= 0.8 ? 'high' : confidence >= 0.65 ? 'medium' : 'low',
        evidenceSignals,
        primaryReason: strongest.reason,
        score: Math.round(signalScore)
      };
    })
    .sort((a, b) => b.score - a.score || a.productName.localeCompare(b.productName, 'sv'))
    .slice(0, limit);
}
