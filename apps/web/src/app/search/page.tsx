"use client";

import Link from 'next/link';
import { SearchIcon } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

type SearchItem = {
  id: string;
  ticker: string;
  name: string;
  category: string;
  brandTier: string;
  availableChains: string[];
};

type SearchResponse = {
  items: SearchItem[];
  hasMore: boolean;
  nextCursor: string | null;
};

const PAGE_SIZE = 24;

export default function SearchPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get('q') ?? '';

  const [queryInput, setQueryInput] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedSearch, setHasAttemptedSearch] = useState(initialQuery.trim().length > 0);

  const executeSearch = useCallback(
    async (cursor: string | null = null, replace = false) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set('q', query.trim());
        params.set('limit', String(PAGE_SIZE));
        if (cursor) params.set('cursor', cursor);

        const response = await fetch(`/api/search?${params.toString()}`);
        if (!response.ok) {
          throw new Error(`Search request failed: ${response.status} ${response.statusText}`);
        }

        const payload = (await response.json()) as SearchResponse;
        const items = payload.items ?? [];

        setResults((previous) => (replace ? items : [...previous, ...items]));
        setNextCursor(payload.nextCursor ?? null);
        setHasMore(payload.hasMore);
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : 'Search failed';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [query]
  );

  const loadNext = useCallback(() => {
    if (!hasMore || isLoading) return;
    void executeSearch(nextCursor);
  }, [executeSearch, hasMore, isLoading, nextCursor]);

  const loadInitial = useCallback(() => {
    void executeSearch(null, true);
  }, [executeSearch]);

  useEffect(() => {
    if (!hasAttemptedSearch) return;
    loadInitial();
  }, [query, loadInitial, hasAttemptedSearch]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuery = queryInput.trim();
    const nextParams = new URLSearchParams();
    if (nextQuery) nextParams.set('q', nextQuery);

    const nextSearch = nextParams.toString();
    router.replace(`${pathname}${nextSearch ? `?${nextSearch}` : ''}`);
    setHasAttemptedSearch(true);
    setQuery(nextQuery);
    setResults([]);
    setHasMore(false);
    setNextCursor(null);
  };

  const sentinelRef = useInfiniteScroll({
    onLoadMore: loadNext,
    hasMore,
    isLoading,
    enabled: true,
    threshold: 0.2,
    rootMargin: '500px'
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <nav className="mb-6 flex items-center justify-between border-b border-zinc-200 pb-4">
        <Link href="/" className="text-lg font-black tracking-tight">
          GroceryView
        </Link>
        <div className="text-sm font-semibold text-zinc-700">Search</div>
      </nav>

      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Product search</p>
        <h1 className="mt-2 text-4xl font-black leading-tight">Search grocery products</h1>
        <p className="mt-3 max-w-3xl text-sm text-zinc-600">
          Start typing a query to load matching products with cursor-backed pagination.
          More results load automatically as you scroll.
        </p>
      </header>

      <form className="mb-8 flex gap-2" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="search-q">
          Search products
        </label>
        <input
          id="search-q"
          name="q"
          value={queryInput}
          onChange={(event) => setQueryInput(event.target.value)}
          className="h-11 flex-1 rounded-lg border border-zinc-300 bg-white px-3 text-base text-zinc-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          placeholder="Search for coffee, milk, pasta..."
        />
        <button
          className="inline-flex h-11 items-center justify-center rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
          type="submit"
        >
          <SearchIcon className="mr-2 h-4 w-4" aria-hidden="true" />
          Search
        </button>
      </form>

      {error ? <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}

      <section className="mb-4 rounded-lg border border-zinc-200 bg-white">
        <div className="grid grid-cols-[1.6fr_1fr_1fr_0.8fr] border-b border-zinc-200 px-4 py-3 text-xs font-bold uppercase tracking-wide text-zinc-500">
          <span>Product</span>
          <span>Ticker</span>
          <span>Category</span>
          <span className="text-right">Brand tier</span>
        </div>

        {results.length === 0 && !isLoading ? (
          <p className="p-5 text-sm text-zinc-600">
            {hasAttemptedSearch
              ? `No matches for "${query}".`
              : 'Type a query and press Search to begin.'}
          </p>
        ) : null}

        <ul className="divide-y divide-zinc-100">
          {results.map((product) => (
            <li
              key={product.id}
              className="grid grid-cols-[1.6fr_1fr_1fr_0.8fr] gap-3 px-4 py-3 text-sm hover:bg-zinc-50"
            >
              <span className="font-semibold text-zinc-950">{product.name}</span>
              <span className="text-zinc-600">{product.ticker}</span>
              <span className="text-zinc-600">{product.category}</span>
              <span className="text-right text-xs text-zinc-500">{product.brandTier}</span>
            </li>
          ))}
        </ul>
      </section>

      <div ref={sentinelRef} className="h-10" />

      {isLoading ? (
        <p className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-600">Loading results...</p>
      ) : null}

      {!hasMore && results.length > 0 ? (
        <p className="mt-3 rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-600">You reached the end of matching results.</p>
      ) : null}
    </main>
  );
}
