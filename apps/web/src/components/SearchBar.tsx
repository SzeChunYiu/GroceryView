'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useState, type KeyboardEvent } from 'react';
import { SearchResultItem } from './SearchResultItem';
import { MIN_QUERY_LENGTH, useSearch } from '@/hooks/useSearch';

export function SearchBar() {
  const router = useRouter();
  const inputId = useId();
  const listboxId = useId();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const { results, status, trimmedQuery } = useSearch(query);
  const shouldShowDropdown = status !== 'idle' && trimmedQuery.length >= MIN_QUERY_LENGTH;
  const activeResult = activeIndex === null ? null : results[activeIndex] ?? null;
  const activeOptionId = activeResult ? `${listboxId}-option-${activeResult.id}` : undefined;

  useEffect(() => {
    setActiveIndex(null);
  }, [trimmedQuery]);

  useEffect(() => {
    if (results.length === 0) {
      setActiveIndex(null);
      return;
    }

    setActiveIndex((current) => (current !== null && current >= results.length ? results.length - 1 : current));
  }, [results]);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!shouldShowDropdown) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (results.length === 0) return;
      setActiveIndex((current) => (current === null ? 0 : (current + 1) % results.length));
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (results.length === 0) return;
      setActiveIndex((current) => (current === null ? results.length - 1 : (current - 1 + results.length) % results.length));
    }

    if (event.key === 'Enter' && activeResult) {
      event.preventDefault();
      router.push(`/products/${activeResult.slug}`);
    }

    if (event.key === 'Escape') {
      setActiveIndex(null);
    }
  }

  return (
    <div className="relative w-full max-w-xl lg:w-[min(36vw,28rem)]">
      <label className="sr-only" htmlFor={inputId}>Search products by name or brand</label>
      <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm focus-within:border-emerald-700 focus-within:ring-2 focus-within:ring-emerald-100">
        <Search className="h-4 w-4 text-slate-500" aria-hidden="true" />
        <input
          aria-autocomplete="list"
          aria-activedescendant={activeOptionId}
          aria-controls={listboxId}
          aria-expanded={shouldShowDropdown}
          aria-label="Search products"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-500"
          id={inputId}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
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
              {results.map((result, index) => (
                <SearchResultItem
                  id={`${listboxId}-option-${result.id}`}
                  isActive={activeIndex === index}
                  key={result.id}
                  result={result}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
