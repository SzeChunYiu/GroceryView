'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { readRecentProductSearches, type RecentProductSearch } from '@/lib/recent-searches';

export function RecentProductSearchesPanel() {
  const [recentSearches, setRecentSearches] = useState<RecentProductSearch[]>([]);

  useEffect(() => {
    setRecentSearches(readRecentProductSearches());
  }, []);

  if (recentSearches.length === 0) return null;

  return (
    <section className="mt-5 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm" data-products-recent-searches>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-700">Recent searches</p>
          <h3 className="text-lg font-black text-slate-950">Compare staples again</h3>
        </div>
        <p className="text-xs font-bold text-slate-500">Saved locally on this device</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {recentSearches.map((search) => (
          <Link className="rounded-full bg-violet-50 px-3 py-2 text-xs font-black text-violet-900 transition hover:bg-violet-900 hover:text-white" href={search.href} key={`${search.query}-${search.searchedAt}`}>
            {search.query}
            <span className="ml-2 font-semibold opacity-75">{search.resultCount} result{search.resultCount === 1 ? '' : 's'}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
