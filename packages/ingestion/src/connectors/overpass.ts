type OsmType = 'node' | 'way' | 'relation';

export type OverpassGroceryStore = {
  osmType: OsmType;
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

export type OverpassPoiAuditKind = 'shop' | 'amenity';

export type OverpassPoiAudit = {
  osmType: OsmType;
  osmId: number;
  name: string;
  brand: string;
  operator: string;
  kind: OverpassPoiAuditKind;
  category: string;
  latitude: number;
  longitude: number;
  street: string;
  houseNumber: string;
  postcode: string;
  city: string;
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

export const SWEDEN_POI_AUDIT_OVERPASS_QUERY = `[out:json][timeout:180];
area["ISO3166-1"="SE"][admin_level=2]->.searchArea;
(
  node["shop"~"^(supermarket|convenience|grocery|deli|greengrocer|butcher|bakery)$"](area.searchArea);
  way["shop"~"^(supermarket|convenience|grocery|deli|greengrocer|butcher|bakery)$"](area.searchArea);
  relation["shop"~"^(supermarket|convenience|grocery|deli|greengrocer|butcher|bakery)$"](area.searchArea);
  node["amenity"~"^(pharmacy|fuel)$"](area.searchArea);
  way["amenity"~"^(pharmacy|fuel)$"](area.searchArea);
  relation["amenity"~"^(pharmacy|fuel)$"](area.searchArea);
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

export type FetchOverpassPoiAuditOptions = {
  fetchImpl?: typeof fetch;
  query?: string;
  retrievedAt?: string;
};

export async function fetchOverpassPoiAudit(options: FetchOverpassPoiAuditOptions = {}): Promise<OverpassPoiAudit[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const query = options.query ?? SWEDEN_POI_AUDIT_OVERPASS_QUERY;
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
    throw new Error(`Overpass POI audit request failed: ${response.status}`);
  }

  const payload = await response.json() as OverpassResponse;
  return parseOverpassPoiAudit(payload, retrievedAt);
}

export function parseOverpassPoiAudit(payload: OverpassResponse, retrievedAt: string): OverpassPoiAudit[] {
  return (payload.elements ?? [])
    .map((element) => normalizeOverpassPoiAuditElement(element, retrievedAt))
    .filter((poi): poi is OverpassPoiAudit => poi !== null);
}

export function normalizeOverpassPoiAuditElement(element: OverpassElement, retrievedAt: string): OverpassPoiAudit | null {
  const osmType = asOsmType(element.type);
  const osmId = typeof element.id === 'number' ? element.id : null;
  const tags = element.tags ?? {};
  const latitude = numberOrNull(element.lat) ?? numberOrNull(element.center?.lat);
  const longitude = numberOrNull(element.lon) ?? numberOrNull(element.center?.lon);
  const shop = text(tags.shop);
  const amenity = text(tags.amenity);
  const kind: OverpassPoiAuditKind | null = shop ? 'shop' : amenity ? 'amenity' : null;
  const category = shop || amenity;
  const name = text(tags.name) || text(tags.brand) || text(tags.operator) || `${category} ${osmType}/${osmId}`;

  if (!osmType || osmId === null || latitude === null || longitude === null || !kind || !category) {
    return null;
  }

  return {
    osmType,
    osmId,
    name,
    brand: text(tags.brand),
    operator: text(tags.operator),
    kind,
    category,
    latitude,
    longitude,
    street: text(tags['addr:street']),
    houseNumber: text(tags['addr:housenumber']),
    postcode: text(tags['addr:postcode']),
    city: text(tags['addr:city']),
    sourceUrl: OVERPASS_INTERPRETER_URL,
    retrievedAt
  };
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
