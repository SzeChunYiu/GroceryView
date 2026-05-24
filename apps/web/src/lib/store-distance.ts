export const DEFAULT_MAX_STORE_DISTANCE_KM = 5;
export const STORE_DISTANCE_OPTIONS_KM = [1, 2, 5, 10, 25];

export type StoreCoordinate = {
  lat: number;
  lng: number;
};

export type StoreDistanceResult<TStore extends StoreCoordinate> = {
  store: TStore;
  distanceKm: number;
};

const earthRadiusKm = 6371;

function toRadians(degrees: number) {
  return degrees * (Math.PI / 180);
}

export function distanceBetweenStoresKm(origin: StoreCoordinate, store: StoreCoordinate) {
  const latitudeDelta = toRadians(store.lat - origin.lat);
  const longitudeDelta = toRadians(store.lng - origin.lng);
  const originLatitude = toRadians(origin.lat);
  const storeLatitude = toRadians(store.lat);

  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(originLatitude) * Math.cos(storeLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(haversine));
}

export function normalizeMaxStoreDistanceKm(value: string | undefined) {
  const parsedValue = Number(value);
  return STORE_DISTANCE_OPTIONS_KM.includes(parsedValue) ? parsedValue : DEFAULT_MAX_STORE_DISTANCE_KM;
}

export function nearestStoresWithinDistance<TStore extends StoreCoordinate>(
  stores: readonly TStore[],
  origin: StoreCoordinate | null,
  maxDistanceKm: number,
  limit = 6
): StoreDistanceResult<TStore>[] {
  if (!origin) return [];

  return stores
    .map((store) => ({
      store,
      distanceKm: distanceBetweenStoresKm(origin, store)
    }))
    .filter(({ distanceKm }) => distanceKm <= maxDistanceKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}
