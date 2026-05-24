'use client';

import { useEffect, useMemo, useState } from 'react';

export type FlyerAlgorithmChoice = 'absolute-savings' | 'percent-off' | 'unit-price-beaters' | 'organic' | 'payday-essentials' | 'premium-brand';

export type AlgorithmPickerOption = {
  readonly id: FlyerAlgorithmChoice;
  readonly label: string;
  readonly eyebrow: string;
  readonly description: string;
  readonly bestFor: string;
};

export type AlgorithmPickerProps = {
  readonly initialChoice?: FlyerAlgorithmChoice;
  readonly storageKey?: string;
  readonly userPreferencesKey?: string;
  readonly onPreferenceChange?: (choice: FlyerAlgorithmChoice) => void;
};

export const flyerAlgorithmOptions: readonly AlgorithmPickerOption[] = [
  {
    id: 'absolute-savings',
    label: 'Biggest kronor saved',
    eyebrow: 'Basket-first',
    description: 'Ranks promotions by total SEK saved after eligible quantity rules, so family staples rise above tiny discounts.',
    bestFor: 'Weekly stock-up shops',
  },
  {
    id: 'percent-off',
    label: 'Highest % off',
    eyebrow: 'Deal hunter',
    description: 'Sorts by relative markdown depth for shoppers who want the loudest price cuts first.',
    bestFor: 'Browsing quick wins',
  },
  {
    id: 'unit-price-beaters',
    label: 'Unit-price beaters',
    eyebrow: 'Anti-shrinkflation',
    description: 'Only surfaces offers where effective kr/kg or kr/l beats the recent comparable median.',
    bestFor: 'Avoiding fake deals',
  },
  {
    id: 'organic',
    label: 'Organic / eco only',
    eyebrow: 'Values filter',
    description: 'Filters to organic, KRAV, eco, or equivalent labels before applying the savings rank.',
    bestFor: 'Diet and sourcing goals',
  },
  {
    id: 'payday-essentials',
    label: 'Payday essentials',
    eyebrow: '25th boost',
    description: 'Around Swedish payday, gives extra weight to dairy, bread, meat, produce, and other household essentials.',
    bestFor: 'End-of-month planning',
  },
  {
    id: 'premium-brand',
    label: 'Premium brands',
    eyebrow: 'Treat shelf',
    description: 'Limits results to premium brand sets and ranks by verified savings, not sponsorship.',
    bestFor: 'Upgrading when on sale',
  },
];

const defaultStorageKey = 'groceryview:my-flyer:algorithm-choice';
const defaultUserPreferencesKey = 'groceryview:user_preferences';

function isFlyerAlgorithmChoice(value: string | null): value is FlyerAlgorithmChoice {
  return flyerAlgorithmOptions.some((option) => option.id === value);
}

function readStoredChoice(storageKey: string, userPreferencesKey: string): FlyerAlgorithmChoice | null {
  if (typeof window === 'undefined') return null;

  const directChoice = window.localStorage.getItem(storageKey);
  if (isFlyerAlgorithmChoice(directChoice)) return directChoice;

  const preferences = window.localStorage.getItem(userPreferencesKey);
  if (!preferences) return null;

  try {
    const parsed = JSON.parse(preferences) as { algorithm_choice?: unknown; algorithmChoice?: unknown };
    const candidate = typeof parsed.algorithm_choice === 'string' ? parsed.algorithm_choice : typeof parsed.algorithmChoice === 'string' ? parsed.algorithmChoice : null;
    return isFlyerAlgorithmChoice(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

function persistChoice(choice: FlyerAlgorithmChoice, storageKey: string, userPreferencesKey: string) {
  window.localStorage.setItem(storageKey, choice);

  const existing = window.localStorage.getItem(userPreferencesKey);
  let nextPreferences: Record<string, unknown> = {};
  if (existing) {
    try {
      const parsed = JSON.parse(existing) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) nextPreferences = { ...parsed as Record<string, unknown> };
    } catch {
      nextPreferences = {};
    }
  }

  nextPreferences.algorithm_choice = choice;
  nextPreferences.updated_at = new Date().toISOString();
  window.localStorage.setItem(userPreferencesKey, JSON.stringify(nextPreferences));
  document.cookie = `groceryview_my_flyer_algorithm=${choice};path=/;max-age=31536000;samesite=lax`;
  window.dispatchEvent(new CustomEvent('groceryview:algorithm-choice-changed', { detail: { algorithmChoice: choice } }));
}

export function AlgorithmPicker({
  initialChoice = 'absolute-savings',
  storageKey = defaultStorageKey,
  userPreferencesKey = defaultUserPreferencesKey,
  onPreferenceChange,
}: Readonly<AlgorithmPickerProps>) {
  const [selectedChoice, setSelectedChoice] = useState<FlyerAlgorithmChoice>(initialChoice);
  const selectedOption = useMemo(
    () => flyerAlgorithmOptions.find((option) => option.id === selectedChoice) ?? flyerAlgorithmOptions[0],
    [selectedChoice]
  );

  useEffect(() => {
    const storedChoice = readStoredChoice(storageKey, userPreferencesKey);
    if (storedChoice) setSelectedChoice(storedChoice);
  }, [storageKey, userPreferencesKey]);

  function chooseAlgorithm(choice: FlyerAlgorithmChoice) {
    setSelectedChoice(choice);
    persistChoice(choice, storageKey, userPreferencesKey);
    onPreferenceChange?.(choice);
  }

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-emerald-200 bg-[#fbf7ed] p-5 shadow-sm" aria-label="My Flyer algorithm picker">
      <div className="pointer-events-none absolute -right-12 -top-16 h-36 w-36 rounded-full bg-lime-300/40 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 left-8 h-44 w-44 rounded-full bg-emerald-300/30 blur-3xl" />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-900">My Flyer ranking</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Pick the deal logic before the flyer is built</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
            The selected algorithm is written into the shopper&apos;s <code className="rounded bg-white/80 px-1 py-0.5 text-emerald-900">user_preferences.algorithm_choice</code> draft state so the API can rank this week&apos;s flyer consistently.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-300 bg-white/85 px-4 py-3 text-right shadow-sm">
          <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-emerald-800">Selected</p>
          <p className="mt-1 text-lg font-black text-slate-950">{selectedOption.label}</p>
          <p className="text-xs font-bold text-slate-500">{selectedOption.bestFor}</p>
        </div>
      </div>

      <div className="relative mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3" role="radiogroup" aria-label="Flyer ranking algorithm">
        {flyerAlgorithmOptions.map((option) => {
          const selected = option.id === selectedChoice;
          return (
            <button
              aria-checked={selected}
              className={`group rounded-3xl border p-4 text-left transition focus:outline-none focus:ring-4 focus:ring-emerald-200 ${selected ? 'border-emerald-900 bg-emerald-950 text-white shadow-lg shadow-emerald-950/15' : 'border-emerald-200 bg-white/80 text-slate-950 hover:-translate-y-0.5 hover:border-emerald-500 hover:shadow-md'}`}
              key={option.id}
              onClick={() => chooseAlgorithm(option.id)}
              role="radio"
              type="button"
            >
              <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.18em] ${selected ? 'bg-lime-300 text-emerald-950' : 'bg-emerald-100 text-emerald-900'}`}>
                {option.eyebrow}
              </span>
              <span className="mt-3 block text-xl font-black tracking-tight">{option.label}</span>
              <span className={`mt-2 block text-sm font-semibold leading-6 ${selected ? 'text-emerald-50' : 'text-slate-600'}`}>
                {option.description}
              </span>
              <span className={`mt-4 block rounded-2xl px-3 py-2 text-xs font-black ${selected ? 'bg-white/10 text-lime-100' : 'bg-slate-100 text-slate-700 group-hover:bg-emerald-50'}`}>
                Best for: {option.bestFor}
              </span>
            </button>
          );
        })}
      </div>

      <p className="sr-only">Current flyer algorithm choice: {selectedOption.id}.</p>
    </section>
  );
}

export default AlgorithmPicker;
