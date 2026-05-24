'use client';

import { useEffect, useMemo, useState } from 'react';

export type DietFilterId = 'organic' | 'vegetarian' | 'vegan' | 'gluten-free' | 'lactose-free';

export type DietFilterOption = {
  id: DietFilterId;
  label: string;
  rankerTag: 'organic' | 'vegetarian' | 'vegan' | 'gluten_free' | 'lactose_free';
  description: string;
};

export const dietFilterOptions: readonly DietFilterOption[] = [
  {
    id: 'organic',
    label: 'Organic',
    rankerTag: 'organic',
    description: 'Prefer offers with verified organic or eco label evidence.'
  },
  {
    id: 'vegetarian',
    label: 'Vegetarian',
    rankerTag: 'vegetarian',
    description: 'Keep rankers inside vegetarian-compatible product evidence.'
  },
  {
    id: 'vegan',
    label: 'Vegan',
    rankerTag: 'vegan',
    description: 'Require vegan evidence before a flyer item can match this filter.'
  },
  {
    id: 'gluten-free',
    label: 'Gluten-free',
    rankerTag: 'gluten_free',
    description: 'Require gluten-free label or metadata evidence; no inference from category alone.'
  },
  {
    id: 'lactose-free',
    label: 'Lactose-free',
    rankerTag: 'lactose_free',
    description: 'Require lactose-free label or metadata evidence before ranking dairy substitutes.'
  }
] as const;

export type UserPreferencesDietFilterState = {
  dietaryFilters: DietFilterId[];
  rankerDietTags: DietFilterOption['rankerTag'][];
  updatedAt: string;
};

const userPreferencesStorageKey = 'groceryview:user_preferences';
const userPreferencesEventName = 'groceryview:user_preferences:diet-filters-changed';

function normalizeDietFilters(value: unknown): DietFilterId[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set<DietFilterId>(dietFilterOptions.map((option) => option.id));
  return [...new Set(value.filter((item): item is DietFilterId => typeof item === 'string' && allowed.has(item as DietFilterId)))];
}

function readPersistedDietFilters(): DietFilterId[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(userPreferencesStorageKey) ?? '{}') as { dietaryFilters?: unknown };
    return normalizeDietFilters(parsed.dietaryFilters);
  } catch {
    return [];
  }
}

function rankerTagsFor(filters: readonly DietFilterId[]): DietFilterOption['rankerTag'][] {
  const selected = new Set(filters);
  return dietFilterOptions.filter((option) => selected.has(option.id)).map((option) => option.rankerTag);
}

function persistDietFilters(filters: DietFilterId[]): UserPreferencesDietFilterState {
  const state: UserPreferencesDietFilterState = {
    dietaryFilters: filters,
    rankerDietTags: rankerTagsFor(filters),
    updatedAt: new Date().toISOString()
  };

  if (typeof window !== 'undefined') {
    const existing = (() => {
      try {
        return JSON.parse(window.localStorage.getItem(userPreferencesStorageKey) ?? '{}') as Record<string, unknown>;
      } catch {
        return {};
      }
    })();
    window.localStorage.setItem(userPreferencesStorageKey, JSON.stringify({ ...existing, ...state }));
    window.dispatchEvent(new CustomEvent(userPreferencesEventName, { detail: state }));
  }

  return state;
}

export type DietFilterPickerProps = {
  initialFilters?: DietFilterId[];
  onChange?: (state: UserPreferencesDietFilterState) => void;
};

export function DietFilterPicker({ initialFilters = [], onChange }: DietFilterPickerProps) {
  const [selectedFilters, setSelectedFilters] = useState<DietFilterId[]>(() => normalizeDietFilters(initialFilters));

  useEffect(() => {
    const persisted = readPersistedDietFilters();
    if (persisted.length > 0) setSelectedFilters(persisted);
  }, []);

  const selectedRankerTags = useMemo(() => rankerTagsFor(selectedFilters), [selectedFilters]);

  function toggleFilter(filterId: DietFilterId) {
    setSelectedFilters((current) => {
      const next = current.includes(filterId)
        ? current.filter((candidate) => candidate !== filterId)
        : [...current, filterId];
      const state = persistDietFilters(next);
      onChange?.(state);
      return next;
    });
  }

  return (
    <section className="rounded-3xl border border-emerald-200 bg-white/95 p-4 shadow-sm" aria-label="Diet filter picker">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">MyFlyer diet filters</p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">Tune flyer rankers to verified dietary evidence</h2>
        </div>
        <p className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">
          {selectedFilters.length} active
        </p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {dietFilterOptions.map((option) => {
          const checked = selectedFilters.includes(option.id);
          return (
            <label
              className={`flex cursor-pointer gap-3 rounded-2xl border p-3 transition ${checked ? 'border-emerald-700 bg-emerald-50 text-emerald-950' : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'}`}
              key={option.id}
            >
              <input
                checked={checked}
                className="mt-1 h-4 w-4 accent-emerald-700"
                name="user_preferences[dietaryFilters]"
                onChange={() => toggleFilter(option.id)}
                type="checkbox"
                value={option.id}
              />
              <span>
                <span className="block text-sm font-black">{option.label}</span>
                <span className="mt-1 block text-xs font-semibold leading-5">{option.description}</span>
                <span className="mt-2 inline-flex rounded-full bg-white/80 px-2 py-1 text-[11px] font-black text-slate-600">
                  ranker tag: {option.rankerTag}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      <input name="user_preferences[rankerDietTags]" readOnly type="hidden" value={selectedRankerTags.join(',')} />
      <p className="mt-3 text-xs font-semibold leading-5 text-slate-600">
        Choices persist to <code className="rounded bg-slate-100 px-1 py-0.5">user_preferences</code> in browser storage and emit a
        <code className="rounded bg-slate-100 px-1 py-0.5"> {userPreferencesEventName}</code> event so MyFlyer rankers can fail closed when required dietary evidence is missing.
      </p>
    </section>
  );
}
