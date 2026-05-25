type OsmType = 'node' | 'way' | 'relation';

export type OverpassCountryCode = 'SE' | 'NO' | 'IS';

export type OverpassGroceryStore = {
  osmType: OsmType;
  osmId: number;
  country: OverpassCountryCode;
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


export type OverpassFuelGrade = '95' | '98' | 'diesel' | 'hvo100' | 'e85' | 'adblue';

export type OverpassFuelStation = {
  osmType: OsmType;
  osmId: number;
  name: string;
  brand: string;
  operator: string;
  latitude: number;
  longitude: number;
  street: string;
  houseNumber: string;
  postcode: string;
  city: string;
  openingHours: string;
  website: string;
  phone: string;
  availableFuelGrades: OverpassFuelGrade[];
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

export const SWEDISH_GROCERY_SHOP_VALUES = ['supermarket', 'convenience', 'grocery', 'greengrocer'] as const;

const SWEDISH_GROCERY_SHOP_REGEX = `^(${SWEDISH_GROCERY_SHOP_VALUES.join('|')})$`;

export const OVERPASS_COUNTRY_AREA_NAMES: Record<OverpassCountryCode, string> = {
  SE: 'Sverige',
  NO: 'Norge',
  IS: 'Ísland'
};

export const STOCKHOLM_GROCERY_OVERPASS_QUERY = `[out:json][timeout:25];
area["ISO3166-2"="SE-AB"][admin_level=4]->.searchArea;
(
  node["shop"~"${SWEDISH_GROCERY_SHOP_REGEX}"](area.searchArea);
  way["shop"~"${SWEDISH_GROCERY_SHOP_REGEX}"](area.searchArea);
  relation["shop"~"${SWEDISH_GROCERY_SHOP_REGEX}"](area.searchArea);
);
out center tags 120;`;

export function buildCountryGroceryOverpassQuery(country: OverpassCountryCode): string {
  return `[out:json][timeout:180];
area["ISO3166-1"="${country}"]["name"="${OVERPASS_COUNTRY_AREA_NAMES[country]}"][admin_level=2]->.searchArea;
(
  node["shop"~"${SWEDISH_GROCERY_SHOP_REGEX}"](area.searchArea);
  way["shop"~"${SWEDISH_GROCERY_SHOP_REGEX}"](area.searchArea);
  relation["shop"~"${SWEDISH_GROCERY_SHOP_REGEX}"](area.searchArea);
);
out center tags;`;
}

export const SWEDEN_GROCERY_OVERPASS_QUERY = buildCountryGroceryOverpassQuery('SE');

export const STOCKHOLM_FUEL_OVERPASS_QUERY = `[out:json][timeout:25];
area["ISO3166-2"="SE-AB"][admin_level=4]->.searchArea;
(
  node["amenity"="fuel"](area.searchArea);
  way["amenity"="fuel"](area.searchArea);
  relation["amenity"="fuel"](area.searchArea);
);
out center tags;`;

export const SWEDEN_FUEL_OVERPASS_QUERY = `[out:json][timeout:180];
area["ISO3166-1"="SE"][admin_level=2]->.searchArea;
(
  node["amenity"="fuel"](area.searchArea);
  way["amenity"="fuel"](area.searchArea);
  relation["amenity"="fuel"](area.searchArea);
);
out center tags;`;


export const SWEDISH_COUNTY_ISO3166_2_CODES = [
  'SE-AB', 'SE-AC', 'SE-BD', 'SE-C', 'SE-D', 'SE-E', 'SE-F', 'SE-G', 'SE-H', 'SE-I', 'SE-K', 'SE-M',
  'SE-N', 'SE-O', 'SE-S', 'SE-T', 'SE-U', 'SE-W', 'SE-X', 'SE-Y', 'SE-Z'
] as const;

export function buildSwedishCountyGroceryOverpassQuery(iso31662: typeof SWEDISH_COUNTY_ISO3166_2_CODES[number]): string {
  return `[out:json][timeout:90];
area["ISO3166-2"="${iso31662}"][admin_level=4]->.searchArea;
(
  node["shop"~"${SWEDISH_GROCERY_SHOP_REGEX}"](area.searchArea);
  way["shop"~"${SWEDISH_GROCERY_SHOP_REGEX}"](area.searchArea);
  relation["shop"~"${SWEDISH_GROCERY_SHOP_REGEX}"](area.searchArea);
);
out center tags;`;
}

export function buildSwedishCountyFuelOverpassQuery(iso31662: typeof SWEDISH_COUNTY_ISO3166_2_CODES[number]): string {
  return `[out:json][timeout:90];
area["ISO3166-2"="${iso31662}"][admin_level=4]->.searchArea;
(
  node["amenity"="fuel"](area.searchArea);
  way["amenity"="fuel"](area.searchArea);
  relation["amenity"="fuel"](area.searchArea);
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
  country?: OverpassCountryCode;
  fetchImpl?: typeof fetch;
  query?: string;
  retrievedAt?: string;
};

export async function fetchOverpassGroceryStores(options: FetchOverpassGroceryStoresOptions = {}): Promise<OverpassGroceryStore[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const country = options.country ?? 'SE';
  const query = options.query ?? buildCountryGroceryOverpassQuery(country);
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
  return parseOverpassGroceryStores(payload, retrievedAt, country);
}

export function parseOverpassGroceryStores(
  payload: OverpassResponse,
  retrievedAt: string,
  country: OverpassCountryCode = 'SE'
): OverpassGroceryStore[] {
  return (payload.elements ?? [])
    .map((element) => normalizeOverpassElement(element, retrievedAt, country))
    .filter((store): store is OverpassGroceryStore => store !== null);
}

export function normalizeOverpassElement(
  element: OverpassElement,
  retrievedAt: string,
  country: OverpassCountryCode = 'SE'
): OverpassGroceryStore | null {
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
    country,
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

export type FetchOverpassFuelStationsOptions = {
  fetchImpl?: typeof fetch;
  query?: string;
  retrievedAt?: string;
};

export async function fetchOverpassFuelStations(options: FetchOverpassFuelStationsOptions = {}): Promise<OverpassFuelStation[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const query = options.query ?? STOCKHOLM_FUEL_OVERPASS_QUERY;
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
    throw new Error(`Overpass fuel station request failed: ${response.status}`);
  }

  const payload = await response.json() as OverpassResponse;
  return parseOverpassFuelStations(payload, retrievedAt);
}

export function parseOverpassFuelStations(payload: OverpassResponse, retrievedAt: string): OverpassFuelStation[] {
  return (payload.elements ?? [])
    .map((element) => normalizeOverpassFuelStationElement(element, retrievedAt))
    .filter((station): station is OverpassFuelStation => station !== null);
}

export function normalizeOverpassFuelStationElement(element: OverpassElement, retrievedAt: string): OverpassFuelStation | null {
  const osmType = asOsmType(element.type);
  const osmId = typeof element.id === 'number' ? element.id : null;
  const tags = element.tags ?? {};
  const latitude = numberOrNull(element.lat) ?? numberOrNull(element.center?.lat);
  const longitude = numberOrNull(element.lon) ?? numberOrNull(element.center?.lon);
  const amenity = text(tags.amenity);
  const name = text(tags.name) || text(tags.brand) || text(tags.operator);

  if (!osmType || osmId === null || latitude === null || longitude === null || amenity !== 'fuel' || !name) {
    return null;
  }

  return {
    osmType,
    osmId,
    name,
    brand: text(tags.brand) || text(tags.operator) || name,
    operator: text(tags.operator),
    latitude,
    longitude,
    street: text(tags['addr:street']),
    houseNumber: text(tags['addr:housenumber']),
    postcode: text(tags['addr:postcode']),
    city: text(tags['addr:city']),
    openingHours: text(tags.opening_hours),
    website: text(tags.website) || text(tags['contact:website']),
    phone: text(tags.phone) || text(tags['contact:phone']),
    availableFuelGrades: availableFuelGradesFor(tags),
    sourceUrl: OVERPASS_INTERPRETER_URL,
    retrievedAt
  };
}

function availableFuelGradesFor(tags: Record<string, unknown>): OverpassFuelGrade[] {
  const candidates: Array<[OverpassFuelGrade, string[]]> = [
    ['95', ['fuel:octane_95', 'fuel:95']],
    ['98', ['fuel:octane_98', 'fuel:98']],
    ['diesel', ['fuel:diesel']],
    ['hvo100', ['fuel:hvo100', 'fuel:HVO100']],
    ['e85', ['fuel:e85', 'fuel:E85']],
    ['adblue', ['fuel:adblue', 'fuel:AdBlue']]
  ];
  return candidates
    .filter(([, keys]) => keys.some((key) => truthyTag(tags[key])))
    .map(([grade]) => grade);
}

function truthyTag(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return ['yes', 'true', '1'].includes(value.trim().toLowerCase());
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
