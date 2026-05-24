type OsmType = 'node' | 'way' | 'relation';

type OverpassElement = {
  type?: unknown;
  id?: unknown;
  lat?: unknown;
  lon?: unknown;
  center?: { lat?: unknown; lon?: unknown };
  tags?: Record<string, unknown>;
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

export type SwedishPharmacyChain = 'apoteket' | 'hjartat' | 'kronans' | 'lloyds' | 'unknown';

export type SwedishPharmacyPoi = {
  osmType: OsmType;
  osmId: number;
  name: string;
  brand: string;
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

export type FetchSwedishPharmacyPoisOptions = {
  fetchImpl?: typeof fetch;
  query?: string;
  retrievedAt?: string;
};

export const OVERPASS_INTERPRETER_URL = 'https://overpass-api.de/api/interpreter';

export const SWEDEN_PHARMACY_POIS_OVERPASS_QUERY = `[out:json][timeout:180];
(
  node["amenity"="pharmacy"](55.0,10.0,69.1,24.2);
  way["amenity"="pharmacy"](55.0,10.0,69.1,24.2);
  relation["amenity"="pharmacy"](55.0,10.0,69.1,24.2);
);
out center tags;`;

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asOsmType(value: unknown): OsmType | null {
  return value === 'node' || value === 'way' || value === 'relation' ? value : null;
}

function normalizeName(value: string): string {
  return value
    .toLocaleLowerCase('sv-SE')
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function matchSwedishPharmacyChain(name: string): SwedishPharmacyChain {
  const normalized = normalizeName(name);
  if (/\bapoteket\b/.test(normalized)) return 'apoteket';
  if (/\b(apotek\s*)?hjartat\b/.test(normalized)) return 'hjartat';
  if (/\bkronans\b/.test(normalized)) return 'kronans';
  if (/\blloyds\b/.test(normalized)) return 'lloyds';
  return 'unknown';
}

export async function fetchSwedishPharmacyPois(options: FetchSwedishPharmacyPoisOptions = {}): Promise<SwedishPharmacyPoi[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const query = options.query ?? SWEDEN_PHARMACY_POIS_OVERPASS_QUERY;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const response = await fetchImpl(OVERPASS_INTERPRETER_URL, {
    method: 'POST',
    body: new URLSearchParams({ data: query }),
    headers: {
      accept: 'application/json',
      'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  });

  if (!response.ok) {
    throw new Error(`Overpass pharmacy POI request failed: ${response.status}`);
  }

  const payload = await response.json() as OverpassResponse;
  return parseSwedishPharmacyPois(payload, retrievedAt);
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
  const amenity = text(tags.amenity);
  const name = text(tags.name) || text(tags.brand) || text(tags.operator);

  if (!osmType || osmId === null || latitude === null || longitude === null || amenity !== 'pharmacy' || !name) {
    return null;
  }

  const brand = text(tags.brand) || text(tags.operator) || name;
  const chain = matchSwedishPharmacyChain(`${brand} ${name}`);

  return {
    osmType,
    osmId,
    name,
    brand,
    chain,
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
    sourceUrl: OVERPASS_INTERPRETER_URL,
    retrievedAt
  };
}
