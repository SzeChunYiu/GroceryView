'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { SavedSearchSubscription } from '@/lib/alert-scheduler';

type SavedSearchActionsProps = {
  accountId?: string;
  resultCount: number;
  subscription: SavedSearchSubscription;
};

type SaveStatus = 'idle' | 'saving' | 'saved' | 'updated' | 'blocked' | 'error';

const saveableFilterLabels: Record<string, string> = {
  q: 'Query',
  category: 'Category',
  chain: 'Chain',
  minPrice: 'Min price',
  maxPrice: 'Max price',
  dietary: 'Dietary',
  origin: 'Origin'
};

function saveableFilters(filters: Record<string, string[]>): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(filters)
      .filter(([key]) => key in saveableFilterLabels)
      .filter(([, values]) => values.length > 0)
  );
}

export function SavedSearchActions({ accountId = 'signed-in-user', resultCount, subscription }: Readonly<SavedSearchActionsProps>) {
  const filters = saveableFilters(subscription.filters);
  const filterEntries = Object.entries(filters);
  const hasFilters = filterEntries.length > 0;
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [message, setMessage] = useState('Save product filters to your signed-in account so repeat staple checks open with the same URL parameters.');

  async function saveFilters() {
    if (!hasFilters) {
      setStatus('blocked');
      setMessage('Choose a query, category, chain, price, dietary, or origin filter before saving.');
      return;
    }

    setStatus('saving');
    setMessage('Saving filters…');

    try {
      const response = await fetch('/api/saved-searches', {
        body: JSON.stringify({
          accountId,
          filters,
          href: subscription.href,
          id: subscription.id,
          label: subscription.label,
          resultCount
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST'
      });
      const payload = await response.json() as { error?: string; status?: 'saved' | 'updated' };
      if (!response.ok) throw new Error(payload.error ?? 'Unable to save filters.');

      setStatus(payload.status === 'updated' ? 'updated' : 'saved');
      setMessage(payload.status === 'updated' ? 'Updated this saved filter set for your signed-in account.' : 'Saved these product filters to your signed-in account.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unable to save filters.');
    }
  }

  return (
    <section className="mt-5 rounded-3xl border border-emerald-100 bg-emerald-50/80 p-4 shadow-sm" aria-label="Signed-in saved product filters">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">Signed-in saved filters</p>
          <h3 className="mt-2 text-xl font-black text-slate-950">Save this product search</h3>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-emerald-950">
            {hasFilters ? subscription.label : 'Add product filters before saving a repeat search.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white disabled:bg-slate-300" disabled={!hasFilters || status === 'saving'} onClick={saveFilters} type="button">
            {status === 'saving' ? 'Saving…' : 'Save filters'}
          </button>
          <Link className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-900" href="/account">
            Account
          </Link>
        </div>
      </div>
      <p className="mt-3 text-xs font-bold text-emerald-900" data-saved-filter-status={status}>{message}</p>
      {hasFilters ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {filterEntries.map(([key, values]) => (
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-900 shadow-sm" key={key}>
              {saveableFilterLabels[key]}: {values.join(', ')}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
