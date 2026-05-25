import { rankTrendingDealsForHousehold, type PersonalizedTrendingDeal } from './personalization';
import type { CityPriceDropTrend } from './trends';

export type AccountRecommendationPreferences = {
  accountId?: string;
  favoriteBrands: string[];
  dietaryFilters: string[];
  nearbyChains: string[];
  clickedProductSlugs: string[];
};

export const anonymousRecommendationPreferences: AccountRecommendationPreferences = {
  favoriteBrands: [],
  dietaryFilters: [],
  nearbyChains: [],
  clickedProductSlugs: []
};

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((entry) => (typeof entry === 'string' ? entry.trim() : '')).filter(Boolean).slice(0, 20)
    : [];
}

export function shapeAccountRecommendationPreferences(input: unknown): AccountRecommendationPreferences | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const record = input as Record<string, unknown>;
  const accountId = typeof record.accountId === 'string' && record.accountId.trim() ? record.accountId.trim() : undefined;

  return {
    accountId,
    favoriteBrands: stringArray(record.favoriteBrands),
    dietaryFilters: stringArray(record.dietaryFilters),
    nearbyChains: stringArray(record.nearbyChains),
    clickedProductSlugs: stringArray(record.clickedProductSlugs)
  };
}

export function buildRecommendedDealsFeed(
  cards: CityPriceDropTrend[],
  preferences: AccountRecommendationPreferences | null,
  limit = 6
): {
  cards: PersonalizedTrendingDeal<CityPriceDropTrend>[];
  personalization: {
    accountBacked: boolean;
    source: 'signed-in-account-preferences' | 'anonymous-static-feed';
    signals: string[];
  };
} {
  if (!preferences) {
    return {
      cards: [],
      personalization: {
        accountBacked: false,
        source: 'anonymous-static-feed',
        signals: []
      }
    };
  }

  const rankedCards = rankTrendingDealsForHousehold(cards, {
    householdId: preferences.accountId,
    favoriteBrands: preferences.favoriteBrands,
    dietaryFilters: preferences.dietaryFilters,
    nearbyChains: preferences.nearbyChains,
    clickedProductSlugs: preferences.clickedProductSlugs
  }).slice(0, limit);

  return {
    cards: rankedCards,
    personalization: {
      accountBacked: true,
      source: 'signed-in-account-preferences',
      signals: ['favoriteBrands', 'dietaryFilters', 'nearbyChains', 'clickedProductSlugs']
    }
  };
}
