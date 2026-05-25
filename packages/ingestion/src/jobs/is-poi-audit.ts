type OsmType = 'node' | 'way' | 'relation';

export type IcelandPoiDomain = 'grocery' | 'pharmacy' | 'fuel';

export type IcelandPoiChain =
  | 'bonus'
  | 'kronan'
  | 'netto'
  | 'hagkaup'
  | 'krambudin'
  | '10-11'
  | 'lyfja'
  | 'lyfogheilsa'
  | 'apotekid'
  | 'n1'
  | 'ob'
  | 'orkan'
  | 'olis'
  | 'atlantsolia'
  | 'unknown';

export type IcelandPoiAuditRow = {
  osmType: OsmType;
  osmId: number;
  name: string;
  brand: string;
  operator: string;
  domain: IcelandPoiDomain;
  chain: IcelandPoiChain;
  shop: string;
  amenity: string;
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

export const IS_POI_AUDIT_OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
export const ICELAND_OVERPASS_BBOX = {
  south: 63.08,
  west: -25.0,
  north: 66.75,
  east: -13.0
} as const;

export const ICELAND_GROCERY_SHOP_VALUES = ['supermarket', 'convenience', 'grocery', 'greengrocer'] as const;

const ICELAND_BBOX = `${ICELAND_OVERPASS_BBOX.south},${ICELAND_OVERPASS_BBOX.west},${ICELAND_OVERPASS_BBOX.north},${ICELAND_OVERPASS_BBOX.east}`;
const ICELAND_GROCERY_SHOP_REGEX = `^(${ICELAND_GROCERY_SHOP_VALUES.join('|')})$`;

export const IS_POI_AUDIT_OVERPASS_QUERY = `[out:json][timeout:180];
(
  node["shop"~"${ICELAND_GROCERY_SHOP_REGEX}"](${ICELAND_BBOX});
  way["shop"~"${ICELAND_GROCERY_SHOP_REGEX}"](${ICELAND_BBOX});
  relation["shop"~"${ICELAND_GROCERY_SHOP_REGEX}"](${ICELAND_BBOX});
  node["amenity"="pharmacy"](${ICELAND_BBOX});
  way["amenity"="pharmacy"](${ICELAND_BBOX});
  relation["amenity"="pharmacy"](${ICELAND_BBOX});
  node["amenity"="fuel"](${ICELAND_BBOX});
  way["amenity"="fuel"](${ICELAND_BBOX});
  relation["amenity"="fuel"](${ICELAND_BBOX});
);
out center tags;`;

export type FetchIcelandPoiAuditOptions = {
  fetchImpl?: typeof fetch;
  query?: string;
  retrievedAt?: string;
};

export async function fetchIcelandPoiAudit(options: FetchIcelandPoiAuditOptions = {}): Promise<IcelandPoiAuditRow[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const query = options.query ?? IS_POI_AUDIT_OVERPASS_QUERY;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const response = await fetchImpl(IS_POI_AUDIT_OVERPASS_URL, {
    method: 'POST',
    body: new URLSearchParams({ data: query }),
    headers: {
      accept: 'application/json',
      'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'user-agent': 'GroceryView/0.1 IS POI audit (https://github.com/SzeChunYiu/GroceryView)'
    }
  });

  if (!response.ok) throw new Error(`Overpass IS POI audit request failed: ${response.status}`);
  return parseIcelandPoiAudit(await response.json() as OverpassResponse, retrievedAt);
}

export function parseIcelandPoiAudit(payload: OverpassResponse, retrievedAt: string): IcelandPoiAuditRow[] {
  return (payload.elements ?? [])
    .map((element) => normalizeIcelandPoi(element, retrievedAt))
    .filter((row): row is IcelandPoiAuditRow => row !== null);
}

export function normalizeIcelandPoi(element: OverpassElement, retrievedAt: string): IcelandPoiAuditRow | null {
  const osmType = asOsmType(element.type);
  const osmId = typeof element.id === 'number' ? element.id : null;
  const tags = element.tags ?? {};
  const latitude = numberOrNull(element.lat) ?? numberOrNull(element.center?.lat);
  const longitude = numberOrNull(element.lon) ?? numberOrNull(element.center?.lon);
  const shop = text(tags.shop);
  const amenity = text(tags.amenity);
  const domain = domainForTags(shop, amenity);
  const brand = text(tags.brand);
  const operator = text(tags.operator);
  const name = text(tags.name) || brand || operator;

  if (!osmType || osmId === null || latitude === null || longitude === null || !domain || !name) return null;

  return {
    osmType,
    osmId,
    name,
    brand,
    operator,
    domain,
    chain: matchIcelandPoiChain([brand, name, operator]),
    shop,
    amenity,
    latitude,
    longitude,
    street: text(tags['addr:street']),
    houseNumber: text(tags['addr:housenumber']),
    postcode: text(tags['addr:postcode']),
    city: text(tags['addr:city']),
    openingHours: text(tags.opening_hours),
    website: text(tags.website) || text(tags['contact:website']),
    phone: text(tags.phone) || text(tags['contact:phone']),
    sourceUrl: IS_POI_AUDIT_OVERPASS_URL,
    retrievedAt
  };
}

export function matchIcelandPoiChain(values: unknown[]): IcelandPoiChain {
  const haystack = normalizedSearchText(values);
  if (/\bbonus\b/.test(haystack)) return 'bonus';
  if (/\bkronan\b/.test(haystack)) return 'kronan';
  if (/\bnetto\b/.test(haystack)) return 'netto';
  if (/\bhagkaup\b/.test(haystack)) return 'hagkaup';
  if (/\bkrambudin\b/.test(haystack)) return 'krambudin';
  if (/\b10-?11\b/.test(haystack)) return '10-11';
  if (/\blyfja\b/.test(haystack)) return 'lyfja';
  if (/\blyf\s*og\s*heilsa\b/.test(haystack)) return 'lyfogheilsa';
  if (/\bapotekid\b/.test(haystack)) return 'apotekid';
  if (/\bn1\b/.test(haystack)) return 'n1';
  if (/\bob\b/.test(haystack)) return 'ob';
  if (/\borkan\b/.test(haystack)) return 'orkan';
  if (/\bolis\b/.test(haystack)) return 'olis';
  if (/\batlantsolia\b/.test(haystack)) return 'atlantsolia';
  return 'unknown';
}

function domainForTags(shop: string, amenity: string): IcelandPoiDomain | null {
  if ((ICELAND_GROCERY_SHOP_VALUES as readonly string[]).includes(shop)) return 'grocery';
  if (amenity === 'pharmacy') return 'pharmacy';
  if (amenity === 'fuel') return 'fuel';
  return null;
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

function normalizedSearchText(values: unknown[]): string {
  return values
    .map(text)
    .join(' ')
    .toLocaleLowerCase('is-IS')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ð/g, 'd')
    .replace(/þ/g, 'th');
}
