const DEFAULT_ROUTE_ORIGIN = {
  label: 'Stockholm Central sample origin',
  lat: 59.33077,
  lng: 18.0591
};

const WALKING_KMH = 5;
const CAR_KMH = 38;

type RouteStore = {
  lat: number;
  lng: number;
};

export type StoreRouteEstimate = {
  originLabel: string;
  distanceKm: number;
  walkingMinutes: number;
  drivingMinutes: number;
  fastestMode: 'walk' | 'drive';
  fastestMinutes: number;
  routeLabel: string;
};

export type RouteRankedStore<T> = {
  store: T;
  route: StoreRouteEstimate;
};

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function estimateDistanceKm(store: RouteStore) {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(store.lat - DEFAULT_ROUTE_ORIGIN.lat);
  const deltaLng = toRadians(store.lng - DEFAULT_ROUTE_ORIGIN.lng);
  const originLat = toRadians(DEFAULT_ROUTE_ORIGIN.lat);
  const storeLat = toRadians(store.lat);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(originLat) * Math.cos(storeLat) * Math.sin(deltaLng / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function estimateStoreRoute(store: RouteStore): StoreRouteEstimate {
  const distanceKm = estimateDistanceKm(store);
  const walkingMinutes = Math.round((distanceKm / WALKING_KMH) * 60);
  const drivingMinutes = Math.round((distanceKm / CAR_KMH) * 60 + 5);
  const fastestMode = walkingMinutes <= drivingMinutes ? 'walk' : 'drive';
  const fastestMinutes = fastestMode === 'walk' ? walkingMinutes : drivingMinutes;

  return {
    originLabel: DEFAULT_ROUTE_ORIGIN.label,
    distanceKm,
    walkingMinutes,
    drivingMinutes,
    fastestMode,
    fastestMinutes,
    routeLabel: `${fastestMode === 'walk' ? 'Walk' : 'Drive'} ${fastestMinutes} min · ${distanceKm.toFixed(1)} km`
  };
}

export function createRouteRankedStores<T extends RouteStore>(stores: readonly T[]): RouteRankedStore<T>[] {
  return stores
    .map((store) => ({
      store,
      route: estimateStoreRoute(store)
    }))
    .sort((a, b) => a.route.fastestMinutes - b.route.fastestMinutes || a.route.distanceKm - b.route.distanceKm);
}
