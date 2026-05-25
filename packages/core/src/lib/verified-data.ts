export type CountryCoverageConfidence = 'high' | 'medium' | 'low' | 'unknown';

export type CoverageConfidenceInput = {
  countryCode?: string;
  observations: number;
  categoriesCovered?: number;
  scope: 'category' | 'chain';
};

type ConfidenceThresholds = {
  category: { highObservations: number; mediumObservations: number };
  chain: { highObservations: number; highCategories: number; mediumObservations: number; mediumCategories: number };
};

const DEFAULT_COUNTRY = 'SE';

const COUNTRY_CONFIDENCE_THRESHOLDS: Record<string, ConfidenceThresholds> = {
  SE: {
    category: { highObservations: 12, mediumObservations: 4 },
    chain: { highObservations: 30, highCategories: 4, mediumObservations: 10, mediumCategories: 2 }
  },
  NO: {
    category: { highObservations: 24, mediumObservations: 8 },
    chain: { highObservations: 60, highCategories: 5, mediumObservations: 24, mediumCategories: 3 }
  },
  IS: {
    category: { highObservations: 18, mediumObservations: 6 },
    chain: { highObservations: 45, highCategories: 4, mediumObservations: 18, mediumCategories: 2 }
  }
};

export function normalizeCoverageCountryCode(countryCode: string | undefined): string {
  const normalized = countryCode?.trim().toUpperCase();
  return normalized || DEFAULT_COUNTRY;
}

export function countryCoverageConfidence(input: CoverageConfidenceInput): CountryCoverageConfidence {
  const observations = Math.max(0, Math.floor(input.observations));
  if (observations === 0) return 'unknown';

  const countryCode = normalizeCoverageCountryCode(input.countryCode);
  const thresholds = COUNTRY_CONFIDENCE_THRESHOLDS[countryCode] ?? COUNTRY_CONFIDENCE_THRESHOLDS[DEFAULT_COUNTRY];

  if (input.scope === 'category') {
    if (observations >= thresholds.category.highObservations) return 'high';
    if (observations >= thresholds.category.mediumObservations) return 'medium';
    return 'low';
  }

  const categoriesCovered = Math.max(0, Math.floor(input.categoriesCovered ?? 0));
  if (observations >= thresholds.chain.highObservations && categoriesCovered >= thresholds.chain.highCategories) return 'high';
  if (observations >= thresholds.chain.mediumObservations && categoriesCovered >= thresholds.chain.mediumCategories) return 'medium';
  return 'low';
}
