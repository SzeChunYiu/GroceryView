export const SEARCH_SUGGEST_DEBOUNCE_MS = 250;

export type SearchSuggestKind = 'products' | 'brands' | 'categories' | 'stores';

export function searchSuggestUrl(query: string, country = 'SE') {
  const params = new URLSearchParams({
    q: query,
    country
  });
  return `/api/suggest?${params.toString()}`;
}

export function productSearchUrl(query: string) {
  const params = new URLSearchParams({ q: query });
  return `/api/products?${params.toString()}`;
}
