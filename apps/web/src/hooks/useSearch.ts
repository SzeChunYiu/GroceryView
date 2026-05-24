'use client';

import { useEffect, useMemo, useState } from 'react';

export type ProductSearchResult = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  searchRank: number;
};

type ProductSearchResponse = {
  query: string;
  results: ProductSearchResult[];
  error?: string;
};

export type SearchStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error';

export const MIN_QUERY_LENGTH = 2;

export function useSearch(query: string) {
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [status, setStatus] = useState<SearchStatus>('idle');
  const trimmedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setStatus('idle');
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setStatus('loading');
      try {
        const response = await fetch(`/api/products?q=${encodeURIComponent(trimmedQuery)}`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' }
        });
        const payload = (await response.json()) as ProductSearchResponse;
        if (!response.ok || payload.error) throw new Error(payload.error ?? 'product_search_failed');
        if (controller.signal.aborted) return;
        setResults(payload.results ?? []);
        setStatus((payload.results ?? []).length > 0 ? 'ready' : 'empty');
      } catch {
        if (controller.signal.aborted) return;
        setResults([]);
        setStatus('error');
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [trimmedQuery]);

  return { results, status, trimmedQuery };
}
