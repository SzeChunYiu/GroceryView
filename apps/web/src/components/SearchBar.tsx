'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import { useId, useState } from 'react';
import { useSearch } from '@/hooks/useSearch';

export function SearchBar() {
  const inputId = useId();
  const listboxId = useId();
  const [query, setQuery] = useState('');
  const { results, status, trimmedQuery, minQueryLength } = useSearch(query);
  const shouldShowDropdown = status !== 'idle' && trimmedQuery.length >= minQueryLength;

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
                  role="option"
                >
                  <span className="block text-sm font-black text-slate-950">{result.name}</span>
                  <span className="mt-1 block text-xs font-semibold text-slate-600">{result.category} · autocomplete suggestion</span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
