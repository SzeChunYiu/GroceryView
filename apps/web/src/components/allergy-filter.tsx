'use client';

import { useEffect, useState } from 'react';
import { normalizeAllergenFilters, supportedAllergenFilters, type AllergenFilter } from '@groceryview/core';

export const ALLERGY_FILTER_STORAGE_KEY = 'groceryview:allergy-filter:v1';
export const ALLERGY_FILTER_EVENT = 'groceryview:allergy-filter-changed';

const labels: Record<AllergenFilter, string> = {
  gluten: 'Gluten',
  lactose: 'Lactose',
  peanut: 'Peanut',
  soy: 'Soy',
  sesame: 'Sesame',
  egg: 'Egg',
  fish: 'Fish',
  shellfish: 'Shellfish',
  milk: 'Milk',
  sulfites: 'Sulfites'
};

function readStoredFilters(): AllergenFilter[] {
  try {
    return normalizeAllergenFilters(JSON.parse(localStorage.getItem(ALLERGY_FILTER_STORAGE_KEY) ?? '[]'));
  } catch {
    return [];
  }
}

export function AllergyFilter() {
  const [excluded, setExcluded] = useState<AllergenFilter[]>([]);

  useEffect(() => {
    setExcluded(readStoredFilters());
  }, []);

  function update(next: AllergenFilter[]) {
    setExcluded(next);
    localStorage.setItem(ALLERGY_FILTER_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(ALLERGY_FILTER_EVENT, { detail: { excluded: next } }));
  }

  function toggle(filter: AllergenFilter) {
    update(excluded.includes(filter) ? excluded.filter((value) => value !== filter) : [...excluded, filter]);
  }

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4" aria-label="Allergy-aware product filters">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Allergy-aware filter</p>
          <p className="mt-1 text-sm font-semibold text-emerald-950">Persist exclusions across browse views using OpenFoodFacts allergen tags.</p>
        </div>
        {excluded.length > 0 ? (
          <button className="rounded-full bg-white px-3 py-2 text-xs font-black text-emerald-900" onClick={() => update([])} type="button">Clear</button>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {supportedAllergenFilters.map((filter) => (
          <button
            aria-pressed={excluded.includes(filter)}
            className={`rounded-full px-3 py-2 text-xs font-black ${excluded.includes(filter) ? 'bg-emerald-900 text-white' : 'bg-white text-emerald-900'}`}
            key={filter}
            onClick={() => toggle(filter)}
            type="button"
          >
            Exclude {labels[filter]}
          </button>
        ))}
      </div>
    </section>
  );
}
