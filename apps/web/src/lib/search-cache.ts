export const frequentSearchPrefetchQueries = [
  'milk',
  'eggs',
  'pasta',
  'coffee',
  'oat milk',
  'bananas'
] as const;

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const searchCache = new Map<string, CacheEntry<unknown>>();
const defaultCacheTtlMs = 5 * 60 * 1000;
let lastPrefetchAt = 0;
let prefetchPromise: Promise<void> | null = null;

export function normalizeSearchCacheQuery(query: string) {
  return query.trim().replace(/\s+/g, ' ').toLocaleLowerCase('sv-SE');
}

export function searchCacheKey(query: string, expandedQueries: readonly string[] = []) {
  const normalizedExpansions = expandedQueries.map(normalizeSearchCacheQuery).sort().join('|');
  return `${normalizeSearchCacheQuery(query)}::${normalizedExpansions}`;
}

export function isFrequentSearchPrefetchQuery(query: string) {
  const normalized = normalizeSearchCacheQuery(query);
  return frequentSearchPrefetchQueries.some((candidate) => candidate === normalized);
}

export function readSearchCache<T>(key: string, now = Date.now()): T | null {
  const entry = searchCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= now) {
    searchCache.delete(key);
    return null;
  }
  return entry.value as T;
}

export function writeSearchCache<T>(key: string, value: T, ttlMs = defaultCacheTtlMs, now = Date.now()) {
  searchCache.set(key, { expiresAt: now + ttlMs, value });
  return value;
}

export function prefetchFrequentSearches(loader: (query: string) => Promise<void>, now = Date.now()) {
  if (prefetchPromise) return prefetchPromise;
  if (now - lastPrefetchAt < defaultCacheTtlMs) return Promise.resolve();

  lastPrefetchAt = now;
  prefetchPromise = Promise.all(frequentSearchPrefetchQueries.map((query) => loader(query)))
    .then(() => undefined)
    .catch(() => undefined)
    .finally(() => {
      prefetchPromise = null;
    });

  return prefetchPromise;
}
