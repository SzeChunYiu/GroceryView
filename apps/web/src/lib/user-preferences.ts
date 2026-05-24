export const USER_RECOMMENDATION_PREFERENCES_STORAGE_KEY = 'groceryview:user-recommendation-preferences:v1';
export const USER_RECOMMENDATION_PREFERENCES_UPDATED_EVENT = 'groceryview:user-recommendation-preferences-updated';

export type RecommendationPreferenceItem = {
  productId: string;
  productName: string;
  category: string;
  brand: string;
};

export type RecommendationDislikeSignal = RecommendationPreferenceItem & {
  sourceProductId: string;
  dislikedAt: string;
};

export type UserRecommendationPreferences = {
  dislikedRecommendations: RecommendationDislikeSignal[];
};

const MAX_DISLIKE_SIGNALS = 50;

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function isPreferenceItem(value: unknown): value is RecommendationPreferenceItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<Record<keyof RecommendationPreferenceItem, unknown>>;
  return typeof item.productId === 'string'
    && typeof item.productName === 'string'
    && typeof item.category === 'string'
    && typeof item.brand === 'string';
}

function isDislikeSignal(value: unknown): value is RecommendationDislikeSignal {
  if (!isPreferenceItem(value)) return false;
  const signal = value as Partial<Record<keyof RecommendationDislikeSignal, unknown>>;
  return typeof signal.sourceProductId === 'string' && typeof signal.dislikedAt === 'string';
}

export function parseUserRecommendationPreferences(raw: string | null): UserRecommendationPreferences {
  if (!raw) return { dislikedRecommendations: [] };

  try {
    const parsed = JSON.parse(raw) as Partial<UserRecommendationPreferences>;
    const dislikedRecommendations = Array.isArray(parsed.dislikedRecommendations)
      ? parsed.dislikedRecommendations.filter(isDislikeSignal).slice(0, MAX_DISLIKE_SIGNALS)
      : [];

    return { dislikedRecommendations };
  } catch {
    return { dislikedRecommendations: [] };
  }
}

export function serializeUserRecommendationPreferences(preferences: UserRecommendationPreferences): string {
  return JSON.stringify({
    dislikedRecommendations: preferences.dislikedRecommendations.filter(isDislikeSignal).slice(0, MAX_DISLIKE_SIGNALS)
  });
}

export function createRecommendationDislikeSignal(
  item: RecommendationPreferenceItem,
  sourceProductId: string,
  dislikedAt = new Date().toISOString()
): RecommendationDislikeSignal {
  return {
    productId: item.productId,
    productName: item.productName,
    category: item.category,
    brand: item.brand,
    sourceProductId,
    dislikedAt
  };
}

export function addRecommendationDislike(
  preferences: UserRecommendationPreferences,
  signal: RecommendationDislikeSignal
): UserRecommendationPreferences {
  const nextSignals = [
    signal,
    ...preferences.dislikedRecommendations.filter((existing) => existing.productId !== signal.productId)
  ].slice(0, MAX_DISLIKE_SIGNALS);

  return { dislikedRecommendations: nextSignals };
}

export function removeRecommendationDislike(
  preferences: UserRecommendationPreferences,
  productId: string
): UserRecommendationPreferences {
  return {
    dislikedRecommendations: preferences.dislikedRecommendations.filter((signal) => signal.productId !== productId)
  };
}

export function recommendationMatchesDislike(
  item: RecommendationPreferenceItem,
  signal: RecommendationDislikeSignal
): boolean {
  if (item.productId === signal.productId) return true;
  if (normalizeText(item.category) !== normalizeText(signal.category)) return false;
  return normalizeText(item.brand) !== '' && normalizeText(item.brand) === normalizeText(signal.brand);
}

export function filterDislikedRecommendations<T extends RecommendationPreferenceItem>(
  items: T[],
  preferences: UserRecommendationPreferences
): T[] {
  return items.filter((item) => !preferences.dislikedRecommendations.some((signal) => recommendationMatchesDislike(item, signal)));
}
