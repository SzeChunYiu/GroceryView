'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';
import { trackSearchToSavingsFunnelStep } from '@/lib/analytics';
import { readRecentProductSearches, rememberRecentProductSearch, type RecentProductSearch } from '@/lib/recent-searches';

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
const ZERO_RESULT_FALLBACKS = [
  { categories: ['Dairy', 'Breakfast'], keywords: ['fil', 'milk', 'yogurt', 'cheese', 'lactose'], searches: ['lactosefri mjölk', 'yoghurt', 'ost'] },
  { categories: ['Fruit', 'Vegetables'], keywords: ['apple', 'banana', 'fruit', 'greens', 'veg'], searches: ['äpplen', 'bananer', 'grönsaker'] },
  { categories: ['Pantry', 'Breakfast'], keywords: ['oat', 'rice', 'pasta', 'flour', 'cereal'], searches: ['havregryn', 'pasta', 'ris'] },
  { categories: ['Coffee', 'Drinks'], keywords: ['coffee', 'tea', 'juice', 'drink', 'soda'], searches: ['kaffe', 'te', 'juice'] },
  { categories: ['Frozen', 'Ready meals'], keywords: ['frozen', 'pizza', 'meal', 'dinner'], searches: ['fryst pizza', 'färdigrätt', 'frysta grönsaker'] }
];

function zeroResultFallbacks(query: string) {
  const normalizedQuery = query.toLocaleLowerCase('sv-SE');
  const matchedFallback = ZERO_RESULT_FALLBACKS.find((fallback) => (
    fallback.keywords.some((keyword) => normalizedQuery.includes(keyword))
  )) ?? ZERO_RESULT_FALLBACKS[0];

  return matchedFallback;
}

export function SearchBar({ surface = 'global-nav' }: Readonly<{ surface?: string }>) {
  const inputId = useId();
  const listboxId = useId();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentProductSearch[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [status, setStatus] = useState<SearchStatus>('idle');
  const trimmedQuery = useMemo(() => query.trim(), [query]);
  const emptyFallback = useMemo(() => zeroResultFallbacks(trimmedQuery), [trimmedQuery]);
  const shouldShowRecentSearches = isFocused && trimmedQuery.length === 0 && recentSearches.length > 0;
  const shouldShowDropdown = (status !== 'idle' && trimmedQuery.length >= MIN_QUERY_LENGTH) || shouldShowRecentSearches;

  useEffect(() => {
    setRecentSearches(readRecentProductSearches());
  }, []);

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
        const nextResults = payload.results ?? [];
        setResults(nextResults);
        setStatus(nextResults.length > 0 ? 'ready' : 'empty');
        if (nextResults.length > 0) setRecentSearches(rememberRecentProductSearch(trimmedQuery, nextResults.length));
        trackSearchToSavingsFunnelStep('landing_search');
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Product search request failed', error instanceof Error ? { name: error.name } : { name: 'unknown' });
        setResults([]);
        setStatus('error');
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [trimmedQuery]);

  return (
    <div className="relative w-full max-w-xl lg:w-[min(36vw,28rem)]" data-search-surface={surface}>
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
          onBlur={() => window.setTimeout(() => setIsFocused(false), 120)}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => {
            setRecentSearches(readRecentProductSearches());
            setIsFocused(true);
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
          {shouldShowRecentSearches ? (
            <div className="px-4 py-3" data-recent-product-searches>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Recent searches</p>
              <div className="mt-2 grid gap-2">
                {recentSearches.map((search) => (
                  <Link
                    className="rounded-2xl bg-slate-50 px-3 py-2 text-sm font-black text-slate-800 transition hover:bg-emerald-50 hover:text-emerald-900"
                    href={search.href}
                    key={`${search.query}-${search.searchedAt}`}
                    role="option"
                  >
                    {search.query}
                    <span className="ml-2 text-xs font-semibold text-slate-500">{search.resultCount} verified result{search.resultCount === 1 ? '' : 's'}</span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
          {status === 'loading' ? (
            <p className="px-4 py-3 text-sm font-bold text-slate-600">Searching verified products…</p>
          ) : null}
          {status === 'error' ? (
            <p className="px-4 py-3 text-sm font-bold text-rose-800">Product search is temporarily unavailable.</p>
          ) : null}
          {status === 'empty' ? (
            <div className="px-4 py-3">
              <p className="text-sm font-bold text-slate-700">No products matched “{trimmedQuery}”.</p>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">Try related searches</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {emptyFallback.searches.map((search) => (
                  <Link className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-900" href={`/products?q=${encodeURIComponent(search)}`} key={search}>
                    {search}
                  </Link>
                ))}
              </div>
              <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500">Browse categories</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {emptyFallback.categories.map((category) => (
                  <Link className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-800" href={`/products?category=${encodeURIComponent(category)}`} key={category}>
                    {category}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
          {status === 'ready' ? (
            <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
              {results.map((result) => (
                <Link
                  className="block px-4 py-3 transition hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-none"
                  href={`/products/${result.slug}`}
                  key={result.id}
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
