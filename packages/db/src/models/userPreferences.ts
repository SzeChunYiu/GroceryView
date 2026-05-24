export type DisplayDensity = 'comfortable' | 'compact';

export type UserPreferences = Readonly<{
  currency: string;
  darkMode: boolean;
  displayDensity: DisplayDensity;
  hiddenProductIds: string[];
  id?: string;
  locale: string;
  preferredStoreIds: string[];
  userId: string;
}>;

export const defaultUserPreferences = {
  currency: 'SEK',
  darkMode: false,
  displayDensity: 'comfortable' as const,
  hiddenProductIds: [],
  locale: 'sv-SE',
  preferredStoreIds: []
};

function unique(values: readonly string[] | undefined) {
  return [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))];
}

export function userPreferencesForUser(input: Readonly<Partial<UserPreferences> & { userId: string }>): UserPreferences {
  return {
    ...defaultUserPreferences,
    ...input,
    displayDensity: input.displayDensity === 'compact' ? 'compact' : 'comfortable',
    hiddenProductIds: unique(input.hiddenProductIds),
    preferredStoreIds: unique(input.preferredStoreIds),
    userId: input.userId
  };
}
