export type DietaryPreferenceKey = 'vegetarian' | 'vegan' | 'halal' | 'allergens';

type DietaryPreference = {
  key: DietaryPreferenceKey;
  label: string;
  helper: string;
};

export const dietaryProfileOnboarding: {
  stepId: string;
  title: string;
  summary: string;
  preferences: DietaryPreference[];
  downstreamUses: string[];
} = {
  stepId: 'dietary-profile',
  title: 'Dietary profile onboarding',
  summary:
    'Capture dietary choices once so search, recommendations, and account alerts can filter grocery results safely.',
  preferences: [
    {
      key: 'vegetarian',
      label: 'Vegetarian',
      helper: 'Hide meat-first suggestions and prioritize vegetarian substitutes.'
    },
    {
      key: 'vegan',
      label: 'Vegan',
      helper: 'Exclude animal-derived product recommendations where verified data is available.'
    },
    {
      key: 'halal',
      label: 'Halal',
      helper: 'Prefer halal-compatible products and surface uncertified items for review.'
    },
    {
      key: 'allergens',
      label: 'Allergen preferences',
      helper: 'Collect allergens to avoid and use them for product warnings and saved-basket alerts.'
    }
  ],
  downstreamUses: ['Search filters', 'Recommendation ranking', 'Watchlist and basket alerts']
};
