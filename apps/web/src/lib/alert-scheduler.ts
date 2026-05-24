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
