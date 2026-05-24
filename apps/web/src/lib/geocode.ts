export type GeocodableStore = {
  slug: string;
  name: string;
  brand: string;
  address: string;
  city: string;
  district: string;
  lat: number;
  lng: number;
};

export type GeocodeResult = {
  label: string;
  lat: number;
  lng: number;
  matchedBy: 'postcode' | 'address' | 'city';
};

export type NearbyStore = GeocodableStore & {
  distanceKm: number;
};

function normalize(value: string) {
  return value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function postcode(value: string) {
  return value.match(/\b\d{3}\s?\d{2}\b/)?.[0].replace(/\s/g, '') ?? null;
}

function averageLocation(stores: GeocodableStore[]) {
  const located = stores.filter((store) => Number.isFinite(store.lat) && Number.isFinite(store.lng));
  if (located.length === 0) return null;
  return {
    lat: located.reduce((sum, store) => sum + store.lat, 0) / located.length,
    lng: located.reduce((sum, store) => sum + store.lng, 0) / located.length
  };
}

function storeSearchText(store: GeocodableStore) {
  return normalize([store.name, store.brand, store.address, store.city, store.district].filter(Boolean).join(' '));
}

export function geocodeAddress(query: string, stores: GeocodableStore[]): GeocodeResult | null {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return null;

  const queryPostcode = postcode(query);
  if (queryPostcode) {
    const postcodeMatches = stores.filter((store) => postcode(store.address) === queryPostcode);
    const centre = averageLocation(postcodeMatches);
    if (centre) return { ...centre, label: queryPostcode.replace(/^(\d{3})(\d{2})$/, '$1 $2'), matchedBy: 'postcode' };
  }

  const cityMatches = stores.filter((store) => normalize(store.city) === normalizedQuery || normalize(store.district) === normalizedQuery);
  const cityCentre = averageLocation(cityMatches);
  if (cityCentre) return { ...cityCentre, label: cityMatches[0]?.city || cityMatches[0]?.district || query, matchedBy: 'city' };

  const addressMatches = stores.filter((store) => storeSearchText(store).includes(normalizedQuery));
  const addressCentre = averageLocation(addressMatches);
  if (addressCentre) {
    return {
      ...addressCentre,
      label: addressMatches[0]?.address || addressMatches[0]?.name || query,
      matchedBy: 'address'
    };
  }

  return null;
}

export function distanceKm(from: Pick<GeocodeResult, 'lat' | 'lng'>, to: Pick<GeocodableStore, 'lat' | 'lng'>) {
  const radiusKm = 6371;
  const toRad = (degrees: number) => degrees * Math.PI / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function nearbyStores(origin: Pick<GeocodeResult, 'lat' | 'lng'>, stores: GeocodableStore[], limit = 8): NearbyStore[] {
  return stores
    .filter((store) => Number.isFinite(store.lat) && Number.isFinite(store.lng))
    .map((store) => ({ ...store, distanceKm: distanceKm(origin, store) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}
