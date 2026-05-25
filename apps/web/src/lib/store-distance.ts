export type StoreTravelMode = 'walk' | 'drive' | 'transit';
export type StoreOpeningStatus = 'open_now' | 'closing_soon' | 'closed' | 'unknown';

type ProductParam = string | string[] | undefined;

export type StoreRouteEstimate = {
  mode: StoreTravelMode;
  label: string;
  minutes: number;
  distanceLabel: string;
};

export type StoreDistanceRow = {
  id: string;
  storeName: string;
  chainName: string;
  areaLabel: string;
  distanceMeters: number;
  walkMinutes: number;
  driveMinutes: number;
  transitMinutes: number;
  routeEstimates: StoreRouteEstimate[];
  pickupMinutes: number;
  totalMinutes: number;
  basketTotalSek: number;
  travelCostSek: number;
  routeAwareTotalSek: number;
  routeScore: number;
  openingStatus: StoreOpeningStatus;
  openingStatusLabel: string;
  openingPenaltyMinutes: number;
  coverageLabel: string;
  recommendationLabel: string;
  routeRankInputs: string[];
};

const storeRouteSeeds = [
  {
    id: 'willys-triangeln',
    storeName: 'Willys Triangeln',
    chainName: 'Willys',
    areaLabel: 'Triangeln',
    distanceMeters: 450,
    walkMinutes: 6,
    driveMinutes: 4,
    transitMinutes: 7,
    basketBaseSek: 338.9,
    basketPerProductSek: 1.2,
    openingStatus: 'open_now',
    openingStatusLabel: 'Open now · closes 22:00'
  },
  {
    id: 'hemkop-city',
    storeName: 'Hemköp City',
    chainName: 'Hemköp',
    areaLabel: 'City',
    distanceMeters: 850,
    walkMinutes: 11,
    driveMinutes: 5,
    transitMinutes: 8,
    basketBaseSek: 319.4,
    basketPerProductSek: 0.9,
    openingStatus: 'closing_soon',
    openingStatusLabel: 'Closing soon · verify before leaving'
  },
  {
    id: 'ica-malmborgs',
    storeName: 'ICA Malmborgs',
    chainName: 'ICA',
    areaLabel: 'Caroli',
    distanceMeters: 1200,
    walkMinutes: 16,
    driveMinutes: 7,
    transitMinutes: 10,
    basketBaseSek: 329.8,
    basketPerProductSek: 1.5,
    openingStatus: 'open_now',
    openingStatusLabel: 'Open now · closes 23:00'
  },
  {
    id: 'coop-centralen',
    storeName: 'Coop Centralen',
    chainName: 'Coop',
    areaLabel: 'Centralen',
    distanceMeters: 1500,
    walkMinutes: 20,
    driveMinutes: 8,
    transitMinutes: 12,
    basketBaseSek: 314.5,
    basketPerProductSek: 1.1,
    openingStatus: 'closed',
    openingStatusLabel: 'Closed now · next opening must be checked'
  }
] as const;

function firstParam(value: ProductParam) {
  return Array.isArray(value) ? value[0] : value;
}

function parseSelectedProducts(products: ProductParam) {
  return (firstParam(products) ?? '')
    .split(',')
    .map((product) => product.trim())
    .filter(Boolean);
}

export function normalizeStoreTravelMode(mode: ProductParam): StoreTravelMode {
  const value = firstParam(mode);
  if (value === 'drive' || value === 'transit') return value;
  return 'walk';
}

function openingPenaltyMinutes(status: StoreOpeningStatus): number {
  if (status === 'open_now') return 0;
  if (status === 'closing_soon') return 12;
  if (status === 'closed') return 75;
  return 20;
}

function travelCostSek(distanceMeters: number, routeMinutes: number, mode: StoreTravelMode): number {
  if (mode === 'drive') return Number(((distanceMeters / 1000) * 3.8 + routeMinutes * 0.9).toFixed(1));
  if (mode === 'transit') return Number((routeMinutes * 0.35 + 26).toFixed(1));
  return Number((routeMinutes * 0.55).toFixed(1));
}

function routeMinutesFor(store: Pick<StoreDistanceRow, 'driveMinutes' | 'transitMinutes' | 'walkMinutes'>, mode: StoreTravelMode) {
  if (mode === 'drive') return store.driveMinutes;
  if (mode === 'transit') return store.transitMinutes;
  return store.walkMinutes;
}

function routeEstimatesFor(store: Pick<StoreDistanceRow, 'distanceMeters' | 'driveMinutes' | 'transitMinutes' | 'walkMinutes'>): StoreRouteEstimate[] {
  const distanceLabel = `${(store.distanceMeters / 1000).toFixed(1)} km`;
  return [
    { mode: 'walk', label: 'Walk', minutes: store.walkMinutes, distanceLabel },
    { mode: 'drive', label: 'Drive', minutes: store.driveMinutes, distanceLabel },
    { mode: 'transit', label: 'Transit', minutes: store.transitMinutes, distanceLabel }
  ];
}

function routeRecommendationLabel(row: Pick<StoreDistanceRow, 'openingStatus' | 'routeAwareTotalSek' | 'totalMinutes'>): string {
  if (row.openingStatus === 'closed') return 'Hold: cheapest basket is not actionable while the store is closed.';
  if (row.openingStatus === 'closing_soon') return 'Check hours: basket savings may be lost if the route misses closing time.';
  return `Recommended route candidate: ${row.totalMinutes} min and ${row.routeAwareTotalSek.toFixed(2)} SEK basket+trip total.`;
}

export function buildStoreDistanceCompare(products: ProductParam, mode: ProductParam) {
  const selectedProductIds = parseSelectedProducts(products);
  const travelMode = normalizeStoreTravelMode(mode);
  const pickupMinutes = Math.max(3, selectedProductIds.length * 2);
  const productLabel = selectedProductIds.length === 1 ? '1 selected product' : `${selectedProductIds.length || 'sample'} selected products`;
  const pricedProductCount = Math.max(selectedProductIds.length, 3);

  const rows: StoreDistanceRow[] = storeRouteSeeds
    .map((store) => {
      const routeMinutes = routeMinutesFor(store, travelMode);
      const openingPenalty = openingPenaltyMinutes(store.openingStatus);
      const basketTotalSek = Number((store.basketBaseSek + pricedProductCount * store.basketPerProductSek).toFixed(2));
      const tripCostSek = travelCostSek(store.distanceMeters, routeMinutes, travelMode);
      const routeEstimates = routeEstimatesFor(store);
      const routeAwareTotalSek = Number((basketTotalSek + tripCostSek).toFixed(2));
      const totalMinutes = routeMinutes + pickupMinutes + openingPenalty;
      const routeScore = Number((routeAwareTotalSek + totalMinutes * 1.35 + openingPenalty * 1.8).toFixed(2));
      const row = {
        ...store,
        pickupMinutes,
        routeEstimates,
        totalMinutes,
        basketTotalSek,
        travelCostSek: tripCostSek,
        routeAwareTotalSek,
        routeScore,
        openingPenaltyMinutes: openingPenalty,
        coverageLabel: `${productLabel} · route-aware sort combines distance, basket cost, and opening status`,
        recommendationLabel: '',
        routeRankInputs: [
          `${travelMode} route ${routeMinutes} min`,
          `walk ${store.walkMinutes} min · drive ${store.driveMinutes} min · transit ${store.transitMinutes} min`,
          `basket ${basketTotalSek.toFixed(2)} SEK`,
          store.openingStatusLabel
        ]
      };

      return {
        ...row,
        recommendationLabel: routeRecommendationLabel(row)
      };
    })
    .sort((left, right) => left.routeScore - right.routeScore || left.totalMinutes - right.totalMinutes || left.distanceMeters - right.distanceMeters);

  return {
    mode: travelMode,
    selectedProductIds,
    rows,
    routeRankInputs: ['walking / driving / transit route minutes', 'known basket total', 'opening status penalty'],
    summary: `${rows[0]?.storeName ?? 'No store'} is best by route-aware ${travelMode} score after combining distance, basket cost, and opening status.`
  };
}
