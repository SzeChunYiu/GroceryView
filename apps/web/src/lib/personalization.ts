export type HouseholdCategorySignal = {
  householdId: string;
  categorySlug: string;
  clicks: number;
  conversions: number;
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
