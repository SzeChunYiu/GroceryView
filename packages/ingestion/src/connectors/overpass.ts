export type OverpassGroceryStore = {
  osmType: 'node' | 'way' | 'relation';
  osmId: number;
  name: string;
  brand: string;
  shop: string;
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

type OverpassResponse = {
  elements?: OverpassElement[];
};

export const OVERPASS_INTERPRETER_URL = 'https://overpass-api.de/api/interpreter';

export const STOCKHOLM_GROCERY_OVERPASS_QUERY = `[out:json][timeout:25];
area["ISO3166-2"="SE-AB"][admin_level=4]->.searchArea;
(
  node["shop"~"^(supermarket|convenience|grocery)$"](area.searchArea);
  way["shop"~"^(supermarket|convenience|grocery)$"](area.searchArea);
  relation["shop"~"^(supermarket|convenience|grocery)$"](area.searchArea);
);
out center tags 120;`;

export const SWEDEN_GROCERY_OVERPASS_QUERY = `[out:json][timeout:180];
area["ISO3166-1"="SE"][admin_level=2]->.searchArea;
(
  node["shop"~"^(supermarket|convenience|grocery)$"](area.searchArea);
  way["shop"~"^(supermarket|convenience|grocery)$"](area.searchArea);
  relation["shop"~"^(supermarket|convenience|grocery)$"](area.searchArea);
);
out center tags;`;


export const SWEDISH_COUNTY_ISO3166_2_CODES = [
  'SE-AB', 'SE-AC', 'SE-BD', 'SE-C', 'SE-D', 'SE-E', 'SE-F', 'SE-G', 'SE-H', 'SE-I', 'SE-K', 'SE-M',
  'SE-N', 'SE-O', 'SE-S', 'SE-T', 'SE-U', 'SE-W', 'SE-X', 'SE-Y', 'SE-Z'
] as const;

export const SWEDISH_GROCERY_SHOP_VALUES = ['supermarket', 'convenience', 'grocery'] as const;

export function buildSwedishCountyGroceryOverpassQuery(iso31662: typeof SWEDISH_COUNTY_ISO3166_2_CODES[number]): string {
  return `[out:json][timeout:90];
area["ISO3166-2"="${iso31662}"][admin_level=4]->.searchArea;
(
  node["shop"~"^(supermarket|convenience|grocery)$"](area.searchArea);
  way["shop"~"^(supermarket|convenience|grocery)$"](area.searchArea);
  relation["shop"~"^(supermarket|convenience|grocery)$"](area.searchArea);
);
out center tags;`;
}

export function buildSwedishCountyGroceryShopOverpassQuery(
  iso31662: typeof SWEDISH_COUNTY_ISO3166_2_CODES[number],
  shop: typeof SWEDISH_GROCERY_SHOP_VALUES[number]
): string {
  return `[out:json][timeout:90];
area["ISO3166-2"="${iso31662}"][admin_level=4]->.searchArea;
(
  node["shop"="${shop}"](area.searchArea);
  way["shop"="${shop}"](area.searchArea);
  relation["shop"="${shop}"](area.searchArea);
);
out center tags;`;
}

export type FetchOverpassGroceryStoresOptions = {
  fetchImpl?: typeof fetch;
  query?: string;
  retrievedAt?: string;
};

export async function fetchOverpassGroceryStores(options: FetchOverpassGroceryStoresOptions = {}): Promise<OverpassGroceryStore[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const query = options.query ?? STOCKHOLM_GROCERY_OVERPASS_QUERY;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const body = new URLSearchParams({ data: query });
  const response = await fetchImpl(OVERPASS_INTERPRETER_URL, {
    method: 'POST',
    body,
    headers: {
      accept: 'application/json',
      'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  });

  if (!response.ok) {
    throw new Error(`Overpass request failed: ${response.status}`);
  }

  const payload = await response.json() as OverpassResponse;
  return parseOverpassGroceryStores(payload, retrievedAt);
}

export function parseOverpassGroceryStores(payload: OverpassResponse, retrievedAt: string): OverpassGroceryStore[] {
  return (payload.elements ?? [])
    .map((element) => normalizeOverpassElement(element, retrievedAt))
    .filter((store): store is OverpassGroceryStore => store !== null);
}

export function normalizeOverpassElement(element: OverpassElement, retrievedAt: string): OverpassGroceryStore | null {
  const osmType = asOsmType(element.type);
  const osmId = typeof element.id === 'number' ? element.id : null;
  const tags = element.tags ?? {};
  const latitude = numberOrNull(element.lat) ?? numberOrNull(element.center?.lat);
  const longitude = numberOrNull(element.lon) ?? numberOrNull(element.center?.lon);
  const name = text(tags.name) || text(tags.brand) || text(tags.operator);
  const shop = text(tags.shop);

  if (!osmType || osmId === null || latitude === null || longitude === null || !name || !shop) {
    return null;
  }

  return {
    osmType,
    osmId,
    name,
    brand: text(tags.brand) || text(tags.operator) || name,
    shop,
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

function asOsmType(value: unknown): OverpassGroceryStore['osmType'] | null {
  return value === 'node' || value === 'way' || value === 'relation' ? value : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
