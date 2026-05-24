'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { trackSearchStreamEvent, trackSearchTelemetry } from '@/lib/telemetry';

type ProductSearchResult = {
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

type SearchStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error';

const MIN_QUERY_LENGTH = 2;

export function SearchBar() {
  const inputId = useId();
  const listboxId = useId();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [status, setStatus] = useState<SearchStatus>('idle');
  const openQueryRef = useRef<string | null>(null);
  const requestedAtRef = useRef<number | null>(null);
  const resultCountRef = useRef(0);
  const trimmedQuery = useMemo(() => query.trim(), [query]);
  const shouldShowDropdown = status !== 'idle' && trimmedQuery.length >= MIN_QUERY_LENGTH;
  const dismissSuggestions = useCallback((reason: string) => {
    if (!openQueryRef.current) return;
    trackSearchTelemetry({
      eventType: 'search_suggestions_dismissed',
      query: openQueryRef.current,
      reason,
      resultCount: resultCountRef.current
    });
    openQueryRef.current = null;
  }, []);
  const closeSuggestions = useCallback((reason: string) => {
    dismissSuggestions(reason);
    setResults([]);
    setStatus('idle');
  }, [dismissSuggestions]);

  useEffect(() => {
    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      closeSuggestions('query_too_short');
      return;
    }

    if (openQueryRef.current && openQueryRef.current !== trimmedQuery) {
      dismissSuggestions('query_changed');
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      const requestedAt = performance.now();
      requestedAtRef.current = requestedAt;
      trackSearchTelemetry({
        eventType: 'search_suggestions_requested',
        query: trimmedQuery
      });
      trackSearchStreamEvent(trimmedQuery, 'autocomplete_request_started', 0);
      setStatus('loading');
      try {
        const response = await fetch(`/api/products?q=${encodeURIComponent(trimmedQuery)}`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' }
        });
        const payload = await response.json() as ProductSearchResponse;
        if (!response.ok || payload.error) throw new Error(payload.error ?? 'product_search_failed');
        if (controller.signal.aborted) return;
        const nextResults = payload.results ?? [];
        const elapsedMs = Math.round(performance.now() - requestedAt);
        openQueryRef.current = trimmedQuery;
        resultCountRef.current = nextResults.length;
        setResults(nextResults);
        setStatus(nextResults.length > 0 ? 'ready' : 'empty');
        trackSearchTelemetry({
          elapsedMs,
          eventType: 'search_suggestions_returned',
          query: trimmedQuery,
          resultCount: nextResults.length
        });
        trackSearchStreamEvent(trimmedQuery, 'autocomplete_results_rendered', elapsedMs);
        if (nextResults.length > 0) {
          trackSearchTelemetry({
            elapsedMs,
            eventType: 'search_first_result_time',
            query: trimmedQuery,
            resultCount: nextResults.length,
            resultId: nextResults[0].id,
            resultRank: 0
          });
        }
      } catch {
        if (controller.signal.aborted) return;
        setResults([]);
        setStatus('error');
        trackSearchStreamEvent(trimmedQuery, 'autocomplete_request_failed', requestedAtRef.current === null ? undefined : Math.round(performance.now() - requestedAtRef.current));
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [closeSuggestions, dismissSuggestions, trimmedQuery]);

  return (
    <div className="relative w-full max-w-xl lg:w-[min(36vw,28rem)]">
      <label className="sr-only" htmlFor={inputId}>Search products by name or brand</label>
      <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm focus-within:border-emerald-700 focus-within:ring-2 focus-within:ring-emerald-100">
        <Search className="h-4 w-4 text-slate-500" aria-hidden="true" />
        <input
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={shouldShowDropdown}
          aria-label="Search products"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-500"
          id={inputId}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') closeSuggestions('escape_key');
          }}
          placeholder="Search product or brand"
          role="combobox"
          type="search"
          value={query}
        />
      </div>

      {shouldShowDropdown ? (
        <div
          className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/10"
          id={listboxId}
          role="listbox"
        >
          {status === 'loading' ? (
            <p className="px-4 py-3 text-sm font-bold text-slate-600">Searching verified products…</p>
          ) : null}
          {status === 'error' ? (
            <p className="px-4 py-3 text-sm font-bold text-rose-800">Product search is temporarily unavailable.</p>
          ) : null}
          {status === 'empty' ? (
            <p className="px-4 py-3 text-sm font-bold text-slate-600">No products matched “{trimmedQuery}”.</p>
          ) : null}
          {status === 'ready' ? (
            <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
              {results.map((result) => (
                <Link
                  className="block px-4 py-3 transition hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-none"
                  href={`/products/${result.slug}`}
                  key={result.id}
                  onClick={() => {
                    trackSearchTelemetry({
                      eventType: 'search_suggestion_clicked',
                      query: trimmedQuery,
                      resultCount: results.length,
                      resultId: result.id,
                      resultRank: results.findIndex((candidate) => candidate.id === result.id)
                    });
                    openQueryRef.current = null;
                  }}
                  role="option"
                >
                  <span className="block text-sm font-black text-slate-950">{result.name}</span>
                  <span className="mt-1 block text-xs font-semibold text-slate-600">{result.brand ?? 'Brand not reported'} · PostgreSQL product search</span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
