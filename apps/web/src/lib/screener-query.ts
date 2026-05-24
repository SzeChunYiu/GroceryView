export const SCREENER_SORT_MODES = ['biggest-drop', 'cheapest-per-kg', 'widest-spread'] as const;

export type ScreenerSortMode = (typeof SCREENER_SORT_MODES)[number];

export const SCREENER_DEFAULT_SORT_MODE: ScreenerSortMode = 'biggest-drop';
export const SCREENER_DEFAULT_CATEGORY = 'all';
export const SCREENER_MIN_DISCOUNT_PARAM = 'min_discount';
export const SCREENER_MIN_DISCOUNT = 0;
export const SCREENER_MAX_DISCOUNT = 50;

export const SCREENER_DEFAULT_QUERY = {
  sort: SCREENER_DEFAULT_SORT_MODE,
  category: SCREENER_DEFAULT_CATEGORY,
  minDiscount: SCREENER_MIN_DISCOUNT
} as const;

export const SCREENER_SORT_MODE_COPY: Record<ScreenerSortMode, { label: string; detail: string }> = {
  'biggest-drop': {
    label: 'Biggest drop',
    detail: 'Latest observed negative move from priceDropMoversBoard.'
  },
  'cheapest-per-kg': {
    label: 'Cheapest per kg',
    detail: 'Lowest comparable kg price from matched chain rows.'
  },
  'widest-spread': {
    label: 'Widest spread',
    detail: 'Largest Willys/Hemkop spread from topChainSpreads.'
  }
};

export const SCREENER_SORT_OPTIONS = SCREENER_SORT_MODES.map((mode) => ({
  mode,
  ...SCREENER_SORT_MODE_COPY[mode]
}));

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

export function normalizeScreenerMinDiscount(value: string | undefined): number {
  if (!value || value.trim().length === 0) return SCREENER_MIN_DISCOUNT;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return SCREENER_MIN_DISCOUNT;
  return Math.min(SCREENER_MAX_DISCOUNT, Math.max(SCREENER_MIN_DISCOUNT, Math.round(parsed)));
}

function appendScreenerDiscountParam(params: URLSearchParams, minDiscount: number) {
  const normalized = normalizeScreenerMinDiscount(String(minDiscount));
  if (normalized > SCREENER_MIN_DISCOUNT) {
    params.set(SCREENER_MIN_DISCOUNT_PARAM, String(normalized));
  }
}

export function screenerSortHref(mode: ScreenerSortMode, category: string, minDiscount = SCREENER_MIN_DISCOUNT) {
  const params = new URLSearchParams({ sort: mode });
  if (category !== SCREENER_DEFAULT_CATEGORY) params.set('category', category);
  appendScreenerDiscountParam(params, minDiscount);
  return `/screener?${params.toString()}`;
}

export function screenerCategoryHref(category: string, mode: ScreenerSortMode, minDiscount = SCREENER_MIN_DISCOUNT) {
  return screenerSortHref(mode, category, minDiscount);
}

export function screenerDiscountHref(minDiscount: number, mode: ScreenerSortMode, category: string) {
  return screenerSortHref(mode, category, minDiscount);
}
