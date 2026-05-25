'use client';

import { useEffect, useMemo, useState } from 'react';

export const USER_PREFERENCES_STORAGE_KEY = 'groceryview:user_preferences';

export const ALGORITHM_OPTIONS = [
  {
    value: 'balanced',
    label: 'Balanced',
    description: 'Blend savings, favorite-store boosts, and watchlist matches.'
  },
  {
    value: 'watchlist_first',
    label: 'Watchlist first',
    description: 'Prioritize products and categories the shopper already follows.'
  },
  {
    value: 'best_savings',
    label: 'Best savings',
    description: 'Rank by the strongest krona savings in this week\'s flyer rows.'
  },
  {
    value: 'best_unit_price',
    label: 'Unit price',
    description: 'Prefer the lowest comparable unit price when package sizes differ.'
  }
] as const;

export type AlgorithmChoice = (typeof ALGORITHM_OPTIONS)[number]['value'];

export type UserPreferencesRecord = {
  algorithm_choice: AlgorithmChoice;
  updated_at: string;
  [key: string]: unknown;
};

type PersistAlgorithmChoiceOptions = Readonly<{
  storage?: Storage | null;
  storageKey?: string;
  endpoint?: string;
  fetcher?: typeof fetch;
}>;

type AlgorithmPickerProps = Readonly<{
  allowedAlgorithms?: readonly AlgorithmChoice[];
  selected?: AlgorithmChoice;
  defaultSelected?: AlgorithmChoice;
  onChange?: (selected: AlgorithmChoice) => void;
  storageKey?: string;
  preferencesEndpoint?: string;
  className?: string;
}>;

const algorithmValues = new Set<string>(ALGORITHM_OPTIONS.map((option) => option.value));

function browserStorage() {
  if (typeof window === 'undefined') return null;

  return window.localStorage;
}

function isAlgorithmChoice(value: string): value is AlgorithmChoice {
  return algorithmValues.has(value);
}

function safeParsePreferences(rawValue: string | null): Partial<UserPreferencesRecord> {
  if (!rawValue) return {};

  try {
    const parsedValue: unknown = JSON.parse(rawValue);
    if (!parsedValue || typeof parsedValue !== 'object' || Array.isArray(parsedValue)) return {};

    return parsedValue as Partial<UserPreferencesRecord>;
  } catch {
    return {};
  }
}

function normalizeAllowedAlgorithmChoice(value: string | null | undefined, allowedAlgorithms?: readonly AlgorithmChoice[]) {
  const normalized = normalizeAlgorithmChoice(value);
  if (!allowedAlgorithms || allowedAlgorithms.length === 0 || allowedAlgorithms.includes(normalized)) return normalized;

  return allowedAlgorithms[0];
}

export function normalizeAlgorithmChoice(value: string | null | undefined): AlgorithmChoice {
  return value && isAlgorithmChoice(value) ? value : 'balanced';
}

export function readStoredAlgorithmChoice(
  storage: Storage | null = browserStorage(),
  storageKey = USER_PREFERENCES_STORAGE_KEY
) {
  if (!storage) return 'balanced';

  const preferences = safeParsePreferences(storage.getItem(storageKey));

  return normalizeAlgorithmChoice(
    typeof preferences.algorithm_choice === 'string' ? preferences.algorithm_choice : undefined
  );
}

export function writeStoredAlgorithmChoice(
  selected: AlgorithmChoice,
  storage: Storage | null = browserStorage(),
  storageKey = USER_PREFERENCES_STORAGE_KEY
) {
  if (!storage) return false;

  const normalizedSelected = normalizeAlgorithmChoice(selected);
  const nextPreferences: UserPreferencesRecord = {
    ...safeParsePreferences(storage.getItem(storageKey)),
    algorithm_choice: normalizedSelected,
    updated_at: new Date().toISOString()
  };

  storage.setItem(storageKey, JSON.stringify(nextPreferences));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('groceryview:user-preferences-changed', {
        detail: {
          algorithm_choice: normalizedSelected,
          storageKey
        }
      })
    );
  }

  return true;
}

export async function persistAlgorithmChoiceToUserPreferences(
  selected: AlgorithmChoice,
  {
    storage = browserStorage(),
    storageKey = USER_PREFERENCES_STORAGE_KEY,
    endpoint,
    fetcher = globalThis.fetch
  }: PersistAlgorithmChoiceOptions = {}
) {
  const algorithmChoice = normalizeAlgorithmChoice(selected);
  const stored = writeStoredAlgorithmChoice(algorithmChoice, storage, storageKey);

  if (!endpoint || !fetcher) {
    return { stored, synced: false };
  }

  try {
    const response = await fetcher(endpoint, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ algorithm_choice: algorithmChoice })
    });

    return { stored, synced: response.ok };
  } catch {
    return { stored, synced: false };
  }
}

export function AlgorithmPicker({
  allowedAlgorithms,
  selected,
  defaultSelected = 'balanced',
  onChange,
  storageKey = USER_PREFERENCES_STORAGE_KEY,
  preferencesEndpoint,
  className = ''
}: AlgorithmPickerProps) {
  const isControlled = selected !== undefined;
  const [internalSelected, setInternalSelected] = useState<AlgorithmChoice>(() =>
    normalizeAllowedAlgorithmChoice(selected ?? defaultSelected, allowedAlgorithms)
  );
  const [hasLoadedStoredSelection, setHasLoadedStoredSelection] = useState(isControlled);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'local'>('idle');
  const visibleOptions = useMemo(() => (
    allowedAlgorithms && allowedAlgorithms.length > 0
      ? ALGORITHM_OPTIONS.filter((option) => allowedAlgorithms.includes(option.value))
      : ALGORITHM_OPTIONS
  ), [allowedAlgorithms]);
  const currentSelected = useMemo(
    () => normalizeAllowedAlgorithmChoice(isControlled ? selected : internalSelected, allowedAlgorithms),
    [allowedAlgorithms, internalSelected, isControlled, selected]
  );

  useEffect(() => {
    if (isControlled) {
      setHasLoadedStoredSelection(true);
      return;
    }

    setInternalSelected(normalizeAllowedAlgorithmChoice(readStoredAlgorithmChoice(undefined, storageKey), allowedAlgorithms));
    setHasLoadedStoredSelection(true);
  }, [allowedAlgorithms, defaultSelected, isControlled, storageKey]);

  useEffect(() => {
    if (!hasLoadedStoredSelection) return;

    let active = true;
    setSaveState('saving');

    void persistAlgorithmChoiceToUserPreferences(currentSelected, {
      storageKey,
      endpoint: preferencesEndpoint
    }).then((result) => {
      if (!active) return;
      setSaveState(result.synced ? 'saved' : 'local');
    });

    return () => {
      active = false;
    };
  }, [currentSelected, hasLoadedStoredSelection, preferencesEndpoint, storageKey]);

  function selectAlgorithm(nextSelected: AlgorithmChoice) {
    const normalizedSelected = normalizeAllowedAlgorithmChoice(nextSelected, allowedAlgorithms);

    if (!isControlled) {
      setInternalSelected(normalizedSelected);
    }

    onChange?.(normalizedSelected);
  }

  const statusText = {
    idle: '',
    saving: 'Saving ranker preference',
    saved: 'Ranker saved to user preferences',
    local: 'Ranker saved locally'
  }[saveState];

  return (
    <section className={`rounded-3xl border border-orange-100 bg-white p-4 shadow-sm ${className}`} aria-labelledby="algorithm-picker-heading">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p id="algorithm-picker-heading" className="text-sm font-black uppercase tracking-[0.18em] text-orange-800">
            Ranker
          </p>
          <p className="mt-1 text-sm text-slate-600">Choose how MyFlyer orders this week&apos;s offers.</p>
        </div>
        <p className="min-h-5 text-sm font-bold text-slate-500" role="status" aria-live="polite">
          {statusText}
        </p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="MyFlyer ranker">
        {visibleOptions.map((option) => {
          const active = currentSelected === option.value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => selectAlgorithm(option.value)}
              className={`rounded-2xl border p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-700 ${
                active
                  ? 'border-orange-800 bg-orange-800 text-white shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-950'
              }`}
            >
              <span className="block text-sm font-black">{option.label}</span>
              <span className={`mt-1 block text-xs font-semibold ${active ? 'text-orange-50' : 'text-slate-500'}`}>
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
