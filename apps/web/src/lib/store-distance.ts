export type StoreTravelMode = 'walk' | 'drive';

type ProductParam = string | string[] | undefined;

export type StoreDistanceRow = {
  id: string;
  storeName: string;
  chainName: string;
  areaLabel: string;
  distanceMeters: number;
  walkMinutes: number;
  driveMinutes: number;
  pickupMinutes: number;
  totalMinutes: number;
  coverageLabel: string;
};

const storeRouteSeeds = [
  { id: 'willys-triangeln', storeName: 'Willys Triangeln', chainName: 'Willys', areaLabel: 'Triangeln', distanceMeters: 450, walkMinutes: 6, driveMinutes: 4 },
  { id: 'hemkop-city', storeName: 'Hemköp City', chainName: 'Hemköp', areaLabel: 'City', distanceMeters: 850, walkMinutes: 11, driveMinutes: 5 },
  { id: 'ica-malmborgs', storeName: 'ICA Malmborgs', chainName: 'ICA', areaLabel: 'Caroli', distanceMeters: 1200, walkMinutes: 16, driveMinutes: 7 },
  { id: 'coop-centralen', storeName: 'Coop Centralen', chainName: 'Coop', areaLabel: 'Centralen', distanceMeters: 1500, walkMinutes: 20, driveMinutes: 8 }
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
  return firstParam(mode) === 'drive' ? 'drive' : 'walk';
}

export function buildStoreDistanceCompare(products: ProductParam, mode: ProductParam) {
  const selectedProductIds = parseSelectedProducts(products);
  const travelMode = normalizeStoreTravelMode(mode);
  const pickupMinutes = Math.max(3, selectedProductIds.length * 2);
  const productLabel = selectedProductIds.length === 1 ? '1 selected product' : `${selectedProductIds.length || 'sample'} selected products`;

  const rows: StoreDistanceRow[] = storeRouteSeeds
    .map((store) => {
      const routeMinutes = travelMode === 'drive' ? store.driveMinutes : store.walkMinutes;
      return {
        ...store,
        pickupMinutes,
        totalMinutes: routeMinutes + pickupMinutes,
        coverageLabel: `${productLabel} · ${store.chainName} route-time sort`
      };
    })
    .sort((left, right) => left.totalMinutes - right.totalMinutes || left.distanceMeters - right.distanceMeters);

  return {
    mode: travelMode,
    selectedProductIds,
    rows,
    summary: `${rows[0]?.storeName ?? 'No store'} is fastest by estimated ${travelMode} time for this basket.`
  };
}
