'use client';

import { useEffect, useMemo, useState } from 'react';

export type SearchSuggestion = {
  id: string;
  slug: string;
  name: string;
  category: string;
};

type ProductSearchResult = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  category?: string | null;
};

type ProductSearchResponse = {
  query: string;
  results: ProductSearchResult[];
  error?: string;
};

export type SearchStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error';

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

function toSuggestion(result: ProductSearchResult): SearchSuggestion {
  return {
    id: result.id,
    slug: result.slug,
    name: result.name,
    category: result.category ?? result.brand ?? 'Product'
  };
}

export function useSearch(query: string) {
  const [results, setResults] = useState<SearchSuggestion[]>([]);
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
        const payload = await response.json() as ProductSearchResponse;
        if (!response.ok || payload.error) throw new Error(payload.error ?? 'product_search_failed');
        if (controller.signal.aborted) return;
        const suggestions = (payload.results ?? []).map(toSuggestion);
        setResults(suggestions);
        setStatus(suggestions.length > 0 ? 'ready' : 'empty');
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Product search request failed', error instanceof Error ? { name: error.name } : { name: 'unknown' });
        setResults([]);
        setStatus('error');
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [trimmedQuery]);

  return { results, status, trimmedQuery, minQueryLength: MIN_QUERY_LENGTH };
}
