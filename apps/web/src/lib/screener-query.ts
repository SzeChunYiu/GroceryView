export const SCREENER_SORT_MODES = ['biggest-drop', 'cheapest-per-kg', 'widest-spread'] as const;

export type ScreenerSortMode = (typeof SCREENER_SORT_MODES)[number];

export const SCREENER_DEFAULT_SORT_MODE: ScreenerSortMode = 'biggest-drop';
export const SCREENER_DEFAULT_CATEGORY = 'all';

export const SCREENER_DEFAULT_QUERY = {
  sort: SCREENER_DEFAULT_SORT_MODE,
  category: SCREENER_DEFAULT_CATEGORY
} as const;

export function screenerDefaultHref() {
  const params = new URLSearchParams({ sort: SCREENER_DEFAULT_QUERY.sort });
  return `/screener?${params.toString()}`;
}

export function normalizeScreenerSort(value: string | undefined): ScreenerSortMode {
  return SCREENER_SORT_MODES.includes(value as ScreenerSortMode) ? (value as ScreenerSortMode) : SCREENER_DEFAULT_SORT_MODE;
}

export function normalizeScreenerCategory(value: string | undefined, validCategorySlugs: readonly string[]): string {
  if (!value || value === SCREENER_DEFAULT_CATEGORY) {
    return SCREENER_DEFAULT_CATEGORY;
  }

  return validCategorySlugs.includes(value) ? value : SCREENER_DEFAULT_CATEGORY;
}

export function screenerSortHref(mode: ScreenerSortMode, category: string) {
  const params = new URLSearchParams({ sort: mode });
  if (category !== SCREENER_DEFAULT_CATEGORY) params.set('category', category);
  return `/screener?${params.toString()}`;
}

export function screenerCategoryHref(category: string, mode: ScreenerSortMode) {
  return screenerSortHref(mode, category);
}
