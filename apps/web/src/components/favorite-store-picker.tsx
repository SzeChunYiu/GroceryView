'use client';

import { useEffect, useMemo, useState } from 'react';
import { osmStores } from '@/lib/osm-stores';

export const FAVORITE_STORE_PICKER_STORAGE_KEY = 'groceryview:favorite-store-picker:v1';

type FavoriteStorePickerProps = Readonly<{
  selectedStoreSlugs?: string[];
  onChange?: (storeSlugs: string[]) => void;
}>;

const priorityBrands = new Set(['Willys', 'Hemköp', 'ICA', 'Coop', 'Lidl', 'City Gross']);
const storeOptions = osmStores
  .filter((store) => priorityBrands.has(store.brand))
  .slice(0, 18)
  .map((store) => ({
    slug: store.slug,
    label: store.name,
    brand: store.brand,
    detail: [store.city, store.address || store.district, store.format].filter(Boolean).join(' · '),
  }));

function uniqueSlugs(slugs: readonly string[]) {
  return [...new Set(slugs)].filter((slug) => storeOptions.some((store) => store.slug === slug));
}

function readPersistedStores() {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(FAVORITE_STORE_PICKER_STORAGE_KEY) ?? '[]') as string[];
    return Array.isArray(parsed) ? uniqueSlugs(parsed) : [];
  } catch {
    return [];
  }
}

function persistStores(slugs: string[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(FAVORITE_STORE_PICKER_STORAGE_KEY, JSON.stringify(slugs));
}

export function FavoriteStorePicker({ selectedStoreSlugs = [], onChange }: FavoriteStorePickerProps) {
  const [selected, setSelected] = useState(() => uniqueSlugs(selectedStoreSlugs));
  const selectedStores = useMemo(() => storeOptions.filter((store) => selected.includes(store.slug)), [selected]);

  useEffect(() => {
    const persisted = readPersistedStores();
    if (persisted.length === 0) return;
    setSelected(persisted);
    onChange?.(persisted);
  }, []);

  function commit(nextSelected: string[]) {
    const next = uniqueSlugs(nextSelected);
    setSelected(next);
    persistStores(next);
    onChange?.(next);
  }

  function toggleStore(slug: string) {
    commit(selected.includes(slug) ? selected.filter((storeSlug) => storeSlug !== slug) : [...selected, slug]);
  }

  return (
    <section className="rounded-2xl border border-emerald-200 bg-white p-4" aria-label="Favorite store picker">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-black text-slate-950">Favorite stores</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
            Multi-select nearby stores from the OSM store locator data. Choices persist in this browser and sync into MyFlyer preferences on save.
          </p>
        </div>
        <p className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-950">{selected.length} selected</p>
      </div>
      <div className="mt-3 grid max-h-80 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
        {storeOptions.map((store) => {
          const active = selected.includes(store.slug);
          return (
            <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 ${active ? 'border-emerald-700 bg-emerald-50' : 'border-slate-200 bg-white'}`} key={store.slug}>
              <input checked={active} className="mt-1 h-4 w-4 accent-emerald-700" onChange={() => toggleStore(store.slug)} type="checkbox" />
              <span>
                <span className="block font-black text-slate-950">{store.label}</span>
                <span className="mt-1 block text-xs font-bold uppercase tracking-[0.12em] text-emerald-800">{store.brand}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-600">{store.detail}</span>
              </span>
            </label>
          );
        })}
      </div>
      <p className="mt-3 text-xs font-bold leading-5 text-slate-600">
        Selected: {selectedStores.map((store) => store.label).join(', ') || 'No favorite stores yet.'}
      </p>
    </section>
  );
}
