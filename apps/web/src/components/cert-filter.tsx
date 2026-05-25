'use client';

import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'groceryview:cert-filter:selected';
export const SAFETY_PREFERENCES_STORAGE_KEY = 'groceryview:safety-preferences';
export const SAFETY_PREFERENCES_CHANGED_EVENT = 'groceryview:safety-preferences-changed';

export const CERTIFICATION_FILTER_OPTIONS = [
  'KRAV',
  'EU-Eko',
  'Fairtrade',
  'MSC',
  'ASC',
  'Rainforest Alliance',
  'Free-range',
  'antibiotic-free'
] as const;

export type CertificationFilterOption = (typeof CERTIFICATION_FILTER_OPTIONS)[number];
export type SafetyDietaryPreference = 'vegan' | 'vegetarian' | 'glutenfree' | 'laktosfree';
export type SafetyAllergenPreference = 'milk' | 'gluten' | 'nuts' | 'eggs' | 'soy' | 'sesame';
export type SafetyNutritionPriority = 'lower-sugar' | 'higher-protein' | 'high-fiber' | 'lower-salt';

export type ProductSafetyPreferences = {
  requiredDietaryTags: SafetyDietaryPreference[];
  avoidedAllergenTags: SafetyAllergenPreference[];
  nutritionPriorityTags: SafetyNutritionPriority[];
};

const SAFETY_DIETARY_OPTIONS: Array<{ value: SafetyDietaryPreference; label: string }> = [
  { value: 'vegan', label: 'Vegan' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'glutenfree', label: 'Gluten-free' },
  { value: 'laktosfree', label: 'Lactose-free' }
];

const SAFETY_ALLERGEN_OPTIONS: Array<{ value: SafetyAllergenPreference; label: string }> = [
  { value: 'milk', label: 'Milk' },
  { value: 'gluten', label: 'Gluten' },
  { value: 'nuts', label: 'Nuts' },
  { value: 'eggs', label: 'Eggs' },
  { value: 'soy', label: 'Soy' },
  { value: 'sesame', label: 'Sesame' }
];

const SAFETY_NUTRITION_OPTIONS: Array<{ value: SafetyNutritionPriority; label: string }> = [
  { value: 'lower-sugar', label: 'Lower sugar' },
  { value: 'higher-protein', label: 'Higher protein' },
  { value: 'high-fiber', label: 'High fiber' },
  { value: 'lower-salt', label: 'Lower salt' }
];

const emptySafetyPreferences: ProductSafetyPreferences = {
  requiredDietaryTags: [],
  avoidedAllergenTags: [],
  nutritionPriorityTags: []
};

type CertFilterProps = Readonly<{
  selected?: readonly CertificationFilterOption[];
  onChange?: (selected: CertificationFilterOption[]) => void;
  storageKey?: string;
  className?: string;
}>;

function isCertificationFilterOption(value: string): value is CertificationFilterOption {
  return (CERTIFICATION_FILTER_OPTIONS as readonly string[]).includes(value);
}

function normaliseSelected(values: readonly string[] | null | undefined): CertificationFilterOption[] {
  if (!values) {
    return [];
  }

  return CERTIFICATION_FILTER_OPTIONS.filter((option) => values.includes(option));
}

function normaliseSafetyPreferences(value: unknown): ProductSafetyPreferences {
  if (!value || typeof value !== 'object') {
    return emptySafetyPreferences;
  }

  const candidate = value as Partial<Record<keyof ProductSafetyPreferences, unknown>>;
  const dietaryValues = Array.isArray(candidate.requiredDietaryTags) ? candidate.requiredDietaryTags : [];
  const allergenValues = Array.isArray(candidate.avoidedAllergenTags) ? candidate.avoidedAllergenTags : [];
  const nutritionValues = Array.isArray(candidate.nutritionPriorityTags) ? candidate.nutritionPriorityTags : [];
  const dietarySet = new Set(SAFETY_DIETARY_OPTIONS.map((option) => option.value));
  const allergenSet = new Set(SAFETY_ALLERGEN_OPTIONS.map((option) => option.value));
  const nutritionSet = new Set(SAFETY_NUTRITION_OPTIONS.map((option) => option.value));

  return {
    requiredDietaryTags: dietaryValues.filter((item): item is SafetyDietaryPreference => typeof item === 'string' && dietarySet.has(item as SafetyDietaryPreference)),
    avoidedAllergenTags: allergenValues.filter((item): item is SafetyAllergenPreference => typeof item === 'string' && allergenSet.has(item as SafetyAllergenPreference)),
    nutritionPriorityTags: nutritionValues.filter((item): item is SafetyNutritionPriority => typeof item === 'string' && nutritionSet.has(item as SafetyNutritionPriority))
  };
}

function readStoredSelection(storageKey: string): CertificationFilterOption[] {
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

    return normaliseSelected(parsedValue.filter((value): value is string => typeof value === 'string'));
  } catch {
    return [];
  }
}

export function readStoredSafetyPreferences(storageKey = SAFETY_PREFERENCES_STORAGE_KEY): ProductSafetyPreferences {
  if (typeof window === 'undefined') {
    return emptySafetyPreferences;
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    return rawValue ? normaliseSafetyPreferences(JSON.parse(rawValue)) : emptySafetyPreferences;
  } catch {
    return emptySafetyPreferences;
  }
}

export function CertFilter({ selected, onChange, storageKey = STORAGE_KEY, className = '' }: CertFilterProps) {
  const isControlled = selected !== undefined;
  const [internalSelected, setInternalSelected] = useState<CertificationFilterOption[]>(() =>
    isControlled ? normaliseSelected(selected) : []
  );
  const currentSelected = useMemo(
    () => (isControlled ? normaliseSelected(selected) : internalSelected),
    [internalSelected, isControlled, selected]
  );
  const [safetyPreferences, setSafetyPreferences] = useState<ProductSafetyPreferences>(emptySafetyPreferences);

  useEffect(() => {
    if (!isControlled) {
      setInternalSelected(readStoredSelection(storageKey));
    }
    setSafetyPreferences(readStoredSafetyPreferences());
  }, [isControlled, storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(currentSelected));
  }, [currentSelected, storageKey]);

  function setSelected(nextSelected: CertificationFilterOption[]) {
    if (!isControlled) {
      setInternalSelected(nextSelected);
    }

    onChange?.(nextSelected);
  }

  function toggleOption(option: CertificationFilterOption) {
    const nextSelected = currentSelected.includes(option)
      ? currentSelected.filter((selectedOption) => selectedOption !== option)
      : [...currentSelected, option];

    setSelected(normaliseSelected(nextSelected));
  }

  function clearSelected() {
    setSelected([]);
  }

  function updateSafetyPreferences(nextPreferences: ProductSafetyPreferences) {
    setSafetyPreferences(nextPreferences);

    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(SAFETY_PREFERENCES_STORAGE_KEY, JSON.stringify(nextPreferences));
    window.dispatchEvent(new CustomEvent(SAFETY_PREFERENCES_CHANGED_EVENT, { detail: nextPreferences }));
  }

  function toggleDietaryPreference(option: SafetyDietaryPreference) {
    updateSafetyPreferences({
      ...safetyPreferences,
      requiredDietaryTags: safetyPreferences.requiredDietaryTags.includes(option)
        ? safetyPreferences.requiredDietaryTags.filter((tag) => tag !== option)
        : [...safetyPreferences.requiredDietaryTags, option]
    });
  }

  function toggleAllergenPreference(option: SafetyAllergenPreference) {
    updateSafetyPreferences({
      ...safetyPreferences,
      avoidedAllergenTags: safetyPreferences.avoidedAllergenTags.includes(option)
        ? safetyPreferences.avoidedAllergenTags.filter((tag) => tag !== option)
        : [...safetyPreferences.avoidedAllergenTags, option]
    });
  }

  function toggleNutritionPriority(option: SafetyNutritionPriority) {
    updateSafetyPreferences({
      ...safetyPreferences,
      nutritionPriorityTags: safetyPreferences.nutritionPriorityTags.includes(option)
        ? safetyPreferences.nutritionPriorityTags.filter((tag) => tag !== option)
        : [...safetyPreferences.nutritionPriorityTags, option]
    });
  }

  return (
    <section className={`rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm ${className}`} aria-labelledby="cert-filter-heading">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p id="cert-filter-heading" className="text-sm font-black uppercase tracking-[0.18em] text-emerald-800">
            Certifications
          </p>
          <p className="mt-1 text-sm text-slate-600">Filter products by one or more verified certification chips.</p>
        </div>
        {currentSelected.length > 0 ? (
          <button className="text-sm font-bold text-emerald-800 underline decoration-emerald-300 underline-offset-4" type="button" onClick={clearSelected}>
            Clear {currentSelected.length}
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Certification filters">
        {CERTIFICATION_FILTER_OPTIONS.map((option) => {
          const active = currentSelected.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => toggleOption(option)}
              className={`rounded-full border px-3 py-2 text-sm font-black transition ${
                active
                  ? 'border-emerald-800 bg-emerald-800 text-white shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-950'
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid gap-4 border-t border-slate-100 pt-4 md:grid-cols-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-800">Diet requirements</p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Dietary safety preferences">
            {SAFETY_DIETARY_OPTIONS.map((option) => {
              const active = safetyPreferences.requiredDietaryTags.includes(option.value);
              return (
                <button
                  aria-pressed={active}
                  className={`rounded-full border px-3 py-2 text-sm font-black transition ${active ? 'border-rose-800 bg-rose-800 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-950'}`}
                  key={option.value}
                  onClick={() => toggleDietaryPreference(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-800">Avoid allergens</p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Allergen avoidance preferences">
            {SAFETY_ALLERGEN_OPTIONS.map((option) => {
              const active = safetyPreferences.avoidedAllergenTags.includes(option.value);
              return (
                <button
                  aria-pressed={active}
                  className={`rounded-full border px-3 py-2 text-sm font-black transition ${active ? 'border-rose-800 bg-rose-800 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-950'}`}
                  key={option.value}
                  onClick={() => toggleAllergenPreference(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-800">Nutrition priorities</p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Nutrition priority preferences">
            {SAFETY_NUTRITION_OPTIONS.map((option) => {
              const active = safetyPreferences.nutritionPriorityTags.includes(option.value);
              return (
                <button
                  aria-pressed={active}
                  className={`rounded-full border px-3 py-2 text-sm font-black transition ${active ? 'border-sky-800 bg-sky-800 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-950'}`}
                  key={option.value}
                  onClick={() => toggleNutritionPriority(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export function matchesCertificationFilter(
  productCertifications: readonly string[] | null | undefined,
  selectedCertifications: readonly string[] | null | undefined
) {
  const selectedOptions = normaliseSelected(selectedCertifications);
  if (selectedOptions.length === 0) {
    return true;
  }

  if (!productCertifications || productCertifications.length === 0) {
    return false;
  }

  const productCertificationSet = new Set(productCertifications.filter(isCertificationFilterOption));
  return selectedOptions.every((option) => productCertificationSet.has(option));
}
