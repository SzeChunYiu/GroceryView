export type HouseholdCategorySignal = {
  householdId: string;
  categorySlug: string;
  clicks: number;
  conversions: number;
};

export type DietaryPreferenceOption = {
  value: string;
  label: string;
  helper: string;
};

export type DietaryPreferenceOnboardingContract = {
  endpoint: '/api/account/dietary-preferences';
  fields: Array<'dietaryRestrictions' | 'avoidedIngredients' | 'certificationPreferences'>;
  dietaryRestrictions: DietaryPreferenceOption[];
  avoidedIngredients: DietaryPreferenceOption[];
  certificationPreferences: DietaryPreferenceOption[];
  personalizationSurfaces: string[];
  guardrails: string[];
};

export const defaultHouseholdId = 'stockholm-family-demo';
export const recentSearchHistoryStorageKey = 'groceryview:recent-product-searches';
const maxRecentSearchHistory = 10;

export type RecentSearchHistoryEntry = {
  query: string;
  href: string;
  resultCount: number;
  searchedAt: string;
};

export type BrandLearningInput = {
  brand?: string | null;
  name?: string | null;
};

export type LearnedBrandPreference = {
  brand: string;
  preference: 'preferred' | 'disliked';
  score: number;
  evidence: string[];
};

export const householdCategorySignals: HouseholdCategorySignal[] = [
  { householdId: defaultHouseholdId, categorySlug: 'mejeri-ost-agg', clicks: 18, conversions: 7 },
  { householdId: defaultHouseholdId, categorySlug: 'frukt-gront', clicks: 16, conversions: 6 },
  { householdId: defaultHouseholdId, categorySlug: 'brod-bageri', clicks: 10, conversions: 5 },
  { householdId: 'new-arrival-demo', categorySlug: 'varldens-mat', clicks: 22, conversions: 8 },
  { householdId: 'new-arrival-demo', categorySlug: 'skafferi', clicks: 14, conversions: 6 },
  { householdId: 'new-arrival-demo', categorySlug: 'frys', clicks: 9, conversions: 3 },
];

function normalizeBrand(value: string | null | undefined) {
  return value?.trim() || '';
}

function bumpBrandScore(scores: Map<string, { brand: string; score: number; evidence: Set<string> }>, brand: string, points: number, evidence: string) {
  const normalized = normalizeBrand(brand);
  if (!normalized) return;
  const key = normalized.toLocaleLowerCase('sv-SE');
  const current = scores.get(key) ?? { brand: normalized, score: 0, evidence: new Set<string>() };
  current.score += points;
  current.evidence.add(evidence);
  scores.set(key, current);
}

export function inferLearnedBrandPreferences(options: {
  favourites?: readonly BrandLearningInput[];
  removals?: readonly BrandLearningInput[];
  searches?: readonly RecentSearchHistoryEntry[];
  candidateBrands?: readonly string[];
} = {}): LearnedBrandPreference[] {
  const scores = new Map<string, { brand: string; score: number; evidence: Set<string> }>();
  for (const favourite of options.favourites ?? []) {
    if (favourite.brand) bumpBrandScore(scores, favourite.brand, 3, 'saved as favourite');
  }
  for (const removal of options.removals ?? []) {
    if (removal.brand) bumpBrandScore(scores, removal.brand, -4, 'removed from watchlist');
  }
  const brands = (options.candidateBrands ?? [])
    .map(normalizeBrand)
    .filter((brand, index, list) => brand && list.findIndex((candidate) => candidate.toLocaleLowerCase('sv-SE') === brand.toLocaleLowerCase('sv-SE')) === index);
  for (const search of options.searches ?? []) {
    const query = search.query.toLocaleLowerCase('sv-SE');
    for (const brand of brands) {
      if (query.includes(brand.toLocaleLowerCase('sv-SE'))) {
        bumpBrandScore(scores, brand, 2, 'repeated search');
      }
    }
  }
  return [...scores.values()]
    .map((signal) => ({
      brand: signal.brand,
      preference: signal.score < 0 ? 'disliked' as const : 'preferred' as const,
      score: signal.score,
      evidence: [...signal.evidence]
    }))
    .filter((signal) => Math.abs(signal.score) >= 2)
    .sort((a, b) => Math.abs(b.score) - Math.abs(a.score) || a.brand.localeCompare(b.brand, 'sv'));
}

export function readRecentSearchHistory(): RecentSearchHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(recentSearchHistoryStorageKey) || '[]') as RecentSearchHistoryEntry[];
    return Array.isArray(parsed)
      ? parsed
        .filter((entry) => typeof entry.query === 'string' && entry.query.trim().length > 0)
        .slice(0, maxRecentSearchHistory)
      : [];
  } catch {
    return [];
  }
}

export function rememberRecentSearchHistory(query: string, resultCount: number, basePath = '/search') {
  if (typeof window === 'undefined') return [];
  const trimmedQuery = query.trim();
  if (!trimmedQuery || resultCount <= 0) return readRecentSearchHistory();

  const next = [
    {
      query: trimmedQuery,
      href: `${basePath}?q=${encodeURIComponent(trimmedQuery)}`,
      resultCount,
      searchedAt: new Date().toISOString()
    },
    ...readRecentSearchHistory().filter((entry) => entry.query.toLocaleLowerCase('sv-SE') !== trimmedQuery.toLocaleLowerCase('sv-SE'))
  ].slice(0, maxRecentSearchHistory);

  window.localStorage.setItem(recentSearchHistoryStorageKey, JSON.stringify(next));
  return next;
}

export function clearRecentSearchHistory() {
  if (typeof window === 'undefined') return [];
  window.localStorage.removeItem(recentSearchHistoryStorageKey);
  return [];
}

export const dietaryPreferenceOnboardingContract: DietaryPreferenceOnboardingContract = {
  endpoint: '/api/account/dietary-preferences',
  fields: ['dietaryRestrictions', 'avoidedIngredients', 'certificationPreferences'],
  dietaryRestrictions: [
    { value: 'vegetarian', label: 'Vegetarian', helper: 'Prefer meat-free recipes, swaps, and basket ideas.' },
    { value: 'vegan', label: 'Vegan', helper: 'Require plant-based alternatives before recommendations are ranked.' },
    { value: 'gluten_free', label: 'Gluten-free', helper: 'Keep products without verified gluten-free evidence out of default matches.' },
    { value: 'lactose_free', label: 'Lactose-free', helper: 'Prefer dairy rows with explicit lactose-free evidence.' }
  ],
  avoidedIngredients: [
    { value: 'peanuts', label: 'Peanuts', helper: 'Warn before products with peanut allergen evidence are recommended.' },
    { value: 'tree_nuts', label: 'Tree nuts', helper: 'Treat nut evidence as a default exclusion for search and baskets.' },
    { value: 'shellfish', label: 'Shellfish', helper: 'Exclude shellfish evidence from meal and substitution suggestions.' },
    { value: 'pork', label: 'Pork', helper: 'Avoid pork ingredients for religious or lifestyle preferences.' }
  ],
  certificationPreferences: [
    { value: 'halal', label: 'Halal', helper: 'Prefer explicit halal certification or store-confirmation steps.' },
    { value: 'kosher', label: 'Kosher', helper: 'Prefer package-label evidence before surfacing product matches.' },
    { value: 'organic', label: 'Organic', helper: 'Promote verified organic labels when price and stock evidence are available.' },
    { value: 'keyhole', label: 'Keyhole', helper: 'Prefer verified Nordic Keyhole labels for health-oriented filters.' }
  ],
  personalizationSurfaces: [
    'search filters',
    'recommendation ranking',
    'price alerts',
    'weekly basket warnings'
  ],
  guardrails: [
    'Preferences are saved only for a signed-in account.',
    'Health, religious, and lifestyle needs are never inferred from browsing or purchase history.',
    'Certification preferences require verified product label evidence or an explicit store-confirmation step.'
  ]
};

type CategoryRankInput = {
  slug: string;
};

type LandingShortcutInput = {
  href: string;
  categorySlug?: string;
};

type RecommendationProductInput = {
  slug: string;
  name: string;
  brand?: string | null;
  sourceLabel?: string;
  totalPriceLabel?: string;
};

export type PersonalizedRecommendation = RecommendationProductInput & {
  score: number;
  reason: string;
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

export function buildPersonalizedRecommendationRail<T extends RecommendationProductInput>(
  products: readonly T[],
  options: {
    householdId?: string;
    favoriteBrands?: readonly string[];
    recentListActivity?: readonly string[];
    limit?: number;
  } = {},
): PersonalizedRecommendation[] {
  const favoriteBrands = new Set((options.favoriteBrands ?? ['Garant', 'Änglamark', 'Kaffe']).map((brand) => brand.toLocaleLowerCase('sv-SE')));
  const recentWords = (options.recentListActivity ?? ['milk', 'bread', 'coffee', 'fruit'])
    .flatMap((item) => item.toLocaleLowerCase('sv-SE').split(/\s+/))
    .filter((word) => word.length > 2);

  return products
    .map((product, index) => {
      const haystack = `${product.name} ${product.brand ?? ''}`.toLocaleLowerCase('sv-SE');
      const favoriteHit = product.brand ? favoriteBrands.has(product.brand.toLocaleLowerCase('sv-SE')) : false;
      const listHits = recentWords.filter((word) => haystack.includes(word)).length;
      const historyScore = getHouseholdCategoryScore(product.slug.split('-').slice(0, 2).join('-'), options.householdId ?? defaultHouseholdId);
      const score = historyScore + listHits * 18 + (favoriteHit ? 24 : 0) + Math.max(0, 8 - index);
      const reason = favoriteHit
        ? `Favorite brand signal for ${product.brand}`
        : listHits > 0
          ? `${listHits} recent list signal${listHits === 1 ? '' : 's'} matched`
          : 'Household history keeps this in the discovery mix';
      return { ...product, score, reason };
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'sv'))
    .slice(0, options.limit ?? 4);
}

export type BrandTolerance = 'favorite' | 'acceptable' | 'excluded';

export type PreferredBrandControl = {
  brand: string;
  tolerance: BrandTolerance;
  note: string;
};

export const demoPreferredBrandControls: PreferredBrandControl[] = [
  { brand: 'Garant', tolerance: 'favorite', note: 'Prioritize for pantry staples and dairy swaps.' },
  { brand: 'Änglamark', tolerance: 'favorite', note: 'Prefer when organic substitutes are available.' },
  { brand: 'ICA Basic', tolerance: 'acceptable', note: 'Show when savings are meaningful and ratings stay strong.' },
  { brand: 'Unknown private label', tolerance: 'excluded', note: 'Hide from automatic substitutions until reviewed.' },
];

export function groupPreferredBrandControls(controls: readonly PreferredBrandControl[] = demoPreferredBrandControls) {
  return {
    favorite: controls.filter((control) => control.tolerance === 'favorite'),
    acceptable: controls.filter((control) => control.tolerance === 'acceptable'),
    excluded: controls.filter((control) => control.tolerance === 'excluded'),
  };
}

export function scoreBrandTolerance(brand: string | null | undefined, controls: readonly PreferredBrandControl[] = demoPreferredBrandControls) {
  const normalizedBrand = (brand ?? '').trim().toLocaleLowerCase('sv-SE');
  const match = controls.find((control) => control.brand.trim().toLocaleLowerCase('sv-SE') === normalizedBrand);
  if (!match) return { tolerance: 'acceptable' as BrandTolerance, score: 0 };
  if (match.tolerance === 'favorite') return { tolerance: match.tolerance, score: 30 };
  if (match.tolerance === 'excluded') return { tolerance: match.tolerance, score: -100 };
  return { tolerance: match.tolerance, score: 5 };
}
