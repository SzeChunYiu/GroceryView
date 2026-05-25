export type PredictiveDropForecast = {
  productId: string;
  productName: string;
  storeName: string;
  currentPrice: number;
  predictedPrice: number;
  predictedDate: string;
  modelConfidence: number;
  modelName?: string;
  source?: string;
};

export type PredictiveDropAlert = {
  productId: string;
  productName: string;
  type: 'predictive_drop';
  severity: 'watch' | 'soon' | 'high';
  message: string;
  source: string;
  trigger: {
    metric: 'forecasted_drop';
    storeName: string;
    value: number;
    predictedPrice: number;
    currentPrice: number;
    predictedDate: string;
    savingsPercent: number;
    modelConfidence: number;
  };
};

export type AlertExplanationTimelineStep = {
  label: string;
  detail: string;
  kind: 'source_price' | 'threshold' | 'prediction' | 'seasonality' | 'volatility' | 'flyer_window';
};

export type BestTimeAlertExplanationInput = {
  categoryLabel?: string;
  decisionLabel?: string;
  flyerWindowLabel?: string;
  observedPriceCount?: number | null;
  observedRangeLabel?: string;
  productName: string;
  seasonalityLabel?: string;
  volatilityScore?: number | null;
};

type PredictiveDropAlertOptions = {
  now?: Date;
  daysAhead?: number;
  minimumSavingsPercent?: number;
  minimumConfidence?: number;
};

const DEFAULT_DAYS_AHEAD = 14;
const DEFAULT_MINIMUM_SAVINGS_PERCENT = 8;
const DEFAULT_MINIMUM_CONFIDENCE = 0.6;

function daysUntil(date: Date, now: Date) {
  return Math.ceil((date.getTime() - now.getTime()) / 86_400_000);
}

function toSeverity(daysAway: number, savingsPercent: number): PredictiveDropAlert['severity'] {
  if (daysAway <= 3 || savingsPercent >= 18) {
    return 'high';
  }

  if (daysAway <= 7 || savingsPercent >= 12) {
    return 'soon';
  }

  return 'watch';
}

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value);
}

export function buildPredictiveDropAlerts(forecasts: PredictiveDropForecast[], options: PredictiveDropAlertOptions = {}): PredictiveDropAlert[] {
  const now = options.now ?? new Date();
  const daysAhead = options.daysAhead ?? DEFAULT_DAYS_AHEAD;
  const minimumSavingsPercent = options.minimumSavingsPercent ?? DEFAULT_MINIMUM_SAVINGS_PERCENT;
  const minimumConfidence = options.minimumConfidence ?? DEFAULT_MINIMUM_CONFIDENCE;

  return forecasts
    .map((forecast) => {
      const predictedDate = new Date(forecast.predictedDate);
      const savings = forecast.currentPrice - forecast.predictedPrice;
      const savingsPercent = forecast.currentPrice > 0 ? (savings / forecast.currentPrice) * 100 : 0;
      const daysAway = daysUntil(predictedDate, now);

      return { forecast, predictedDate, savings, savingsPercent, daysAway };
    })
    .filter(({ forecast, predictedDate, savingsPercent, daysAway }) => Number.isFinite(predictedDate.getTime()) && forecast.currentPrice > 0 && forecast.predictedPrice > 0 && forecast.predictedPrice < forecast.currentPrice && forecast.modelConfidence >= minimumConfidence && daysAway >= 0 && daysAway <= daysAhead && savingsPercent >= minimumSavingsPercent)
    .sort((a, b) => b.savingsPercent - a.savingsPercent || a.daysAway - b.daysAway)
    .map(({ forecast, savings, savingsPercent, daysAway }) => ({
      productId: forecast.productId,
      productName: forecast.productName,
      type: 'predictive_drop',
      severity: toSeverity(daysAway, savingsPercent),
      message: `${forecast.storeName} is forecast to drop to ${formatSek(forecast.predictedPrice)} in ${daysAway} day${daysAway === 1 ? '' : 's'}; waiting could save ${formatSek(savings)} (${Math.round(savingsPercent)}%).`,
      source: forecast.source ?? forecast.modelName ?? 'price-forecast-model',
      trigger: {
        metric: 'forecasted_drop',
        storeName: forecast.storeName,
        value: Math.round(savingsPercent),
        predictedPrice: forecast.predictedPrice,
        currentPrice: forecast.currentPrice,
        predictedDate: forecast.predictedDate,
        savingsPercent: Math.round(savingsPercent),
        modelConfidence: forecast.modelConfidence,
      },
    }));
}

export function buildAlertExplanationTimeline({
  productName,
  currentPriceText,
  lowestChain,
  targetPriceText,
  lastObservedAt,
  predictionSource = 'No prediction model input attached'
}: {
  productName: string;
  currentPriceText: string;
  lowestChain: string;
  targetPriceText: string;
  lastObservedAt?: string;
  predictionSource?: string;
}): AlertExplanationTimelineStep[] {
  return [
    {
      kind: 'source_price',
      label: 'Source price checked',
      detail: `${lowestChain} current price for ${productName}: ${currentPriceText}${lastObservedAt ? ` observed ${lastObservedAt}` : ''}.`
    },
    {
      kind: 'threshold',
      label: 'Threshold compared',
      detail: `Alert target is ${targetPriceText}; the alert fires only when verified price evidence is at or below this threshold.`
    },
    {
      kind: 'prediction',
      label: 'Prediction inputs',
      detail: predictionSource
    }
  ];
}

export function buildBestTimeAlertExplanationTimeline(input: BestTimeAlertExplanationInput): AlertExplanationTimelineStep[] {
  const categoryLabel = input.categoryLabel?.trim() || 'the product category';
  const volatilityScore = typeof input.volatilityScore === 'number' && Number.isFinite(input.volatilityScore)
    ? input.volatilityScore
    : null;
  const observedPriceCount = typeof input.observedPriceCount === 'number' && Number.isFinite(input.observedPriceCount)
    ? input.observedPriceCount
    : null;

  return [
    {
      kind: 'seasonality',
      label: 'Seasonality checked',
      detail: input.seasonalityLabel ?? `${input.productName} is compared against ${categoryLabel} timing context before a best-time alert recommends buying now or waiting.`
    },
    {
      kind: 'volatility',
      label: 'Volatility checked',
      detail: `Recent price movement is part of the timing decision${volatilityScore === null ? '' : ` (volatility score ${volatilityScore})`}${observedPriceCount === null ? '' : ` from ${observedPriceCount} observed price point${observedPriceCount === 1 ? '' : 's'}`}${input.observedRangeLabel ? `; observed range ${input.observedRangeLabel}` : ''}.`
    },
    {
      kind: 'flyer_window',
      label: 'Flyer window checked',
      detail: input.flyerWindowLabel
        ? `Known flyer windows say: ${input.flyerWindowLabel}.`
        : `No known flyer window was supplied, so ${input.decisionLabel ?? 'the alert'} relies on observed price and seasonality signals instead of inventing a promotion.`
    }
  ];
}


export const samplePredictiveDropForecasts: PredictiveDropForecast[] = [
  {
    productId: 'arla-mellanmjolk-1l',
    productName: 'Arla Mellanmjölk 1L',
    storeName: 'Willys',
    currentPrice: 17.9,
    predictedPrice: 14.9,
    predictedDate: '2026-05-29',
    modelConfidence: 0.82,
    modelName: 'weekly-drop-forecast-v1',
    source: 'Forecast from verified Willys milk history',
  },
  {
    productId: 'libero-touch-size-4',
    productName: 'Libero Touch Size 4',
    storeName: 'ICA Maxi',
    currentPrice: 119,
    predictedPrice: 99,
    predictedDate: '2026-06-03',
    modelConfidence: 0.76,
    modelName: 'weekly-drop-forecast-v1',
    source: 'Forecast from diaper promo cadence',
  },
  {
    productId: 'zoegas-skane-450g',
    productName: 'Zoégas Skåne 450g',
    storeName: 'Coop',
    currentPrice: 69.9,
    predictedPrice: 59.9,
    predictedDate: '2026-06-06',
    modelConfidence: 0.69,
    modelName: 'weekly-drop-forecast-v1',
    source: 'Forecast from coffee campaign history',
  },
];

export const samplePredictiveDropAlerts = buildPredictiveDropAlerts(samplePredictiveDropForecasts, { now: new Date('2026-05-24T00:00:00Z') });

export type SavedSearchSubscription = {
  id: string;
  label: string;
  href: string;
  filters: Record<string, string[]>;
  createdAt: string;
  alertReason: string;
  alertRules: SavedSearchAlertRule[];
};

export type SavedSearchAlertRule = {
  type: 'new_match' | 'price_drop';
  label: string;
  description: string;
};

export type SavedSearchDealCandidate = {
  id: string;
  name: string;
  brand?: string;
  href: string;
  category: string;
  chain: string;
  labels: string[];
  currentPriceText: string;
  priceDropText?: string | null;
  dealSummary: string;
};

export type SavedSearchDealMatch = SavedSearchDealCandidate & {
  subscriptionId: string;
  matchedFilters: string[];
  alertRuleTypes: SavedSearchAlertRule['type'][];
};

const savedSearchFilterLabels: Record<string, string> = {
  q: 'query',
  category: 'category',
  label: 'label',
  dietary: 'dietary',
  chain: 'chain',
  brand: 'brand',
  minPrice: 'min price',
  maxPrice: 'max price',
  inStockOnly: 'stock',
  minConfidence: 'confidence'
};

export const defaultSavedSearchAlertRules: SavedSearchAlertRule[] = [
  {
    type: 'new_match',
    label: 'New matching products',
    description: 'Create an alert when a newly verified product row starts matching these query filters.'
  },
  {
    type: 'price_drop',
    label: 'Verified price drops',
    description: 'Create an alert when a matching product gets a lower observed price than the saved-search baseline.'
  }
];

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase('sv-SE');
}

function listFilterValues(value: string | string[] | undefined): string[] {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(values.flatMap((item) => item.split(',')).map((item) => item.trim()).filter(Boolean))];
}

function subscriptionIdFromFilters(filters: Record<string, string[]>): string {
  const suffix = Object.entries(filters)
    .sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([key, values]) => values.map((value) => `${key}:${normalize(value).replace(/[^a-z0-9]+/g, '-')}`))
    .join('__')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
  return suffix ? `saved-search:${suffix}` : 'saved-search:all-products';
}

export function buildSavedSearchSubscription(input: {
  searchParams: Record<string, string | string[] | undefined>;
  path?: string;
  createdAt?: string;
}): SavedSearchSubscription {
  const filters = Object.fromEntries(
    Object.entries(input.searchParams)
      .filter(([key]) => key in savedSearchFilterLabels)
      .map(([key, value]) => [key, listFilterValues(value)] as const)
      .filter(([, values]) => values.length > 0)
  );
  const params = new URLSearchParams();
  for (const [key, values] of Object.entries(filters)) {
    for (const value of values) params.append(key, value);
  }
  const query = params.toString();
  const labelParts = Object.entries(filters).map(([key, values]) => `${savedSearchFilterLabels[key] ?? key}: ${values.join(', ')}`);

  return {
    id: subscriptionIdFromFilters(filters),
    label: labelParts.length > 0 ? labelParts.join(' · ') : 'All verified products',
    href: `${input.path ?? '/search'}${query ? `?${query}` : ''}`,
    filters,
    createdAt: input.createdAt ?? new Date().toISOString(),
    alertReason: 'Notify when newly matching verified deals appear or an existing match posts a verified price drop.',
    alertRules: defaultSavedSearchAlertRules
  };
}

export function buildSavedSearchDealMatches(
  subscriptions: SavedSearchSubscription[],
  candidates: SavedSearchDealCandidate[],
  limitPerSubscription = 3
): SavedSearchDealMatch[] {
  return subscriptions.flatMap((subscription) => {
    const filterEntries = Object.entries(subscription.filters);
    const alertRules = subscription.alertRules?.length ? subscription.alertRules : defaultSavedSearchAlertRules;
    return candidates
      .map((candidate) => {
        const text = normalize([candidate.name, candidate.brand, candidate.category, candidate.chain, ...candidate.labels].filter(Boolean).join(' '));
        const matchedFilters = filterEntries.flatMap(([key, values]) => {
          if (key === 'minPrice' || key === 'maxPrice' || key === 'inStockOnly' || key === 'minConfidence') return [];
          return values.filter((value) => text.includes(normalize(value))).map((value) => `${savedSearchFilterLabels[key] ?? key}: ${value}`);
        });
        const textFilters = filterEntries.filter(([key]) => !['minPrice', 'maxPrice', 'inStockOnly', 'minConfidence'].includes(key));
        const matched = textFilters.length === 0 || matchedFilters.length > 0;
        return matched
          ? { ...candidate, subscriptionId: subscription.id, matchedFilters, alertRuleTypes: alertRules.map((rule) => rule.type) }
          : null;
      })
      .filter((candidate): candidate is SavedSearchDealMatch => candidate !== null)
      .slice(0, limitPerSubscription);
  });
}
