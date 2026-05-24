export type GeocodeResult = {
  label: string;
  lat: number;
  lng: number;
};

export type GeocodableStore = {
  slug: string;
  name: string;
  brand: string;
  address?: string;
  city?: string;
  district?: string;
  lat?: number | null;
  lng?: number | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type NearbyStore = GeocodableStore & {
  distanceKm: number;
};

type NominatimRow = {
  display_name?: string;
  lat?: string;
  lon?: string;
};

export async function geocodeAddress(query: string, fetcher: typeof fetch = fetch): Promise<GeocodeResult | null> {
  const normalized = query.trim();
  if (!normalized) return null;

  const params = new URLSearchParams({
    countrycodes: 'se',
    format: 'jsonv2',
    limit: '1',
    q: normalized
  });
  const response = await fetcher(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: { Accept: 'application/json' }
  });
  if (!response.ok) throw new Error('geocode_failed');

  const rows = await response.json() as NominatimRow[];
  const row = rows[0];
  const lat = Number(row?.lat);
  const lng = Number(row?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    label: row.display_name ?? normalized,
    lat,
    lng
  };
}

export function storeCoordinates(store: GeocodableStore): GeocodeResult | null {
  const lat = typeof store.lat === 'number' ? store.lat : store.latitude;
  const lng = typeof store.lng === 'number' ? store.lng : store.longitude;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { label: store.name, lat: lat as number, lng: lng as number };
}

export function distanceKm(from: GeocodeResult, to: GeocodeResult) {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const fromLat = toRadians(from.lat);
  const toLat = toRadians(to.lat);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(fromLat) * Math.cos(toLat) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function nearbyStores(stores: GeocodableStore[], origin: GeocodeResult, limit = 8): NearbyStore[] {
  return stores
    .map((store) => {
      const coordinates = storeCoordinates(store);
      return coordinates ? { ...store, distanceKm: distanceKm(origin, coordinates) } : null;
    })
    .filter((store): store is NearbyStore => store !== null)
    .sort((left, right) => left.distanceKm - right.distanceKm)
    .slice(0, limit);
}
