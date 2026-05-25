export type RecentProductSearch = {
  query: string;
  href: string;
  resultCount: number;
  searchedAt: string;
};

export const recentProductSearchesStorageKey = 'groceryview:recent-product-searches';
export const maxRecentSearches = 10;

export function readRecentProductSearches(): RecentProductSearch[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(recentProductSearchesStorageKey) || '[]') as RecentProductSearch[];
    return Array.isArray(parsed)
      ? parsed
        .filter((entry) => typeof entry.query === 'string' && entry.query.trim().length > 0)
        .slice(0, maxRecentSearches)
      : [];
  } catch {
    return [];
  }
}

export function rememberRecentProductSearch(query: string, resultCount: number): RecentProductSearch[] {
  if (typeof window === 'undefined') return [];
  const trimmedQuery = query.trim();
  if (!trimmedQuery || resultCount <= 0) return readRecentProductSearches();

  const next = [
    {
      query: trimmedQuery,
      href: `/products?q=${encodeURIComponent(trimmedQuery)}`,
      resultCount,
      searchedAt: new Date().toISOString()
    },
    ...readRecentProductSearches().filter((entry) => entry.query.toLocaleLowerCase('sv-SE') !== trimmedQuery.toLocaleLowerCase('sv-SE'))
  ].slice(0, maxRecentSearches);

  window.localStorage.setItem(recentProductSearchesStorageKey, JSON.stringify(next));
  return next;
}
