'use client';

import Link from 'next/link';
import { Mic, Search } from 'lucide-react';
import type { KeyboardEvent, ReactNode } from 'react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { trackSearchToSavingsFunnelStep, trackVoiceSearchInput } from '@/lib/analytics';
import {
  clearRecentSearchHistory,
  pinSavedSearch,
  readRecentSearchHistory,
  readSavedSearches,
  rememberRecentSearchHistory,
  type RecentSearchHistoryEntry,
  type SavedSearchEntry
} from '@/lib/personalization';
import type { SearchExplanationBadge } from '@/lib/search-filters';

type ProductSearchResult = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  searchRank: number;
  searchExplanationBadges?: SearchExplanationBadge[];
};

type ProductSearchResponse = {
  query: string;
  results: ProductSearchResult[];
  error?: string;
};

type HeaderSearchFacetChip = {
  kind: 'category' | 'chain' | 'diet' | 'price-range';
  label: string;
  href: string;
  count?: number;
};

type HeaderSuggestItem = {
  id: string;
  group: 'products' | 'brands' | 'categories' | 'stores';
  label: string;
  href: string;
  detail?: string;
  matchRanges?: Array<[number, number]>;
};

type HeaderSuggestGroup = {
  id: HeaderSuggestItem['group'];
  label: string;
  items: HeaderSuggestItem[];
};

type HeaderSuggestResponse = {
  facets?: HeaderSearchFacetChip[];
  groups?: HeaderSuggestGroup[];
};

type SearchStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error';
type VoiceSearchStatus = 'idle' | 'listening' | 'unsupported' | 'error';

type GrocerySpeechRecognitionEvent = {
  results: {
    [index: number]: {
      [index: number]: { transcript: string };
    };
  };
};

type GrocerySpeechRecognition = {
  abort: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: GrocerySpeechRecognitionEvent) => void) | null;
  onstart: (() => void) | null;
  start: () => void;
};

type GrocerySpeechRecognitionConstructor = new () => GrocerySpeechRecognition;
type VoiceSearchWindow = Window & {
  SpeechRecognition?: GrocerySpeechRecognitionConstructor;
  webkitSpeechRecognition?: GrocerySpeechRecognitionConstructor;
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

function HighlightedMatch({ label, ranges = [] }: Readonly<{ label: string; ranges?: Array<[number, number]> }>) {
  if (ranges.length === 0) return <>{label}</>;

  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const [start, end] of ranges) {
    if (start > cursor) parts.push(label.slice(cursor, start));
    parts.push(<mark className="rounded bg-amber-100 px-0.5 text-slate-950" key={`${label}-${start}-${end}`}>{label.slice(start, end)}</mark>);
    cursor = end;
  }
  if (cursor < label.length) parts.push(label.slice(cursor));

  return <>{parts}</>;
}

export function SearchBar({ surface = 'global-nav' }: Readonly<{ surface?: string }>) {
  const inputId = useId();
  const listboxId = useId();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [facetChips, setFacetChips] = useState<HeaderSearchFacetChip[]>([]);
  const [suggestGroups, setSuggestGroups] = useState<HeaderSuggestGroup[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearchHistoryEntry[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearchEntry[]>([]);
  const [activeOptionIndex, setActiveOptionIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [voiceStatus, setVoiceStatus] = useState<VoiceSearchStatus>('idle');
  const voiceRecognitionRef = useRef<GrocerySpeechRecognition | null>(null);
  const trimmedQuery = useMemo(() => query.trim(), [query]);
  const emptyFallback = useMemo(() => zeroResultFallbacks(trimmedQuery), [trimmedQuery]);
  const shouldShowRecentSearches = isFocused && trimmedQuery.length === 0 && (recentSearches.length > 0 || savedSearches.length > 0);
  const shouldShowDropdown = (status !== 'idle' && trimmedQuery.length >= MIN_QUERY_LENGTH) || shouldShowRecentSearches;
  const optionCount = useMemo(() => {
    if (shouldShowRecentSearches) return recentSearches.length + savedSearches.length;
    const groupedCount = suggestGroups.reduce((total, group) => total + group.items.length, 0);
    const productResultCount = groupedCount === 0 && status === 'ready' ? results.length : 0;
    return groupedCount + facetChips.length + productResultCount;
  }, [facetChips.length, recentSearches.length, results.length, savedSearches.length, shouldShowRecentSearches, status, suggestGroups]);

  useEffect(() => {
    setRecentSearches(readRecentSearchHistory());
    setSavedSearches(readSavedSearches());
  }, []);

  useEffect(() => () => {
    voiceRecognitionRef.current?.abort();
    voiceRecognitionRef.current = null;
  }, []);

  function submitVoiceQuery(nextQuery: string) {
    const trimmedVoiceQuery = nextQuery.trim();
    if (!trimmedVoiceQuery) return;
    setQuery(trimmedVoiceQuery);
    setIsFocused(true);
    trackVoiceSearchInput({ query: trimmedVoiceQuery, status: 'submitted', surface });
    window.setTimeout(() => {
      window.location.assign(`/products?q=${encodeURIComponent(trimmedVoiceQuery)}`);
    }, 250);
  }

  function startVoiceSearch() {
    const voiceWindow = window as VoiceSearchWindow;
    const Recognition = voiceWindow.SpeechRecognition ?? voiceWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceStatus('unsupported');
      trackVoiceSearchInput({ status: 'unsupported', surface });
      return;
    }

    voiceRecognitionRef.current?.abort();
    const recognition = new Recognition();
    voiceRecognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = navigator.language || 'sv-SE';
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      setVoiceStatus('listening');
      trackVoiceSearchInput({ status: 'started', surface });
    };
    recognition.onresult = (event) => {
      submitVoiceQuery(event.results[0]?.[0]?.transcript ?? '');
    };
    recognition.onerror = () => {
      setVoiceStatus('error');
      trackVoiceSearchInput({ status: 'error', surface });
    };
    recognition.onend = () => {
      setVoiceStatus((current) => current === 'listening' ? 'idle' : current);
      voiceRecognitionRef.current = null;
    };

    try {
      recognition.start();
    } catch {
      setVoiceStatus('error');
      trackVoiceSearchInput({ status: 'error', surface });
    }
  }

  useEffect(() => {
    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setFacetChips([]);
      setSuggestGroups([]);
      setActiveOptionIndex(-1);
      setStatus('idle');
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setStatus('loading');
      try {
        try {
          const suggestResponse = await fetch(`/api/suggest?q=${encodeURIComponent(trimmedQuery)}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' }
          });
          if (suggestResponse.ok) {
            const suggestPayload = await suggestResponse.json() as HeaderSuggestResponse;
            if (!controller.signal.aborted) {
              setFacetChips(suggestPayload.facets ?? []);
              setSuggestGroups(suggestPayload.groups ?? []);
            }
          } else if (!controller.signal.aborted) {
            setFacetChips([]);
            setSuggestGroups([]);
          }
        } catch {
          if (!controller.signal.aborted) {
            setFacetChips([]);
            setSuggestGroups([]);
          }
        }

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
        if (nextResults.length > 0) setRecentSearches(rememberRecentSearchHistory(trimmedQuery, nextResults.length));
        trackSearchToSavingsFunnelStep('landing_search');
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Product search request failed', error instanceof Error ? { name: error.name } : { name: 'unknown' });
        setResults([]);
        setFacetChips([]);
        setSuggestGroups([]);
        setStatus('error');
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [trimmedQuery]);

  useEffect(() => {
    setActiveOptionIndex(-1);
  }, [trimmedQuery, shouldShowDropdown]);

  function focusOption(index: number) {
    if (optionCount === 0) return;
    const nextIndex = (index + optionCount) % optionCount;
    setActiveOptionIndex(nextIndex);
    window.requestAnimationFrame(() => {
      const option = document.querySelector<HTMLElement>(`[data-search-option-index="${nextIndex}"]`);
      option?.focus();
    });
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' && activeOptionIndex >= 0) {
      const option = document.querySelector<HTMLAnchorElement>(`[data-search-option-index="${activeOptionIndex}"]`);
      if (option) {
        event.preventDefault();
        option.click();
      }
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'Escape') return;
    if (event.key === 'Escape') {
      setIsFocused(false);
      setActiveOptionIndex(-1);
      return;
    }
    if (!shouldShowDropdown || optionCount === 0) return;
    event.preventDefault();
    const targetIndex = event.key === 'ArrowDown'
      ? (activeOptionIndex < 0 ? 0 : activeOptionIndex + 1)
      : (activeOptionIndex < 0 ? optionCount - 1 : activeOptionIndex - 1);
    focusOption(targetIndex);
  }

  function handleOptionKeyDown(event: KeyboardEvent<HTMLElement>, index: number) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      focusOption(event.key === 'ArrowDown' ? index + 1 : index - 1);
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setIsFocused(false);
      setActiveOptionIndex(-1);
      document.getElementById(inputId)?.focus();
    }
  }

  let optionIndex = 0;
  const nextOptionIndex = () => optionIndex++;

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
            setRecentSearches(readRecentSearchHistory());
            setSavedSearches(readSavedSearches());
            setIsFocused(true);
          }}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search product or brand"
          role="combobox"
          type="search"
          value={query}
        />
        <button
          aria-label={voiceStatus === 'listening' ? 'Listening for grocery search' : 'Search by voice'}
          className="rounded-full p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={voiceStatus === 'listening'}
          onClick={startVoiceSearch}
          onMouseDown={(event) => event.preventDefault()}
          title={voiceStatus === 'unsupported' ? 'Voice search is not supported in this browser' : 'Search by voice'}
          type="button"
        >
          <Mic className={voiceStatus === 'listening' ? 'h-4 w-4 animate-pulse text-emerald-700' : 'h-4 w-4'} aria-hidden="true" />
        </button>
        <Link
          aria-label="Scan a barcode with the camera"
          className="rounded-full px-2 py-1 text-xs font-black text-slate-600 transition hover:bg-sky-50 hover:text-sky-800"
          href="/scanner?handoff=search-bar#barcode-scan"
          onMouseDown={(event) => event.preventDefault()}
          title="Scan barcode"
        >
          Scan
        </Link>
      </div>
      {voiceStatus === 'unsupported' || voiceStatus === 'error' ? (
        <p className="mt-2 px-4 text-xs font-bold text-amber-800" role="status">
          {voiceStatus === 'unsupported' ? 'Voice search is not supported in this browser yet.' : 'Voice search could not start. Try typing your grocery search.'}
        </p>
      ) : null}

      {shouldShowDropdown ? (
        <div
          className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/10"
          id={listboxId}
          role="listbox"
        >
          {shouldShowRecentSearches ? (
            <div className="px-4 py-3" data-recent-product-searches>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Recent searches</p>
                <button
                  className="text-xs font-black text-slate-500 underline decoration-slate-300 underline-offset-4 hover:text-rose-700"
                  onClick={() => setRecentSearches(clearRecentSearchHistory())}
                  onMouseDown={(event) => event.preventDefault()}
                  type="button"
                >
                  Clear all
                </button>
              </div>
              <div className="mt-2 grid gap-2">
                {savedSearches.map((search) => {
                  const index = nextOptionIndex();
                  return (
                    <Link
                      className="rounded-2xl bg-violet-50 px-3 py-2 text-sm font-black text-violet-950 transition hover:bg-violet-100 focus:bg-violet-100 focus:outline-none"
                      data-search-option-index={index}
                      href={search.href}
                      key={`saved-${search.query}-${search.pinnedAt}`}
                      onFocus={() => setActiveOptionIndex(index)}
                      onKeyDown={(event) => handleOptionKeyDown(event, index)}
                      role="option"
                    >
                      ★ {search.query}
                      <span className="ml-2 text-xs font-semibold text-violet-700">saved search</span>
                    </Link>
                  );
                })}
                {recentSearches.map((search) => {
                  const index = nextOptionIndex();
                  return (
                    <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2" key={`${search.query}-${search.searchedAt}`}>
                      <Link
                        className="flex-1 text-sm font-black text-slate-800 transition hover:text-emerald-900 focus:outline-none"
                        data-search-option-index={index}
                        href={search.href}
                        onFocus={() => setActiveOptionIndex(index)}
                        onKeyDown={(event) => handleOptionKeyDown(event, index)}
                        role="option"
                      >
                        {search.query}
                        <span className="ml-2 text-xs font-semibold text-slate-500">{search.resultCount} verified result{search.resultCount === 1 ? '' : 's'}</span>
                      </Link>
                      <button
                        className="rounded-full bg-white px-2 py-1 text-xs font-black text-violet-800"
                        onClick={() => setSavedSearches(pinSavedSearch(search))}
                        onMouseDown={(event) => event.preventDefault()}
                        type="button"
                      >
                        Pin
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
          {status === 'loading' ? (
            <p className="px-4 py-3 text-sm font-bold text-slate-600">Searching verified products…</p>
          ) : null}
          {suggestGroups.length > 0 ? (
            <div className="max-h-96 overflow-y-auto border-t border-slate-100">
              {suggestGroups.map((group) => (
                <section className="px-4 py-3" key={group.id} aria-label={`${group.label} suggestions`}>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{group.label}</p>
                  <div className="mt-2 grid gap-1">
                    {group.items.map((item) => {
                      const index = nextOptionIndex();
                      return (
                        <Link
                          className="rounded-2xl px-3 py-2 text-sm font-black text-slate-900 transition hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-none"
                          data-search-option-index={index}
                          href={item.href}
                          key={item.id}
                          onFocus={() => setActiveOptionIndex(index)}
                          onKeyDown={(event) => handleOptionKeyDown(event, index)}
                          role="option"
                        >
                          <span className="block"><HighlightedMatch label={item.label} ranges={item.matchRanges} /></span>
                          {item.detail ? <span className="mt-0.5 block text-xs font-semibold text-slate-500">{item.detail}</span> : null}
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          ) : null}
          {facetChips.length > 0 ? (
            <div className="border-t border-slate-100 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Refine search</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {facetChips.map((facet) => {
                  const index = nextOptionIndex();
                  return (
                    <Link
                      className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-900 transition hover:bg-emerald-100 focus:bg-emerald-100 focus:outline-none"
                      data-search-option-index={index}
                      href={facet.href}
                      key={`${facet.kind}-${facet.href}`}
                      onFocus={() => setActiveOptionIndex(index)}
                      onKeyDown={(event) => handleOptionKeyDown(event, index)}
                      role="option"
                    >
                      {facet.label}
                      {facet.count ? <span className="ml-1 text-emerald-700">({facet.count})</span> : null}
                    </Link>
                  );
                })}
              </div>
            </div>
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
          {status === 'ready' && suggestGroups.length === 0 ? (
            <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
              {results.map((result) => {
                const index = nextOptionIndex();
                return (
                  <Link
                    className="block px-4 py-3 transition hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-none"
                    data-search-option-index={index}
                    href={`/products/${result.slug}`}
                    key={result.id}
                    onFocus={() => setActiveOptionIndex(index)}
                    onKeyDown={(event) => handleOptionKeyDown(event, index)}
                    role="option"
                  >
                    <span className="block text-sm font-black text-slate-950">{result.name}</span>
                    <span className="mt-1 block text-xs font-semibold text-slate-600">{result.brand ?? 'Brand not reported'} · PostgreSQL product search</span>
                    {result.searchExplanationBadges && result.searchExplanationBadges.length > 0 ? (
                      <span className="mt-2 flex flex-wrap gap-1.5" data-search-explanation-badges>
                        {result.searchExplanationBadges.slice(0, 3).map((badge) => (
                          <span
                            className="rounded-full bg-indigo-50 px-2 py-0.5 text-[0.65rem] font-black uppercase tracking-[0.12em] text-indigo-900"
                            key={`${result.id}-${badge.kind}-${badge.label}`}
                            title={`Matched: ${badge.matchedTerms.join(', ')}`}
                          >
                            {badge.label}
                          </span>
                        ))}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function RecentSearchReplayPills() {
  const [recentSearches, setRecentSearches] = useState<RecentSearchHistoryEntry[]>([]);

  useEffect(() => {
    setRecentSearches(readRecentSearchHistory());
  }, []);

  if (recentSearches.length === 0) return null;

  return (
    <section className="mx-auto mb-4 w-full max-w-5xl rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm" data-search-history-replay>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">Recent searches</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">Replay successful grocery searches saved on this device.</p>
        </div>
        <button
          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-700 hover:border-rose-200 hover:text-rose-700"
          onClick={() => setRecentSearches(clearRecentSearchHistory())}
          type="button"
        >
          Clear all
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {recentSearches.map((search) => (
          <Link
            className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-black text-emerald-950 hover:bg-emerald-100"
            href={search.href}
            key={`${search.query}-${search.searchedAt}`}
          >
            {search.query}
            <span className="ml-2 text-xs font-semibold text-emerald-800">{search.resultCount}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function MissingProductRequestForm({ query }: Readonly<{ query: string }>) {
  return (
    <form action="/products" className="mt-4 grid gap-3 rounded-2xl border border-amber-200 bg-white p-4" data-missing-product-request="true" method="get">
      <input name="requestMissingProduct" type="hidden" value="1" />
      <label className="text-sm font-black text-slate-950">
        Missing query
        <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold" defaultValue={query} name="missingQuery" />
      </label>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-sm font-black text-slate-950">
          Barcode (optional)
          <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold" inputMode="numeric" name="barcode" />
        </label>
        <label className="text-sm font-black text-slate-950">
          Preferred store (optional)
          <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold" name="preferredStore" placeholder="Willys, ICA, Coop..." />
        </label>
        <label className="text-sm font-black text-slate-950">
          Email for follow-up (optional)
          <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold" name="shopperEmail" type="email" />
        </label>
      </div>
      <button className="rounded-full bg-amber-700 px-4 py-2 text-sm font-black text-white" type="submit">Capture missing product request</button>
    </form>
  );
}
