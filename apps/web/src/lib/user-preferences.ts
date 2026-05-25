export type DietaryProfilePreferences = {
  userId: string;
  allergies: string[];
  diets: string[];
  avoidedIngredients: string[];
  householdSize: number;
  nutritionPriorities: string[];
  onboardingCompleted: boolean;
  updatedAt: string;
};

export const DIETARY_PROFILE_STORAGE_KEY = 'groceryview:dietary-profile:v1';

export const DEFAULT_DIETARY_PROFILE_PREFERENCES: DietaryProfilePreferences = {
  userId: 'local-account',
  allergies: [],
  diets: [],
  avoidedIngredients: [],
  householdSize: 1,
  nutritionPriorities: [],
  onboardingCompleted: false,
  updatedAt: 'static-snapshot'
};

export type HouseholdPricePreferences = {
  householdId: string;
  preferredBrands: string[];
  avoidedBrands: string[];
  preferredStores: string[];
  updatedAt: string;
};

export type PricePreferenceChoice = {
  brand?: string | null;
  store?: string | null;
};

export type PricePreferenceCandidate = PricePreferenceChoice & {
  chain?: string | null;
  storeName?: string | null;
};

export const HOUSEHOLD_PRICE_PREFERENCE_STORAGE_KEY = 'groceryview:household-price-preferences:v1';

export const DEFAULT_HOUSEHOLD_PRICE_PREFERENCES: HouseholdPricePreferences = {
  householdId: 'local-household',
  preferredBrands: ['Garant', 'ICA Basic'],
  avoidedBrands: ['Unknown private label'],
  preferredStores: ['Willys', 'Hemköp'],
  updatedAt: 'static-snapshot'
};

const MAX_LEARNED_VALUES = 6;

function normalizedValue(value?: string | null) {
  return value?.trim().toLowerCase() ?? '';
}

function uniquePreferenceValues(values: readonly (string | null | undefined)[]) {
  const seen = new Set<string>();
  const nextValues: string[] = [];

  for (const value of values) {
    const trimmedValue = value?.trim();
    if (!trimmedValue) continue;

    const normalized = normalizedValue(trimmedValue);
    if (seen.has(normalized)) continue;

    seen.add(normalized);
    nextValues.push(trimmedValue);
  }

  return nextValues.slice(0, MAX_LEARNED_VALUES);
}

function browserStorage() {
  if (typeof window === 'undefined') return null;

  return window.localStorage;
}

function normalizePreferenceList(values: readonly (string | null | undefined)[]) {
  return uniquePreferenceValues(values);
}

function normalizeHouseholdSize(value: unknown) {
  const numericValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numericValue)) return DEFAULT_DIETARY_PROFILE_PREFERENCES.householdSize;

  return Math.min(12, Math.max(1, Math.round(numericValue)));
}

export function normalizeDietaryProfilePreferences(preferences: Partial<DietaryProfilePreferences> | null | undefined): DietaryProfilePreferences {
  return {
    userId: preferences?.userId?.trim() || DEFAULT_DIETARY_PROFILE_PREFERENCES.userId,
    allergies: normalizePreferenceList(preferences?.allergies ?? DEFAULT_DIETARY_PROFILE_PREFERENCES.allergies),
    diets: normalizePreferenceList(preferences?.diets ?? DEFAULT_DIETARY_PROFILE_PREFERENCES.diets),
    avoidedIngredients: normalizePreferenceList(preferences?.avoidedIngredients ?? DEFAULT_DIETARY_PROFILE_PREFERENCES.avoidedIngredients),
    householdSize: normalizeHouseholdSize(preferences?.householdSize),
    nutritionPriorities: normalizePreferenceList(preferences?.nutritionPriorities ?? DEFAULT_DIETARY_PROFILE_PREFERENCES.nutritionPriorities),
    onboardingCompleted: Boolean(preferences?.onboardingCompleted),
    updatedAt: preferences?.updatedAt || new Date().toISOString()
  };
}

export function loadDietaryProfilePreferences(storage: Storage | null = browserStorage()) {
  if (!storage) return DEFAULT_DIETARY_PROFILE_PREFERENCES;

  try {
    const parsed = JSON.parse(storage.getItem(DIETARY_PROFILE_STORAGE_KEY) ?? 'null') as Partial<DietaryProfilePreferences> | null;

    return normalizeDietaryProfilePreferences(parsed);
  } catch {
    return DEFAULT_DIETARY_PROFILE_PREFERENCES;
  }
}

export function saveDietaryProfilePreferences(preferences: Partial<DietaryProfilePreferences>, storage: Storage | null = browserStorage()) {
  if (!storage) return false;

  try {
    storage.setItem(DIETARY_PROFILE_STORAGE_KEY, JSON.stringify(normalizeDietaryProfilePreferences({
      ...preferences,
      updatedAt: new Date().toISOString()
    })));

    return true;
  } catch {
    return false;
  }
}

export function normalizeHouseholdPricePreferences(preferences: Partial<HouseholdPricePreferences> | null | undefined): HouseholdPricePreferences {
  const avoidedBrands = uniquePreferenceValues(preferences?.avoidedBrands ?? DEFAULT_HOUSEHOLD_PRICE_PREFERENCES.avoidedBrands);
  const avoidedBrandSet = new Set(avoidedBrands.map(normalizedValue));

  return {
    householdId: preferences?.householdId?.trim() || DEFAULT_HOUSEHOLD_PRICE_PREFERENCES.householdId,
    preferredBrands: uniquePreferenceValues(preferences?.preferredBrands ?? DEFAULT_HOUSEHOLD_PRICE_PREFERENCES.preferredBrands)
      .filter((brand) => !avoidedBrandSet.has(normalizedValue(brand))),
    avoidedBrands,
    preferredStores: uniquePreferenceValues(preferences?.preferredStores ?? DEFAULT_HOUSEHOLD_PRICE_PREFERENCES.preferredStores),
    updatedAt: preferences?.updatedAt || new Date().toISOString()
  };
}

export function loadHouseholdPricePreferences(storage: Storage | null = browserStorage()) {
  if (!storage) return DEFAULT_HOUSEHOLD_PRICE_PREFERENCES;

  try {
    const parsed = JSON.parse(storage.getItem(HOUSEHOLD_PRICE_PREFERENCE_STORAGE_KEY) ?? 'null') as Partial<HouseholdPricePreferences> | null;

    return normalizeHouseholdPricePreferences(parsed);
  } catch {
    return DEFAULT_HOUSEHOLD_PRICE_PREFERENCES;
  }
}

export function saveHouseholdPricePreferences(preferences: Partial<HouseholdPricePreferences>, storage: Storage | null = browserStorage()) {
  if (!storage) return false;

  try {
    storage.setItem(HOUSEHOLD_PRICE_PREFERENCE_STORAGE_KEY, JSON.stringify(normalizeHouseholdPricePreferences(preferences)));

    return true;
  } catch {
    return false;
  }
}

export function learnHouseholdPricePreferenceChoice(
  choice: PricePreferenceChoice,
  currentPreferences: HouseholdPricePreferences = loadHouseholdPricePreferences()
) {
  return normalizeHouseholdPricePreferences({
    ...currentPreferences,
    preferredBrands: uniquePreferenceValues([choice.brand, ...currentPreferences.preferredBrands]),
    preferredStores: uniquePreferenceValues([choice.store, ...currentPreferences.preferredStores]),
    updatedAt: new Date().toISOString()
  });
}

export function persistHouseholdPricePreferenceChoice(choice: PricePreferenceChoice, storage: Storage | null = browserStorage()) {
  const nextPreferences = learnHouseholdPricePreferenceChoice(choice, loadHouseholdPricePreferences(storage));

  saveHouseholdPricePreferences(nextPreferences, storage);

  return nextPreferences;
}

export function householdPricePreferenceScore(
  candidate: PricePreferenceCandidate,
  preferences: HouseholdPricePreferences = DEFAULT_HOUSEHOLD_PRICE_PREFERENCES
) {
  const preferredBrands = new Set(preferences.preferredBrands.map(normalizedValue));
  const avoidedBrands = new Set(preferences.avoidedBrands.map(normalizedValue));
  const preferredStores = new Set(preferences.preferredStores.map(normalizedValue));
  const candidateStores = [candidate.store, candidate.storeName, candidate.chain].map(normalizedValue);
  let score = 0;

  if (preferredBrands.has(normalizedValue(candidate.brand))) score += 1;
  if (avoidedBrands.has(normalizedValue(candidate.brand))) score -= 4;
  if (candidateStores.some((store) => preferredStores.has(store))) score += 2;

  return score;
}

export function sortByHouseholdPricePreferences<T extends PricePreferenceCandidate>(
  candidates: T[],
  preferences: HouseholdPricePreferences = DEFAULT_HOUSEHOLD_PRICE_PREFERENCES
) {
  return [...candidates].sort((left, right) => (
    householdPricePreferenceScore(right, preferences) - householdPricePreferenceScore(left, preferences)
  ));
}
