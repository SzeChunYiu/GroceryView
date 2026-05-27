import type { PriceChartTerminalModel, PriceChartTerminalSeries, PriceChartTerminalWindow } from '@/components/price-chart-terminal';
import type { PriceIntelligenceScoreCard } from '@/components/price-intelligence-card';
import type { StoreComparisonItem } from '@/components/StoreComparisonTable';
import { formatSek } from '@/lib/verified-data';

const observedSeries: PriceChartTerminalSeries[] = [
  {
    id: 'axfood-milk',
    storeName: 'Axfood milk basket row',
    sourceType: 'Axfood chain price snapshot',
    lineStyle: 'solid',
    points: [
      { time: '2026-01-05T00:00:00.000Z', value: 16.9, confidence: 0.92, provenanceLabel: 'Axfood observed row' },
      { time: '2026-02-05T00:00:00.000Z', value: 17.5, confidence: 0.91, provenanceLabel: 'Axfood observed row' },
      { time: '2026-03-05T00:00:00.000Z', value: 16.95, confidence: 0.93, provenanceLabel: 'Axfood observed row' },
      { time: '2026-04-05T00:00:00.000Z', value: 15.95, confidence: 0.94, provenanceLabel: 'Axfood observed row' }
    ],
    markers: [{ time: '2026-04-05T00:00:00.000Z', text: 'Observed low', color: '#047857', provenanceLabel: 'Axfood observed row' }]
  },
  {
    id: 'openprices-milk',
    storeName: 'OpenPrices community observations',
    sourceType: 'OpenPrices',
    lineStyle: 'dashed',
    points: [
      { time: '2026-01-12T00:00:00.000Z', value: 17.2, confidence: 0.68, provenanceLabel: 'OpenPrices observed row' },
      { time: '2026-02-12T00:00:00.000Z', value: 17.1, confidence: 0.66, provenanceLabel: 'OpenPrices observed row' },
      { time: '2026-03-12T00:00:00.000Z', value: 16.8, confidence: 0.7, provenanceLabel: 'OpenPrices observed row' },
      { time: '2026-04-12T00:00:00.000Z', value: 16.4, confidence: 0.72, provenanceLabel: 'OpenPrices observed row' }
    ],
    markers: []
  }
];

function chartWindow(label: PriceChartTerminalWindow['label'], rangeLabel: string, series: PriceChartTerminalSeries[]): PriceChartTerminalWindow {
  const values = series.flatMap((item) => item.points.map((point) => point.value));
  const latest = values.at(-1) ?? 0;

  return {
    label,
    rangeLabel,
    windowStart: series[0]?.points[0]?.time,
    windowEnd: series[0]?.points.at(-1)?.time,
    pointCount: series.reduce((total, item) => total + item.points.length, 0),
    markerCount: series.reduce((total, item) => total + item.markers.length, 0),
    latestValueLabel: formatSek(latest),
    latestObservedAt: series[0]?.points.at(-1)?.time,
    lowValueLabel: formatSek(Math.min(...values)),
    highValueLabel: formatSek(Math.max(...values)),
    series
  };
}

export const componentPreviewChart: PriceChartTerminalModel = {
  available: true,
  title: 'Observed price history preview',
  sourceLabel: 'Preview fixture assembled from source-backed GroceryView chart schema',
  confidenceLabel: 'High Axfood confidence with medium OpenPrices overlay',
  caveat: 'Preview values exercise chart rendering states and do not replace product-page source evidence.',
  defaultWindow: '3M',
  windows: [
    chartWindow('1M', 'Last observed month', observedSeries.map((series) => ({ ...series, points: series.points.slice(-2) }))),
    chartWindow('3M', 'Last observed quarter', observedSeries),
    chartWindow('1Y', '2026 observed period', observedSeries),
    chartWindow('ALL', 'All preview observations', observedSeries)
  ]
};

export const componentPreviewPriceCards: PriceIntelligenceScoreCard[] = [
  {
    id: 'milk-buy',
    title: 'Milk basket row',
    score: 82,
    scoreLabel: 'Buy window is favorable',
    actionLabel: 'High confidence',
    windowLabel: '7 day observed window',
    trendSlopeLabel: 'falling 4.8%',
    volatilityLabel: 'low',
    forecastRangeLabel: '15.70-16.40 kr',
    forecastConfidenceLabel: 'forecast confidence: medium',
    forecastTrendLabel: 'expected movement: down',
    seasonalContextLabel: 'standard staple cycle',
    detail: 'Uses dated observed rows, confidence labels, and guardrail copy to preview the card layout.'
  },
  {
    id: 'coffee-watch',
    title: 'Coffee shelf row',
    score: 54,
    scoreLabel: 'Watch for better evidence',
    actionLabel: 'Partial coverage',
    windowLabel: '14 day observed window',
    trendSlopeLabel: 'flat',
    volatilityLabel: 'medium',
    forecastRangeLabel: '42.90-48.90 kr',
    forecastConfidenceLabel: 'forecast confidence: low',
    detail: 'Exercises longer labels, partial confidence, and forecast caveats.'
  },
  {
    id: 'empty-guardrail',
    title: 'Unpriced Iceland row',
    score: 0,
    scoreLabel: 'No recommendation',
    actionLabel: 'Blocked',
    windowLabel: 'No verified window',
    trendSlopeLabel: 'not available',
    volatilityLabel: 'not available',
    detail: 'Represents a market with a route but no verified price observations.'
  }
];

export const componentPreviewStoreItems: StoreComparisonItem[] = [
  {
    id: 'milk',
    name: 'Milk 1 liter',
    prices: [
      { storeId: 'willys', storeName: 'Willys Stockholm', basePriceLabel: '15,95 kr', unitLabel: '15,95 kr/l', loyaltyCardId: 'willys-plus', loyaltyCardLabel: 'Willys Plus', loyaltyPriceLabel: '14,95 kr' },
      { storeId: 'ica', storeName: 'ICA Nara Stockholm', basePriceLabel: '17,90 kr', unitLabel: '17,90 kr/l' },
      { storeId: 'coop', storeName: 'Coop Stockholm', basePriceLabel: '16,90 kr', unitLabel: '16,90 kr/l', loyaltyCardId: 'coop-medlem', loyaltyCardLabel: 'Coop medlem', loyaltyPriceLabel: '15,90 kr' }
    ]
  },
  {
    id: 'coffee',
    name: 'Coffee 450 g',
    prices: [
      { storeId: 'willys', storeName: 'Willys Stockholm', basePriceLabel: '46,90 kr', unitLabel: '104,22 kr/kg', loyaltyCardId: 'willys-plus', loyaltyCardLabel: 'Willys Plus', loyaltyPriceLabel: '42,90 kr' },
      { storeId: 'ica', storeName: 'ICA Nara Stockholm', basePriceLabel: '49,90 kr', unitLabel: '110,89 kr/kg' },
      { storeId: 'coop', storeName: 'Coop Stockholm', basePriceLabel: '48,90 kr', unitLabel: '108,67 kr/kg' }
    ]
  }
];

export const componentPreviewMarkets = [
  { code: 'SE', name: 'Sweden', status: 'available', state: 'ready', detail: 'Full component set with source-backed Swedish grocery rows.' },
  { code: 'NO', name: 'Norway', status: 'partial', state: 'partial', detail: 'Route and market switcher are available while source rows remain coverage-gated.' },
  { code: 'IS', name: 'Iceland', status: 'blocked', state: 'empty', detail: 'Preview verifies empty and blocked copy before live source onboarding.' }
] as const;
