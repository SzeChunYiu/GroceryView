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
  fields: Array<'dietaryRestrictions' | 'avoidedIngredients' | 'certificationPreferences' | 'nutritionPriorities'>;
  dietaryRestrictions: DietaryPreferenceOption[];
  avoidedIngredients: DietaryPreferenceOption[];
  certificationPreferences: DietaryPreferenceOption[];
  nutritionPriorities: DietaryPreferenceOption[];
  personalizationSurfaces: string[];
  guardrails: string[];
};

export const defaultHouseholdId = 'stockholm-family-demo';
export const recentSearchHistoryStorageKey = 'groceryview:recent-product-searches';
export const savedSearchesStorageKey = 'groceryview:saved-product-searches';
export const brandPreferenceStorageKey = 'groceryview:brand-preferences:v1';
export const disabledPersonalizationSignalsStorageKey = 'groceryview:personalization-disabled-signals:v1';
const maxRecentSearchHistory = 10;

export type PersonalizationTransparencySignal = {
  id: string;
  label: string;
  source: string;
  recommendationUse: string;
  clearAction: string;
};

export const personalizationTransparencySignals: PersonalizationTransparencySignal[] = [
  {
    id: 'purchase_history',
    label: 'Purchase and list history',
    source: 'Signed-in basket imports, shopping-list activity, and receipt purchase rows.',
    recommendationUse: 'Ranks recurring basket items, budget forecasts, and category shortcuts.',
    clearAction: 'Clear imported history and recent list signals.'
  },
  {
    id: 'recent_searches',
    label: 'Recent searches',
    source: 'Browser-local product searches stored on this device.',
    recommendationUse: 'Keeps matching products and categories higher in search and discovery.',
    clearAction: 'Clear recent search history on this device.'
  },
  {
    id: 'brand_controls',
    label: 'Brand substitution controls',
    source: 'Favorite, acceptable, and excluded brand choices saved from settings.',
    recommendationUse: 'Boosts favorites, allows fallback brands, and suppresses excluded substitutions.',
    clearAction: 'Reset brand controls.'
  },
  {
    id: 'dietary_profile',
    label: 'Dietary profile',
    source: 'Explicit allergies, diets, avoided ingredients, and certification preferences.',
    recommendationUse: 'Filters unsafe matches and annotates product recommendations with label evidence.',
    clearAction: 'Disable dietary signals until profile sync is re-enabled.'
  }
];

export type RecentSearchHistoryEntry = {
  query: string;
  href: string;
  resultCount: number;
  searchedAt: string;
};

export type SavedSearchEntry = RecentSearchHistoryEntry & {
  pinnedAt: string;
};

export const householdCategorySignals: HouseholdCategorySignal[] = [
  { householdId: defaultHouseholdId, categorySlug: 'mejeri-ost-agg', clicks: 18, conversions: 7 },
  { householdId: defaultHouseholdId, categorySlug: 'frukt-gront', clicks: 16, conversions: 6 },
  { householdId: defaultHouseholdId, categorySlug: 'brod-bageri', clicks: 10, conversions: 5 },
  { householdId: 'new-arrival-demo', categorySlug: 'varldens-mat', clicks: 22, conversions: 8 },
  { householdId: 'new-arrival-demo', categorySlug: 'skafferi', clicks: 14, conversions: 6 },
  { householdId: 'new-arrival-demo', categorySlug: 'frys', clicks: 9, conversions: 3 },
];

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

export function readSavedSearches(): SavedSearchEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(savedSearchesStorageKey) || '[]') as SavedSearchEntry[];
    return Array.isArray(parsed)
      ? parsed.filter((entry) => typeof entry.query === 'string' && entry.query.trim().length > 0).slice(0, 10)
      : [];
  } catch {
    return [];
  }
}

export function pinSavedSearch(entry: RecentSearchHistoryEntry): SavedSearchEntry[] {
  if (typeof window === 'undefined') return [];
  const pinned: SavedSearchEntry = { ...entry, pinnedAt: new Date().toISOString() };
  const next = [
    pinned,
    ...readSavedSearches().filter((search) => search.query.toLocaleLowerCase('sv-SE') !== entry.query.toLocaleLowerCase('sv-SE'))
  ].slice(0, 10);
  window.localStorage.setItem(savedSearchesStorageKey, JSON.stringify(next));
  return next;
}

export const dietaryPreferenceOnboardingContract: DietaryPreferenceOnboardingContract = {
  endpoint: '/api/account/dietary-preferences',
  fields: ['dietaryRestrictions', 'avoidedIngredients', 'certificationPreferences', 'nutritionPriorities'],
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
  nutritionPriorities: [
    { value: 'lower_sugar', label: 'Lower sugar', helper: 'Rank verified lower-sugar options higher when label data is present.' },
    { value: 'higher_protein', label: 'Higher protein', helper: 'Prioritize stronger protein-per-krona matches for meals and swaps.' },
    { value: 'higher_fiber', label: 'Higher fiber', helper: 'Prefer products with fiber evidence for weekly basket suggestions.' },
    { value: 'lower_salt', label: 'Lower salt', helper: 'Down-rank high-salt substitutions unless explicitly selected.' }
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

export type ReorderProductInput = {
  slug: string;
  name: string;
  brand: string;
  totalPriceLabel: string;
  unitPriceLabel: string;
  packageLabel: string;
  sourceLabel: string;
};

export type ReorderProductSignal = {
  productSlug: string;
  watchedCount: number;
  favoriteSaves: number;
  repeatPurchases: number;
  lastActionLabel: string;
};

export type PersonalizedReorderItem = ReorderProductInput & {
  reorderScore: number;
  reorderReason: string;
  signalSummary: string;
  lastActionLabel: string;
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
const reorderWeights = {
  watchedCount: 2,
  favoriteSaves: 8,
  repeatPurchases: 12,
};
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
const demoReorderSignals: ReorderProductSignal[] = [
  { productSlug: 'milk', watchedCount: 6, favoriteSaves: 2, repeatPurchases: 5, lastActionLabel: 'bought again last week' },
  { productSlug: 'bread', watchedCount: 5, favoriteSaves: 3, repeatPurchases: 3, lastActionLabel: 'saved as breakfast staple' },
  { productSlug: 'banana', watchedCount: 8, favoriteSaves: 1, repeatPurchases: 2, lastActionLabel: 'watched for price drops' },
  { productSlug: 'coffee', watchedCount: 4, favoriteSaves: 2, repeatPurchases: 2, lastActionLabel: 'favorite pantry refill' },
];

function reorderSignalScore(signal: Pick<ReorderProductSignal, 'favoriteSaves' | 'repeatPurchases' | 'watchedCount'>) {
  return (
    signal.watchedCount * reorderWeights.watchedCount
    + signal.favoriteSaves * reorderWeights.favoriteSaves
    + signal.repeatPurchases * reorderWeights.repeatPurchases
  );
}

function fallbackReorderSignal(index: number): ReorderProductSignal | null {
  const signal = demoReorderSignals[index];
  return signal ? { ...signal, productSlug: '' } : null;
}

function signalMatchesProduct(productSlug: string, signalSlug: string) {
  const normalizedProductSlug = productSlug.toLocaleLowerCase('sv-SE');
  const normalizedSignalSlug = signalSlug.toLocaleLowerCase('sv-SE');
  return normalizedProductSlug === normalizedSignalSlug || normalizedProductSlug.includes(normalizedSignalSlug);
}

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

export function buildPersonalizedReorderRail<T extends ReorderProductInput>(
  products: readonly T[],
  {
    limit = 4,
    signals = demoReorderSignals,
  }: { limit?: number; signals?: readonly ReorderProductSignal[] } = {},
): PersonalizedReorderItem[] {
  return products
    .map((product, index) => {
      const signal = signals.find((entry) => signalMatchesProduct(product.slug, entry.productSlug)) ?? fallbackReorderSignal(index);
      if (!signal) return null;

      const reorderScore = reorderSignalScore(signal);
      return {
        ...product,
        reorderScore,
        reorderReason: signal.repeatPurchases > 0
          ? 'Buy again candidate'
          : signal.favoriteSaves > 0
            ? 'Favorite staple'
            : 'Watched product',
        signalSummary: `${signal.repeatPurchases} reorders · ${signal.favoriteSaves} favorites · ${signal.watchedCount} watches`,
        lastActionLabel: signal.lastActionLabel,
      };
    })
    .filter((item): item is PersonalizedReorderItem => item !== null)
    .sort((left, right) => right.reorderScore - left.reorderScore || left.name.localeCompare(right.name, 'sv-SE'))
    .slice(0, limit);
}

export function buildPersonalizedRecommendationRail<T extends RecommendationProductInput>(
  products: readonly T[],
  options: {
    householdId?: string;
    favoriteBrands?: readonly string[];
    avoidedBrands?: readonly string[];
    recentListActivity?: readonly string[];
    limit?: number;
  } = {},
): PersonalizedRecommendation[] {
  const favoriteBrands = new Set((options.favoriteBrands ?? ['Garant', 'Änglamark', 'Kaffe']).map((brand) => brand.toLocaleLowerCase('sv-SE')));
  const avoidedBrands = new Set((options.avoidedBrands ?? ['Unknown private label']).map((brand) => brand.toLocaleLowerCase('sv-SE')));
  const recentWords = (options.recentListActivity ?? ['milk', 'bread', 'coffee', 'fruit'])
    .flatMap((item) => item.toLocaleLowerCase('sv-SE').split(/\s+/))
    .filter((word) => word.length > 2);

  return products
    .map((product, index) => {
      const haystack = `${product.name} ${product.brand ?? ''}`.toLocaleLowerCase('sv-SE');
      const favoriteHit = product.brand ? favoriteBrands.has(product.brand.toLocaleLowerCase('sv-SE')) : false;
      const avoidedHit = product.brand ? avoidedBrands.has(product.brand.toLocaleLowerCase('sv-SE')) : false;
      const listHits = recentWords.filter((word) => haystack.includes(word)).length;
      const historyScore = getHouseholdCategoryScore(product.slug.split('-').slice(0, 2).join('-'), options.householdId ?? defaultHouseholdId);
      const score = historyScore + listHits * 18 + (favoriteHit ? 24 : 0) - (avoidedHit ? 120 : 0) + Math.max(0, 8 - index);
      const reason = avoidedHit
        ? `Avoided brand control lowers ${product.brand} for recommendations and substitutions`
        : favoriteHit
        ? `Favorite brand signal for ${product.brand}`
        : listHits > 0
          ? `${listHits} recent list signal${listHits === 1 ? '' : 's'} matched`
          : 'Household history keeps this in the discovery mix';
      return { ...product, score, reason };
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'sv'))
    .slice(0, options.limit ?? 4);
}

export type PersonalizedTrendingDealInput = {
  rank: number;
  productSlug: string;
  productName: string;
  brand?: string | null;
  categoryLabel?: string | null;
  chainSlug?: string | null;
  chainName?: string | null;
};

export type PersonalizedTrendingDeal<T> = T & {
  rank: number;
  personalizationScore: number;
  personalizationReason: string;
};

export function rankTrendingDealsForHousehold<T extends PersonalizedTrendingDealInput>(
  deals: readonly T[],
  options: {
    householdId?: string;
    favoriteBrands?: readonly string[];
    dietaryFilters?: readonly string[];
    nearbyChains?: readonly string[];
    clickedProductSlugs?: readonly string[];
  } = {},
): PersonalizedTrendingDeal<T>[] {
  const favoriteBrands = new Set((options.favoriteBrands ?? ['Garant', 'Änglamark']).map((brand) => brand.toLocaleLowerCase('sv-SE')));
  const dietaryFilters = (options.dietaryFilters ?? []).map((filter) => filter.toLocaleLowerCase('sv-SE'));
  const nearbyChains = new Set((options.nearbyChains ?? ['ica', 'coop', 'willys']).map((chain) => chain.toLocaleLowerCase('sv-SE')));
  const clickedProductSlugs = new Set((options.clickedProductSlugs ?? []).map((slug) => slug.toLocaleLowerCase('sv-SE')));

  return deals
    .map((deal, index) => {
      const brand = deal.brand?.toLocaleLowerCase('sv-SE') ?? '';
      const category = deal.categoryLabel?.toLocaleLowerCase('sv-SE') ?? '';
      const name = deal.productName.toLocaleLowerCase('sv-SE');
      const chain = deal.chainSlug?.toLocaleLowerCase('sv-SE') ?? deal.chainName?.toLocaleLowerCase('sv-SE') ?? '';
      const favoriteScore = favoriteBrands.has(brand) ? 30 : 0;
      const dietaryScore = dietaryFilters.filter((filter) => category.includes(filter) || name.includes(filter)).length * 16;
      const chainScore = chain && nearbyChains.has(chain) ? 14 : 0;
      const clickScore = clickedProductSlugs.has(deal.productSlug.toLocaleLowerCase('sv-SE')) ? 22 : 0;
      const historyScore = getHouseholdCategoryScore(deal.productSlug.split('-').slice(0, 2).join('-'), options.householdId ?? defaultHouseholdId) / 2;
      const personalizationScore = favoriteScore + dietaryScore + chainScore + clickScore + historyScore + Math.max(0, deals.length - index);
      const reasons = [
        favoriteScore > 0 ? 'favorite brand' : '',
        dietaryScore > 0 ? 'dietary filter match' : '',
        chainScore > 0 ? 'nearby chain' : '',
        clickScore > 0 ? 'recent click' : '',
        historyScore > 0 ? 'household category history' : '',
      ].filter(Boolean);

      return {
        ...deal,
        personalizationScore,
        personalizationReason: reasons.length > 0 ? reasons.join(', ') : 'price-drop trend strength',
      };
    })
    .sort((left, right) => right.personalizationScore - left.personalizationScore || left.rank - right.rank)
    .map((deal, index) => ({ ...deal, rank: index + 1 }));
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
