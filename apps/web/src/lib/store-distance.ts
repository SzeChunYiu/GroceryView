export type StoreTravelMode = 'walk' | 'drive';

type StoreAnchor = {
  chainId: string;
  chainLabel: string;
  storeName: string;
  address: string;
  latitude: number;
  longitude: number;
};

type ChainAvailability = {
  chainId: string;
  selectedProductCount: number;
};

export type StoreDistanceRanking = StoreAnchor & {
  distanceKm: number;
  routeMinutes: number;
  selectedProductCount: number;
  travelMode: StoreTravelMode;
};

const CITY_ORIGIN = { latitude: 59.33258, longitude: 18.0649 };

const STORE_ANCHORS: StoreAnchor[] = [
  { chainId: 'ica', chainLabel: 'ICA', storeName: 'ICA Kvantum Liljeholmen', address: 'Liljeholmstorget, Stockholm', latitude: 59.3099, longitude: 18.0224 },
  { chainId: 'willys', chainLabel: 'Willys', storeName: 'Willys Hemma Stockholm City', address: 'Torsgatan, Stockholm', latitude: 59.3372, longitude: 18.0468 },
  { chainId: 'coop', chainLabel: 'Coop', storeName: 'Coop Sveavägen', address: 'Sveavägen, Stockholm', latitude: 59.3438, longitude: 18.0579 },
  { chainId: 'hemkop', chainLabel: 'Hemköp', storeName: 'Hemköp City', address: 'Åhléns City, Stockholm', latitude: 59.332, longitude: 18.0622 }
];

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceKm(from: typeof CITY_ORIGIN, to: StoreAnchor) {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
}

function routeMinutes(km: number, mode: StoreTravelMode) {
  if (mode === 'walk') {
    return Math.round(1 + ((km * 1.25) / 4.8) * 60);
  }
  return Math.round(4 + ((km * 1.35) / 28) * 60);
}

export function parseStoreTravelMode(value: string | string[] | undefined): StoreTravelMode {
  const mode = Array.isArray(value) ? value[0] : value;
  return mode === 'drive' ? 'drive' : 'walk';
}

export function buildStoreDistanceRankings(mode: StoreTravelMode, availability: ChainAvailability[]): StoreDistanceRanking[] {
  const counts = new Map(availability.map((item) => [item.chainId, item.selectedProductCount]));

  return STORE_ANCHORS.map((store) => {
    const km = distanceKm(CITY_ORIGIN, store);
    return {
      ...store,
      distanceKm: Number(km.toFixed(1)),
      routeMinutes: routeMinutes(km, mode),
      selectedProductCount: counts.get(store.chainId) ?? 0,
      travelMode: mode
    };
  })
    .filter((store) => store.selectedProductCount > 0)
    .sort((a, b) => a.routeMinutes - b.routeMinutes || b.selectedProductCount - a.selectedProductCount || a.storeName.localeCompare(b.storeName));
}
