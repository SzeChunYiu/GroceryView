export type NearbyRankerUser = {
  home_lat: number;
  home_lng: number;
};

export type NearbyRankerStore = {
  storeId: string;
  lat: number;
  lng: number;
};

export type NearbyRankerPromo = {
  storeId: string;
  savings: number;
};

export type NearbyRankerInput<TPromo extends NearbyRankerPromo> = {
  user: NearbyRankerUser;
  promos: readonly TPromo[];
  stores: readonly NearbyRankerStore[];
  maxDistanceKm?: number;
  max_distance_km?: number;
};

export type RankedNearbyPromo<TPromo extends NearbyRankerPromo> = TPromo & {
  distance_km: number;
  distanceKm: number;
  score: number;
};

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

function assertCoordinate(value: number, fieldName: string, min: number, max: number): void {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${fieldName} must be a finite coordinate between ${min} and ${max}.`);
  }
}

function configuredMaxDistanceKm(input: { maxDistanceKm?: number; max_distance_km?: number }): number {
  const maxDistanceKm = input.maxDistanceKm ?? input.max_distance_km;
  if (maxDistanceKm === undefined || !Number.isFinite(maxDistanceKm) || maxDistanceKm < 0) {
    throw new Error('maxDistanceKm must be a non-negative finite number.');
  }

  return maxDistanceKm;
}

export function nearbyDistanceKm(fromLat: number, fromLng: number, toLat: number, toLng: number): number {
  assertCoordinate(fromLat, 'fromLat', -90, 90);
  assertCoordinate(toLat, 'toLat', -90, 90);
  assertCoordinate(fromLng, 'fromLng', -180, 180);
  assertCoordinate(toLng, 'toLng', -180, 180);

  const deltaLat = toRadians(toLat - fromLat);
  const deltaLng = toRadians(toLng - fromLng);
  const fromLatRad = toRadians(fromLat);
  const toLatRad = toRadians(toLat);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(fromLatRad) * Math.cos(toLatRad) * Math.sin(deltaLng / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
}

export function rankNearbyPromos<TPromo extends NearbyRankerPromo>(input: NearbyRankerInput<TPromo>): RankedNearbyPromo<TPromo>[] {
  assertCoordinate(input.user.home_lat, 'user.home_lat', -90, 90);
  assertCoordinate(input.user.home_lng, 'user.home_lng', -180, 180);
  const maxDistanceKm = configuredMaxDistanceKm(input);

  const storesById = new Map<string, NearbyRankerStore>();
  for (const store of input.stores) {
    assertCoordinate(store.lat, `store ${store.storeId} lat`, -90, 90);
    assertCoordinate(store.lng, `store ${store.storeId} lng`, -180, 180);
    storesById.set(store.storeId, store);
  }

  return input.promos
    .flatMap((promo): RankedNearbyPromo<TPromo>[] => {
      if (!Number.isFinite(promo.savings)) return [];
      const store = storesById.get(promo.storeId);
      if (!store) return [];

      const distance_km = nearbyDistanceKm(input.user.home_lat, input.user.home_lng, store.lat, store.lng);
      if (distance_km > maxDistanceKm) return [];

      return [
        {
          ...promo,
          distance_km,
          distanceKm: distance_km,
          score: promo.savings * Math.exp(-distance_km / 5)
        }
      ];
    })
    .sort((a, b) => b.score - a.score || a.distance_km - b.distance_km || b.savings - a.savings);
}

export const rankNearbyPromotions = rankNearbyPromos;
export default rankNearbyPromos;
