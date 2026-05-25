'use client';

import { useEffect, useMemo, useState } from 'react';

export const DIET_FILTER_STORAGE_KEY = 'groceryview:my-flyer:diet-filters';

export const DIET_FILTER_OPTIONS = [
  { value: 'organic', label: 'Organic' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten-free', label: 'Gluten-free' },
  { value: 'lactose-free', label: 'Lactose-free' }
] as const;

export type DietFilterValue = (typeof DIET_FILTER_OPTIONS)[number]['value'];

type DietFilterPickerProps = Readonly<{
  selected?: readonly DietFilterValue[];
  onChange?: (selected: DietFilterValue[]) => void;
  storageKey?: string;
  className?: string;
}>;

const optionValues = new Set<string>(DIET_FILTER_OPTIONS.map((option) => option.value));

function isDietFilterValue(value: string): value is DietFilterValue {
  return optionValues.has(value);
}

export function normalizeDietFilters(values: readonly string[] | null | undefined): DietFilterValue[] {
  if (!values) {
    return [];
  }

  const requested = new Set(values.filter(isDietFilterValue));
  return DIET_FILTER_OPTIONS.filter((option) => requested.has(option.value)).map((option) => option.value);
}

export function readStoredDietFilters(storageKey = DIET_FILTER_STORAGE_KEY): DietFilterValue[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) {
      return [];
    }

    const parsedValue: unknown = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return normalizeDietFilters(parsedValue.filter((value): value is string => typeof value === 'string'));
  } catch {
    return [];
  }
}

export function writeStoredDietFilters(selected: readonly DietFilterValue[], storageKey = DIET_FILTER_STORAGE_KEY) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(normalizeDietFilters(selected)));
  window.dispatchEvent(
    new CustomEvent('groceryview:diet-filters-changed', {
      detail: { selected: normalizeDietFilters(selected), storageKey }
    })
  );
}

export function DietFilterPicker({
  selected,
  onChange,
  storageKey = DIET_FILTER_STORAGE_KEY,
  className = ''
}: DietFilterPickerProps) {
  const isControlled = selected !== undefined;
  const [internalSelected, setInternalSelected] = useState<DietFilterValue[]>(() =>
    isControlled ? normalizeDietFilters(selected) : []
  );
  const [hasLoadedStoredSelection, setHasLoadedStoredSelection] = useState(isControlled);
  const currentSelected = useMemo(
    () => (isControlled ? normalizeDietFilters(selected) : internalSelected),
    [internalSelected, isControlled, selected]
  );

  useEffect(() => {
    if (isControlled) {
      setHasLoadedStoredSelection(true);
      return;
    }

    setInternalSelected(readStoredDietFilters(storageKey));
    setHasLoadedStoredSelection(true);
  }, [isControlled, storageKey]);

  useEffect(() => {
    if (!hasLoadedStoredSelection) {
      return;
    }

    writeStoredDietFilters(currentSelected, storageKey);
  }, [currentSelected, hasLoadedStoredSelection, storageKey]);

  function setSelected(nextSelected: DietFilterValue[]) {
    const normalizedSelected = normalizeDietFilters(nextSelected);

    if (!isControlled) {
      setInternalSelected(normalizedSelected);
    }

    onChange?.(normalizedSelected);
  }

  function toggleOption(option: DietFilterValue) {
    const nextSelected = currentSelected.includes(option)
      ? currentSelected.filter((selectedOption) => selectedOption !== option)
      : [...currentSelected, option];

    setSelected(nextSelected);
  }

  function clearSelected() {
    setSelected([]);
  }

  return (
    <section className={`rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm ${className}`} aria-labelledby="diet-filter-picker-heading">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p id="diet-filter-picker-heading" className="text-sm font-black uppercase tracking-[0.18em] text-emerald-800">
            Diet filters
          </p>
          <p className="mt-1 text-sm text-slate-600">Save MyFlyer diet preferences for ranking and offer filtering.</p>
        </div>
        {currentSelected.length > 0 ? (
          <button className="text-sm font-bold text-emerald-800 underline decoration-emerald-300 underline-offset-4" type="button" onClick={clearSelected}>
            Clear {currentSelected.length}
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="MyFlyer diet filters">
        {DIET_FILTER_OPTIONS.map((option) => {
          const active = currentSelected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => toggleOption(option.value)}
              className={`rounded-full border px-3 py-2 text-sm font-black transition ${
                active
                  ? 'border-emerald-800 bg-emerald-800 text-white shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-950'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
