type OsmType = 'node' | 'way' | 'relation';

export type SwedishPharmacyChain = 'apoteket' | 'hjartat' | 'kronans' | 'lloyds' | 'unknown';

export type SwedishPharmacyPoi = {
  osmType: OsmType;
  osmId: number;
  name: string;
  brand: string;
  operator: string;
  amenity: 'pharmacy';
  chain: SwedishPharmacyChain;
  chain_type: 'pharmacy';
  latitude: number;
  longitude: number;
  street: string;
  houseNumber: string;
  postcode: string;
  city: string;
  openingHours: string;
  website: string;
  phone: string;
  sourceUrl: string;
  retrievedAt: string;
};

type OverpassElement = {
  type?: unknown;
  id?: unknown;
  lat?: unknown;
  lon?: unknown;
  center?: { lat?: unknown; lon?: unknown };
  tags?: Record<string, unknown>;
};

type OverpassResponse = { elements?: OverpassElement[] };

export const SE_PHARMACY_POIS_OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
export const SE_PHARMACY_POIS_OVERPASS_QUERY = `[out:json][timeout:180];
area["ISO3166-1"="SE"][admin_level=2]->.searchArea;
(
  node["amenity"="pharmacy"](area.searchArea);
  way["amenity"="pharmacy"](area.searchArea);
  relation["amenity"="pharmacy"](area.searchArea);
);
out center tags;`;

export type FetchSwedishPharmacyPoisOptions = {
  fetchImpl?: typeof fetch;
  query?: string;
  retrievedAt?: string;
};

export async function fetchSwedishPharmacyPois(options: FetchSwedishPharmacyPoisOptions = {}): Promise<SwedishPharmacyPoi[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const query = options.query ?? SE_PHARMACY_POIS_OVERPASS_QUERY;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const response = await fetchImpl(SE_PHARMACY_POIS_OVERPASS_URL, {
    method: 'POST',
    body: new URLSearchParams({ data: query }),
    headers: {
      accept: 'application/json',
      'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'user-agent': 'GroceryView/0.1 SE pharmacy POIs (https://github.com/SzeChunYiu/GroceryView)'
    }
  });

  if (!response.ok) throw new Error(`Overpass SE pharmacy POI request failed: ${response.status}`);
  return parseSwedishPharmacyPois(await response.json() as OverpassResponse, retrievedAt);
}

export function parseSwedishPharmacyPois(payload: OverpassResponse, retrievedAt: string): SwedishPharmacyPoi[] {
  return (payload.elements ?? [])
    .map((element) => normalizeSwedishPharmacyPoi(element, retrievedAt))
    .filter((poi): poi is SwedishPharmacyPoi => poi !== null);
}

export function normalizeSwedishPharmacyPoi(element: OverpassElement, retrievedAt: string): SwedishPharmacyPoi | null {
  const osmType = asOsmType(element.type);
  const osmId = typeof element.id === 'number' ? element.id : null;
  const tags = element.tags ?? {};
  const latitude = numberOrNull(element.lat) ?? numberOrNull(element.center?.lat);
  const longitude = numberOrNull(element.lon) ?? numberOrNull(element.center?.lon);

  if (!osmType || osmId === null || latitude === null || longitude === null || text(tags.amenity) !== 'pharmacy') return null;

  const brand = text(tags.brand);
  const operator = text(tags.operator);
  const name = text(tags.name) || brand || operator;
  if (!name) return null;

  return {
    osmType,
    osmId,
    name,
    brand,
    operator,
    amenity: 'pharmacy',
    chain: matchSwedishPharmacyChain([brand, name, operator]),
    chain_type: 'pharmacy',
    latitude,
    longitude,
    street: text(tags['addr:street']),
    houseNumber: text(tags['addr:housenumber']),
    postcode: text(tags['addr:postcode']),
    city: text(tags['addr:city']),
    openingHours: text(tags.opening_hours),
    website: text(tags.website) || text(tags['contact:website']),
    phone: text(tags.phone) || text(tags['contact:phone']),
    sourceUrl: SE_PHARMACY_POIS_OVERPASS_URL,
    retrievedAt
  };
}

export function matchSwedishPharmacyChain(values: unknown[]): SwedishPharmacyChain {
  const haystack = values.map(text).join(' ').toLocaleLowerCase('sv-SE');
  if (/apotek\s*hj[aä]rtat|hj[aä]rtat/.test(haystack)) return 'hjartat';
  if (/kronans/.test(haystack)) return 'kronans';
  if (/lloyds/.test(haystack)) return 'lloyds';
  if (/apoteket/.test(haystack)) return 'apoteket';
  return 'unknown';
}

function asOsmType(value: unknown): OsmType | null {
  return value === 'node' || value === 'way' || value === 'relation' ? value : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
