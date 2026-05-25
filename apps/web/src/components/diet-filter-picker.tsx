'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  DIETARY_PROFILE_STORAGE_KEY,
  loadDietaryProfilePreferences,
  saveDietaryProfilePreferences,
  type DietaryProfilePreferences
} from '@/lib/user-preferences';

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

const ALLERGY_OPTIONS = ['Milk', 'Eggs', 'Peanuts', 'Tree nuts', 'Gluten', 'Soy'] as const;
const NUTRITION_PRIORITY_OPTIONS = [
  { value: 'lower-sugar', label: 'Lower sugar' },
  { value: 'higher-protein', label: 'Higher protein' },
  { value: 'high-fiber', label: 'High fiber' },
  { value: 'lower-salt', label: 'Lower salt' }
] as const;

function parseAvoidedIngredients(value: string) {
  return value.split(',').map((ingredient) => ingredient.trim()).filter(Boolean);
}

function toCsv(values: readonly string[]) {
  return values.join(', ');
}

export function DietaryProfileOnboarding({ className = '' }: Readonly<{ className?: string }>) {
  const [profile, setProfile] = useState<DietaryProfilePreferences>(() => loadDietaryProfilePreferences());
  const [avoidedInput, setAvoidedInput] = useState('');
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    const storedProfile = loadDietaryProfilePreferences();
    setProfile(storedProfile);
    setAvoidedInput(toCsv(storedProfile.avoidedIngredients));
  }, []);

  function setProfileList(key: 'allergies' | 'diets' | 'nutritionPriorities', value: string) {
    setProfile((currentProfile) => {
      const currentValues = currentProfile[key];
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((currentValue) => currentValue !== value)
        : [...currentValues, value];

      return { ...currentProfile, [key]: nextValues };
    });
  }

  function saveProfile() {
    const nextProfile = {
      ...profile,
      avoidedIngredients: parseAvoidedIngredients(avoidedInput),
      onboardingCompleted: true
    };

    saveDietaryProfilePreferences(nextProfile);
    setProfile(loadDietaryProfilePreferences());
    setSavedMessage('Dietary profile saved for onboarding and settings personalization.');
  }

  return (
    <section className={`rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm ${className}`} aria-labelledby="dietary-profile-heading">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p id="dietary-profile-heading" className="text-sm font-black uppercase tracking-[0.18em] text-emerald-800">
            Dietary profile onboarding
          </p>
          <p className="mt-1 text-sm text-slate-600">Save allergies, diets, and avoided ingredients for account setup and settings edits.</p>
        </div>
        <p className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-emerald-800">
          {profile.onboardingCompleted ? 'Saved profile' : 'Setup step'}
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Allergies</p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Allergy preferences">
            {ALLERGY_OPTIONS.map((allergy) => {
              const active = profile.allergies.includes(allergy);
              return (
                <button
                  aria-pressed={active}
                  className={`rounded-full border px-3 py-2 text-sm font-black ${active ? 'border-rose-700 bg-rose-700 text-white' : 'border-slate-200 bg-slate-50 text-slate-700'}`}
                  key={allergy}
                  onClick={() => setProfileList('allergies', allergy)}
                  type="button"
                >
                  {allergy}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Diets</p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Diet preferences">
            {DIET_FILTER_OPTIONS.filter((option) => option.value !== 'organic').map((option) => {
              const active = profile.diets.includes(option.value);
              return (
                <button
                  aria-pressed={active}
                  className={`rounded-full border px-3 py-2 text-sm font-black ${active ? 'border-emerald-800 bg-emerald-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-700'}`}
                  key={option.value}
                  onClick={() => setProfileList('diets', option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <label className="block text-sm font-black text-slate-700" htmlFor="household-size">
          Household size
          <input
            className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
            id="household-size"
            max={12}
            min={1}
            onChange={(event) => setProfile((currentProfile) => ({ ...currentProfile, householdSize: Number(event.target.value) }))}
            type="number"
            value={profile.householdSize}
          />
        </label>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Default nutrition priorities</p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Default nutrition priorities">
            {NUTRITION_PRIORITY_OPTIONS.map((option) => {
              const active = profile.nutritionPriorities.includes(option.value);
              return (
                <button
                  aria-pressed={active}
                  className={`rounded-full border px-3 py-2 text-sm font-black ${active ? 'border-sky-800 bg-sky-800 text-white' : 'border-slate-200 bg-slate-50 text-slate-700'}`}
                  key={option.value}
                  onClick={() => setProfileList('nutritionPriorities', option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <label className="mt-4 block text-sm font-black text-slate-700" htmlFor="avoided-ingredients">
        Avoided ingredients
      </label>
      <input
        className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm"
        id="avoided-ingredients"
        onChange={(event) => setAvoidedInput(event.target.value)}
        placeholder="e.g. palm oil, aspartame, coriander"
        value={avoidedInput}
      />

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold text-slate-500">Stored under {DIETARY_PROFILE_STORAGE_KEY} for durable personalization.</p>
        <button className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-black text-white" onClick={saveProfile} type="button">
          Save dietary profile
        </button>
      </div>
      {savedMessage ? <p className="mt-3 text-sm font-bold text-emerald-800" role="status">{savedMessage}</p> : null}
    </section>
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
    <section className={`rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm ${className}`} aria-labelledby="diet-filter-picker-heading" data-diet-filter-storage-key={storageKey}>
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
              data-diet-filter-option={option.value}
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
