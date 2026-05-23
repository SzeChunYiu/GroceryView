import { buildWatchlistAlerts, type WatchlistItem, type WatchlistProductSnapshot } from '@groceryview/core';

export type VerifiedFuelPriceObservation = {
  id: string;
  domain: 'fuel';
  productId: 'fuel-95-e10' | 'fuel-98' | 'fuel-diesel' | 'fuel-hvo100' | 'fuel-e85';
  grade: '95' | '98' | 'diesel' | 'hvo100' | 'e85';
  label: string;
  operatorId: 'okq8';
  operatorName: 'OKQ8';
  pricePerLitre: number;
  currency: 'SEK';
  unit: 'l';
  observedAt: string;
  effectiveFrom: string;
  capturedAt: string;
  sourceType: 'operator_public_price_page';
  sourceUrl: string;
  confidence: number;
  originalPriceText: string;
};

export const verifiedFuelPriceSource = {
  name: 'OKQ8 operator fuel price page',
  sourceUrl: 'https://www.okq8.se/foretag/priser/',
  capturedAt: '2026-05-23T08:35:34.000Z',
  parserVersion: 'okq8-fuel-prices-v1',
  caveat: 'Operator company station prices from OKQ8; not a crowd report and not proof of every station pump price.'
} as const;

export const fuelPriceSourceSchema = {
  gradeTable: 'fuel_grades',
  sourceTable: 'fuel_price_sources',
  sourceObservationTable: 'fuel_price_source_observations',
  operatorSourceKind: 'operator_public_price_page',
  crowdSourceKind: 'crowd_station_report',
  requiredGrades: ['fuel-95-e10', 'fuel-98', 'fuel-diesel', 'fuel-hvo100', 'fuel-e85'],
  observationContract: 'domain=fuel, price per litre, fuel grade id, original source price text'
} as const;

export const verifiedFuelPriceObservations: VerifiedFuelPriceObservation[] = [
  {
    id: 'okq8-fuel-95-e10-2026-05-22',
    domain: 'fuel',
    productId: 'fuel-95-e10',
    grade: '95',
    label: '95 E10 / Blyfri 95',
    operatorId: 'okq8',
    operatorName: 'OKQ8',
    pricePerLitre: 18.89,
    currency: 'SEK',
    unit: 'l',
    observedAt: '2026-05-22T00:00:00.000Z',
    effectiveFrom: '2026-05-22',
    capturedAt: verifiedFuelPriceSource.capturedAt,
    sourceType: 'operator_public_price_page',
    sourceUrl: verifiedFuelPriceSource.sourceUrl,
    confidence: 0.85,
    originalPriceText: '18,89 kr'
  },
  {
    id: 'okq8-fuel-98-2026-05-22',
    domain: 'fuel',
    productId: 'fuel-98',
    grade: '98',
    label: '98 / Blyfri 98',
    operatorId: 'okq8',
    operatorName: 'OKQ8',
    pricePerLitre: 20.49,
    currency: 'SEK',
    unit: 'l',
    observedAt: '2026-05-22T00:00:00.000Z',
    effectiveFrom: '2026-05-22',
    capturedAt: verifiedFuelPriceSource.capturedAt,
    sourceType: 'operator_public_price_page',
    sourceUrl: verifiedFuelPriceSource.sourceUrl,
    confidence: 0.85,
    originalPriceText: '20,49 kr'
  },
  {
    id: 'okq8-fuel-diesel-2026-05-21',
    domain: 'fuel',
    productId: 'fuel-diesel',
    grade: 'diesel',
    label: 'Diesel',
    operatorId: 'okq8',
    operatorName: 'OKQ8',
    pricePerLitre: 21.34,
    currency: 'SEK',
    unit: 'l',
    observedAt: '2026-05-21T00:00:00.000Z',
    effectiveFrom: '2026-05-21',
    capturedAt: verifiedFuelPriceSource.capturedAt,
    sourceType: 'operator_public_price_page',
    sourceUrl: verifiedFuelPriceSource.sourceUrl,
    confidence: 0.85,
    originalPriceText: '21,34 kr'
  },
  {
    id: 'okq8-fuel-hvo100-2026-05-21',
    domain: 'fuel',
    productId: 'fuel-hvo100',
    grade: 'hvo100',
    label: 'HVO100',
    operatorId: 'okq8',
    operatorName: 'OKQ8',
    pricePerLitre: 29.89,
    currency: 'SEK',
    unit: 'l',
    observedAt: '2026-05-21T00:00:00.000Z',
    effectiveFrom: '2026-05-21',
    capturedAt: verifiedFuelPriceSource.capturedAt,
    sourceType: 'operator_public_price_page',
    sourceUrl: verifiedFuelPriceSource.sourceUrl,
    confidence: 0.85,
    originalPriceText: '29,89 kr'
  },
  {
    id: 'okq8-fuel-e85-2026-05-22',
    domain: 'fuel',
    productId: 'fuel-e85',
    grade: 'e85',
    label: 'E85',
    operatorId: 'okq8',
    operatorName: 'OKQ8',
    pricePerLitre: 15.84,
    currency: 'SEK',
    unit: 'l',
    observedAt: '2026-05-22T00:00:00.000Z',
    effectiveFrom: '2026-05-22',
    capturedAt: verifiedFuelPriceSource.capturedAt,
    sourceType: 'operator_public_price_page',
    sourceUrl: verifiedFuelPriceSource.sourceUrl,
    confidence: 0.85,
    originalPriceText: '15,84 kr'
  }
];

export function formatFuelPrice(value: number): string {
  return `${value.toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr/l`;
}

const fuelOperatorStoreId = 'okq8-operator-price-page';

const fuelAlertTargets = [
  {
    id: '95-e10-under-19',
    name: '95 E10 alert',
    productId: 'fuel-95-e10',
    targetPricePerLitre: 19,
    targetLabel: 'target 19 kr/l'
  },
  {
    id: 'e85-under-16',
    name: 'E85 alert',
    productId: 'fuel-e85',
    targetPricePerLitre: 16,
    targetLabel: 'target 16 kr/l'
  },
  {
    id: 'diesel-under-20',
    name: 'Diesel watch',
    productId: 'fuel-diesel',
    targetPricePerLitre: 20,
    targetLabel: 'target 20 kr/l'
  }
] as const;

const fuelWatchlist: WatchlistItem[] = fuelAlertTargets.map((target) => ({
  productId: target.productId,
  targetPrice: target.targetPricePerLitre,
  favoriteStoresOnly: false,
  allowedPriceTypes: ['shelf']
}));

const fuelWatchlistProducts: WatchlistProductSnapshot[] = verifiedFuelPriceObservations.map((row) => ({
  productId: row.productId,
  productName: row.label,
  bestPrice: row.pricePerLitre,
  bestStoreId: fuelOperatorStoreId,
  bestPriceType: 'shelf',
  prices: [
    {
      storeId: fuelOperatorStoreId,
      storeName: row.operatorName,
      price: row.pricePerLitre,
      priceType: 'shelf'
    }
  ],
  dealScore: 0,
  isNew52WeekLow: false
}));

const rawFuelAlerts = buildWatchlistAlerts({
  watchlist: fuelWatchlist,
  products: fuelWatchlistProducts,
  favoriteStoreIds: []
});

export const fuelPriceTargetAlerts = {
  title: 'Fuel target price alerts',
  source: verifiedFuelPriceSource.name,
  operatorStoreId: fuelOperatorStoreId,
  targetCount: fuelAlertTargets.length,
  alertCount: rawFuelAlerts.length,
  targets: fuelAlertTargets.map((target) => {
    const observation = verifiedFuelPriceObservations.find((row) => row.productId === target.productId)!;
    return {
      ...target,
      label: observation.label,
      observedPricePerLitre: observation.pricePerLitre,
      observedPriceLabel: formatFuelPrice(observation.pricePerLitre),
      targetPriceLabel: formatFuelPrice(target.targetPricePerLitre),
      isTriggered: observation.pricePerLitre <= target.targetPricePerLitre,
      observedAt: observation.observedAt,
      sourceUrl: observation.sourceUrl
    };
  }),
  alerts: rawFuelAlerts.map((alert) => {
    const target = fuelAlertTargets.find((candidate) => candidate.productId === alert.productId)!;
    const observation = verifiedFuelPriceObservations.find((row) => row.productId === alert.productId)!;
    return {
      ...alert,
      alertName: target.name,
      targetLabel: target.targetLabel,
      observedPriceLabel: formatFuelPrice(observation.pricePerLitre),
      operatorName: observation.operatorName,
      sourceUrl: observation.sourceUrl,
      evidence: `${observation.sourceType} · captured ${verifiedFuelPriceSource.capturedAt.slice(0, 10)}`
    };
  }),
  guardrails: [
    'Alerts use buildWatchlistAlerts against verified domain=fuel operator rows.',
    'No station-level fuel alert: OKQ8 company price rows do not identify a specific pump, address, or nearest-station offer.',
    'Crowd station reports remain schema-ready but are not rendered until trusted reporter evidence lands.'
  ]
} as const;
