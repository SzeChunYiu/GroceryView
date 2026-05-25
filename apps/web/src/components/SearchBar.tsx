'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import { useEffect, useId, useMemo, useState, type KeyboardEvent } from 'react';
import { readRecentProductSearches, rememberRecentProductSearch, trackSearchToSavingsFunnelStep, type RecentProductSearch } from '@/lib/analytics';

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
  resultCount?: number;
  results: ProductSearchResult[];
  error?: string;
};

type SearchStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error';
type SearchSuggestionOption = {
  description: string;
  href: string;
  id: string;
  label: string;
  type: 'recent' | 'product' | 'fallback-search' | 'fallback-category';
};

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
  const statusId = useId();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentProductSearch[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [isDropdownDismissed, setIsDropdownDismissed] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [status, setStatus] = useState<SearchStatus>('idle');
  const trimmedQuery = useMemo(() => query.trim(), [query]);
  const emptyFallback = useMemo(() => zeroResultFallbacks(trimmedQuery), [trimmedQuery]);
  const shouldShowRecentSearches = isFocused && trimmedQuery.length === 0 && recentSearches.length > 0;
  const suggestionOptions = useMemo<SearchSuggestionOption[]>(() => {
    if (shouldShowRecentSearches) {
      return recentSearches.map((search, index) => ({
        description: `${search.resultCount} verified result${search.resultCount === 1 ? '' : 's'}`,
        href: search.href,
        id: `${listboxId}-recent-${index}`,
        label: search.query,
        type: 'recent'
      }));
    }

    if (status === 'ready') {
      return results.map((result) => ({
        description: `${result.brand ?? 'Brand not reported'} · PostgreSQL product search`,
        href: `/products/${result.slug}`,
        id: `${listboxId}-product-${result.id}`,
        label: result.name,
        type: 'product'
      }));
    }

    if (status === 'empty') {
      return [
        ...emptyFallback.searches.map((search, index) => ({
          description: 'Related search',
          href: `/products?q=${encodeURIComponent(search)}`,
          id: `${listboxId}-fallback-search-${index}`,
          label: search,
          type: 'fallback-search' as const
        })),
        ...emptyFallback.categories.map((category, index) => ({
          description: 'Browse category',
          href: `/products?category=${encodeURIComponent(category)}`,
          id: `${listboxId}-fallback-category-${index}`,
          label: category,
          type: 'fallback-category' as const
        }))
      ];
    }

    return [];
  }, [emptyFallback.categories, emptyFallback.searches, listboxId, recentSearches, results, shouldShowRecentSearches, status]);
  const shouldShowDropdown = !isDropdownDismissed && ((status !== 'idle' && trimmedQuery.length >= MIN_QUERY_LENGTH) || shouldShowRecentSearches);
  const activeSuggestion = activeSuggestionIndex >= 0 ? suggestionOptions[activeSuggestionIndex] ?? null : null;
  const activeDescendant = shouldShowDropdown ? activeSuggestion?.id : undefined;
  const statusMessage = activeSuggestion
    ? `${activeSuggestion.label}, ${activeSuggestion.description}`
    : shouldShowDropdown
      ? `${suggestionOptions.length} search suggestion${suggestionOptions.length === 1 ? '' : 's'} available.`
      : 'Search suggestions collapsed.';

  useEffect(() => {
    setRecentSearches(readRecentProductSearches());
  }, []);

  useEffect(() => {
    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setStatus('idle');
      setActiveSuggestionIndex(-1);
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

  useEffect(() => {
    setActiveSuggestionIndex((currentIndex) => (
      currentIndex >= suggestionOptions.length ? suggestionOptions.length - 1 : currentIndex
    ));
  }, [suggestionOptions.length]);

  function navigateToSuggestion(option: SearchSuggestionOption) {
    window.location.assign(option.href);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      if (shouldShowDropdown) {
        event.preventDefault();
        setActiveSuggestionIndex(-1);
        setIsDropdownDismissed(true);
      }
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!shouldShowDropdown || suggestionOptions.length === 0) return;
      event.preventDefault();
      setActiveSuggestionIndex((currentIndex) => {
        if (event.key === 'ArrowDown') return currentIndex < suggestionOptions.length - 1 ? currentIndex + 1 : 0;
        return currentIndex > 0 ? currentIndex - 1 : suggestionOptions.length - 1;
      });
      return;
    }

    if (event.key === 'Enter' && shouldShowDropdown && activeSuggestion) {
      event.preventDefault();
      navigateToSuggestion(activeSuggestion);
    }
  }

  return (
    <div className="relative w-full max-w-xl lg:w-[min(36vw,28rem)]" data-search-surface={surface}>
      <label className="sr-only" htmlFor={inputId}>Search products by name or brand</label>
      <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm focus-within:border-emerald-700 focus-within:ring-2 focus-within:ring-emerald-100">
        <Search className="h-4 w-4 text-slate-500" aria-hidden="true" />
        <input
          aria-autocomplete="list"
          aria-activedescendant={activeDescendant}
          aria-controls={listboxId}
          aria-describedby={statusId}
          aria-expanded={shouldShowDropdown}
          aria-label="Search products"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-500"
          id={inputId}
          onBlur={() => window.setTimeout(() => setIsFocused(false), 120)}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveSuggestionIndex(-1);
            setIsDropdownDismissed(false);
          }}
          onFocus={() => {
            setRecentSearches(readRecentProductSearches());
            setIsFocused(true);
            setIsDropdownDismissed(false);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search product or brand"
          role="combobox"
          type="search"
          value={query}
        />
      </div>
      <p className="sr-only" id={statusId} aria-live="polite">{statusMessage}</p>

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
                    aria-selected={activeDescendant === `${listboxId}-recent-${recentSearches.indexOf(search)}`}
                    className={`rounded-2xl px-3 py-2 text-sm font-black transition ${activeDescendant === `${listboxId}-recent-${recentSearches.indexOf(search)}` ? 'bg-emerald-50 text-emerald-900' : 'bg-slate-50 text-slate-800 hover:bg-emerald-50 hover:text-emerald-900'}`}
                    href={search.href}
                    id={`${listboxId}-recent-${recentSearches.indexOf(search)}`}
                    key={`${search.query}-${search.searchedAt}`}
                    onMouseEnter={() => setActiveSuggestionIndex(recentSearches.indexOf(search))}
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
                  <Link
                    aria-selected={activeDescendant === `${listboxId}-fallback-search-${emptyFallback.searches.indexOf(search)}`}
                    className={`rounded-full px-3 py-1 text-xs font-black ${activeDescendant === `${listboxId}-fallback-search-${emptyFallback.searches.indexOf(search)}` ? 'bg-emerald-800 text-white' : 'bg-emerald-50 text-emerald-900'}`}
                    href={`/products?q=${encodeURIComponent(search)}`}
                    id={`${listboxId}-fallback-search-${emptyFallback.searches.indexOf(search)}`}
                    key={search}
                    onMouseEnter={() => setActiveSuggestionIndex(emptyFallback.searches.indexOf(search))}
                    role="option"
                  >
                    {search}
                  </Link>
                ))}
              </div>
              <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500">Browse categories</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {emptyFallback.categories.map((category) => (
                  <Link
                    aria-selected={activeDescendant === `${listboxId}-fallback-category-${emptyFallback.categories.indexOf(category)}`}
                    className={`rounded-full px-3 py-1 text-xs font-black ${activeDescendant === `${listboxId}-fallback-category-${emptyFallback.categories.indexOf(category)}` ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-800'}`}
                    href={`/products?category=${encodeURIComponent(category)}`}
                    id={`${listboxId}-fallback-category-${emptyFallback.categories.indexOf(category)}`}
                    key={category}
                    onMouseEnter={() => setActiveSuggestionIndex(emptyFallback.searches.length + emptyFallback.categories.indexOf(category))}
                    role="option"
                  >
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
                  aria-selected={activeDescendant === `${listboxId}-product-${result.id}`}
                  className={`block px-4 py-3 transition focus:bg-emerald-50 focus:outline-none ${activeDescendant === `${listboxId}-product-${result.id}` ? 'bg-emerald-50' : 'hover:bg-emerald-50'}`}
                  href={`/products/${result.slug}`}
                  id={`${listboxId}-product-${result.id}`}
                  key={result.id}
                  onMouseEnter={() => setActiveSuggestionIndex(results.findIndex((candidate) => candidate.id === result.id))}
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
