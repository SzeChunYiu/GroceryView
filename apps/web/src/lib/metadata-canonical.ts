export type SearchParamMap = Record<string, string | string[] | undefined | null>;

const CATEGORY_CANONICAL_KEYS = ['lang', 'currency'] as const;
const SEARCH_CANONICAL_KEYS = ['q', 'lang', 'currency'] as const;

function normalizeValue(value?: string | string[] | null): string | undefined {
  if (!value) return undefined;
  return typeof value === 'string' ? value : value[0];
}

function sanitizeCurrency(currency: string): string | undefined {
  const normalized = currency.trim().toUpperCase();
  return normalized.length > 0 ? normalized : undefined;
}

function sanitizeLang(lang: string): string | undefined {
  const normalized = lang.trim().toLowerCase();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeQueryParam(key: string, value: string | undefined): string | undefined {
  if (!value) return undefined;

  if (key === 'currency') return sanitizeCurrency(value);
  if (key === 'lang') return sanitizeLang(value);

  return value;
}

function buildCanonicalPath(pathname: string, params: SearchParamMap, keys: readonly string[]) {
  const canonicalSearch = new URLSearchParams();

  for (const key of keys) {
    const normalized = normalizeQueryParam(key, normalizeValue(params[key]));
    if (normalized !== undefined) canonicalSearch.set(key, normalized);
  }

  return canonicalSearch.size > 0 ? `${pathname}?${canonicalSearch.toString()}` : pathname;
}

export function buildCategoryCanonicalPath(pathname: string, searchParams: SearchParamMap): string {
  return buildCanonicalPath(pathname, searchParams, CATEGORY_CANONICAL_KEYS);
}

export function buildSearchCanonicalPath(pathname: string, searchParams: SearchParamMap): string {
  return buildCanonicalPath(pathname, searchParams, SEARCH_CANONICAL_KEYS);
}
