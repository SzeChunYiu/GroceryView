'use client';

import { Search, Star, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export const preferredStoreStorageKey = 'groceryview:preferred-store-ids';
export const preferredStoresChangedEvent = 'groceryview:preferred-stores-changed';

export type StoreSelectorOption = {
  id: string;
  name: string;
  brand: string;
  district: string;
  address: string;
};

type StoreSelectorProps = {
  stores: StoreSelectorOption[];
  initialPreferredStoreIds?: string[];
  apiEndpoint?: string;
};

function normalizePreferredStoreIds(storeIds: string[], allowedStoreIds: Set<string>) {
  return [...new Set(storeIds.map((storeId) => storeId.trim()).filter((storeId) => allowedStoreIds.has(storeId)))].slice(0, 5);
}

export function readPreferredStoreIds() {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(preferredStoreStorageKey) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((storeId): storeId is string => typeof storeId === 'string') : [];
  } catch {
    return [];
  }
}

export function orderByPreferredStores<T>(rows: T[], preferredStoreIds: string[], getStoreId: (row: T) => string) {
  const preferredRank = new Map(preferredStoreIds.map((storeId, index) => [storeId, index]));
  return [...rows].sort((left, right) => {
    const leftRank = preferredRank.get(getStoreId(left)) ?? Number.MAX_SAFE_INTEGER;
    const rightRank = preferredRank.get(getStoreId(right)) ?? Number.MAX_SAFE_INTEGER;
    return leftRank - rightRank;
  });
}

export function StoreSelector({ stores, initialPreferredStoreIds = [], apiEndpoint }: Readonly<StoreSelectorProps>) {
  const allowedStoreIds = useMemo(() => new Set(stores.map((store) => store.id)), [stores]);
  const [query, setQuery] = useState('');
  const [preferredStoreIds, setPreferredStoreIds] = useState(() => normalizePreferredStoreIds(initialPreferredStoreIds, allowedStoreIds));
  const selectedStores = useMemo(
    () => preferredStoreIds.map((storeId) => stores.find((store) => store.id === storeId)).filter((store): store is StoreSelectorOption => Boolean(store)),
    [preferredStoreIds, stores]
  );
  const filteredStores = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return stores
      .filter((store) => !preferredStoreIds.includes(store.id))
      .filter((store) => {
        if (!normalizedQuery) return true;
        return `${store.name} ${store.brand} ${store.district} ${store.address}`.toLowerCase().includes(normalizedQuery);
      })
      .slice(0, 18);
  }, [preferredStoreIds, query, stores]);

  useEffect(() => {
    const stored = normalizePreferredStoreIds(readPreferredStoreIds(), allowedStoreIds);
    if (stored.length > 0) setPreferredStoreIds(stored);
  }, [allowedStoreIds]);

  function persist(nextStoreIds: string[]) {
    const normalized = normalizePreferredStoreIds(nextStoreIds, allowedStoreIds);
    setPreferredStoreIds(normalized);
    window.localStorage.setItem(preferredStoreStorageKey, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent(preferredStoresChangedEvent, { detail: normalized }));
    if (apiEndpoint) {
      void fetch(apiEndpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeIds: normalized })
      });
    }
  }

  function addStore(storeId: string) {
    if (preferredStoreIds.length >= 5) return;
    persist([...preferredStoreIds, storeId]);
  }

  function removeStore(storeId: string) {
    persist(preferredStoreIds.filter((candidate) => candidate !== storeId));
  }

  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">Preferred stores</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Frequently visited stores</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
            Pick 1-5 stores. Matching comparison rows and map lists place these stores first on this device.
          </p>
        </div>
        <p className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-950">{preferredStoreIds.length}/5 selected</p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-sm font-black text-emerald-950">Selected</p>
          <div className="mt-3 space-y-2">
            {selectedStores.length > 0 ? selectedStores.map((store) => (
              <div className="flex items-start justify-between gap-3 rounded-2xl bg-white p-3" key={store.id}>
                <div>
                  <p className="font-black text-slate-950">{store.name}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-600">{store.brand} · {store.district || 'District not reported'}</p>
                </div>
                <button
                  aria-label={`Remove ${store.name}`}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-800"
                  onClick={() => removeStore(store.id)}
                  type="button"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            )) : (
              <p className="rounded-2xl bg-white p-3 text-sm font-semibold text-slate-600">Choose at least one store to prioritize rows.</p>
            )}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Search aria-hidden="true" className="h-4 w-4 text-slate-500" />
            <span className="sr-only">Search stores</span>
            <input
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-500"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, chain, or district"
              type="search"
              value={query}
            />
          </label>
          <div className="mt-3 grid max-h-[28rem] gap-2 overflow-y-auto pr-1 md:grid-cols-2">
            {filteredStores.map((store) => (
              <button
                className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-emerald-600 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={preferredStoreIds.length >= 5}
                key={store.id}
                onClick={() => addStore(store.id)}
                type="button"
              >
                <Star aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-emerald-800" />
                <span>
                  <span className="block font-black leading-5 text-slate-950">{store.name}</span>
                  <span className="mt-1 block text-xs font-semibold text-slate-600">{store.brand} · {store.district || store.address || 'Location not reported'}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
