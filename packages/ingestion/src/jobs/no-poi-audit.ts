import {
  attachNorwayStoreOperator,
  matchNorwayCanonicalChain,
  type NorwayChainId,
  type NorwayOperatorGroupId,
  type NorwayStoreChannel,
  type NorwayStoreFormat
} from '@groceryview/catalog';

type OsmType = 'node' | 'way' | 'relation';

export type NorwayPoiDomain = 'grocery' | 'pharmacy' | 'fuel';

export type NorwayPoiChain =
  | 'rema_1000'
  | 'kiwi'
  | 'meny'
  | 'joker'
  | 'spar'
  | 'coop'
  | 'bunnpris'
  | 'oda'
  | 'apotek_1'
  | 'vitusapotek'
  | 'boots_apotek'
  | 'circle_k'
  | 'esso'
  | 'shell'
  | 'yx'
  | 'uno_x'
  | 'st1'
  | 'unknown';

export type NorwayPoiReviewStatus = 'clear' | 'needs_review';

export type NorwayPoiAuditRow = {
  osmType: OsmType;
  osmId: number;
  name: string;
  brand: string;
  operator: string;
  domain: NorwayPoiDomain;
  chain: NorwayPoiChain;
  canonicalChainId: NorwayChainId | null;
  operatorGroupId: NorwayOperatorGroupId | null;
  storeFormat: NorwayStoreFormat | null;
  channel: NorwayStoreChannel | null;
  municipality: string;
  chainReviewStatus: NorwayPoiReviewStatus;
  chainReviewReason: string;
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

export const NO_POI_AUDIT_OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
export const NORWAY_OVERPASS_BBOX = {
  south: 57.8,
  west: 4.0,
  north: 71.4,
  east: 31.5
} as const;

export const NORWAY_GROCERY_SHOP_VALUES = ['supermarket', 'convenience', 'grocery', 'greengrocer'] as const;

const NORWAY_BBOX = `${NORWAY_OVERPASS_BBOX.south},${NORWAY_OVERPASS_BBOX.west},${NORWAY_OVERPASS_BBOX.north},${NORWAY_OVERPASS_BBOX.east}`;
const NORWAY_GROCERY_SHOP_REGEX = `^(${NORWAY_GROCERY_SHOP_VALUES.join('|')})$`;

export const NO_POI_AUDIT_OVERPASS_QUERY = `[out:json][timeout:180];
(
  node["shop"~"${NORWAY_GROCERY_SHOP_REGEX}"](${NORWAY_BBOX});
  way["shop"~"${NORWAY_GROCERY_SHOP_REGEX}"](${NORWAY_BBOX});
  relation["shop"~"${NORWAY_GROCERY_SHOP_REGEX}"](${NORWAY_BBOX});
  node["amenity"="pharmacy"](${NORWAY_BBOX});
  way["amenity"="pharmacy"](${NORWAY_BBOX});
  relation["amenity"="pharmacy"](${NORWAY_BBOX});
  node["amenity"="fuel"](${NORWAY_BBOX});
  way["amenity"="fuel"](${NORWAY_BBOX});
  relation["amenity"="fuel"](${NORWAY_BBOX});
);
out center tags;`;

export type FetchNorwayPoiAuditOptions = {
  fetchImpl?: typeof fetch;
  query?: string;
  retrievedAt?: string;
};

export async function fetchNorwayPoiAudit(options: FetchNorwayPoiAuditOptions = {}): Promise<NorwayPoiAuditRow[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const query = options.query ?? NO_POI_AUDIT_OVERPASS_QUERY;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const response = await fetchImpl(NO_POI_AUDIT_OVERPASS_URL, {
    method: 'POST',
    body: new URLSearchParams({ data: query }),
    headers: {
      accept: 'application/json',
      'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'user-agent': 'GroceryView/0.1 NO POI audit (https://github.com/SzeChunYiu/GroceryView)'
    }
  });

  if (!response.ok) throw new Error(`Overpass NO POI audit request failed: ${response.status}`);
  return parseNorwayPoiAudit(await response.json() as OverpassResponse, retrievedAt);
}

export function parseNorwayPoiAudit(payload: OverpassResponse, retrievedAt: string): NorwayPoiAuditRow[] {
  return (payload.elements ?? [])
    .map((element) => normalizeNorwayPoi(element, retrievedAt))
    .filter((row): row is NorwayPoiAuditRow => row !== null);
}

export function normalizeNorwayPoi(element: OverpassElement, retrievedAt: string): NorwayPoiAuditRow | null {
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
  const operatorAttachment = attachNorwayStoreOperator({
    name,
    brand,
    operator,
    municipality: text(tags['addr:municipality']) || text(tags['addr:city']),
    latitude,
    longitude,
    onlineOnly: /oda/i.test([brand, name, operator].join(' '))
  });

  return {
    osmType,
    osmId,
    name,
    brand,
    operator,
    domain,
    chain: matchNorwayPoiChain([brand, name, operator]),
    canonicalChainId: operatorAttachment.canonicalChainId,
    operatorGroupId: operatorAttachment.operatorGroupId,
    storeFormat: operatorAttachment.storeFormat,
    channel: operatorAttachment.channel,
    municipality: operatorAttachment.municipality,
    chainReviewStatus: operatorAttachment.review.status,
    chainReviewReason: operatorAttachment.review.reasons.join(','),
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
    sourceUrl: NO_POI_AUDIT_OVERPASS_URL,
    retrievedAt
  };
}

export function matchNorwayPoiChain(values: unknown[]): NorwayPoiChain {
  const canonicalChain = matchNorwayCanonicalChain(values);
  if (canonicalChain?.id === 'rema-1000') return 'rema_1000';
  if (canonicalChain?.id === 'kiwi') return 'kiwi';
  if (canonicalChain?.id === 'meny') return 'meny';
  if (canonicalChain?.id === 'joker') return 'joker';
  if (canonicalChain?.id === 'spar') return 'spar';
  if (canonicalChain?.operatorGroupId === 'coop-norge') return 'coop';
  if (canonicalChain?.id === 'bunnpris') return 'bunnpris';
  if (canonicalChain?.id === 'oda') return 'oda';
  const haystack = normalizedSearchText(values);
  if (/\bapotek\s*1\b/.test(haystack)) return 'apotek_1';
  if (/\bvitusapotek\b|\bvitus\s*apotek\b/.test(haystack)) return 'vitusapotek';
  if (/\bboots\s*apotek\b/.test(haystack)) return 'boots_apotek';
  if (/\bcircle\s*k\b/.test(haystack)) return 'circle_k';
  if (/\besso\b/.test(haystack)) return 'esso';
  if (/\bshell\b/.test(haystack)) return 'shell';
  if (/\byx\b/.test(haystack)) return 'yx';
  if (/\buno-?x\b/.test(haystack)) return 'uno_x';
  if (/\bst1\b/.test(haystack)) return 'st1';
  return 'unknown';
}

function domainForTags(shop: string, amenity: string): NorwayPoiDomain | null {
  if ((NORWAY_GROCERY_SHOP_VALUES as readonly string[]).includes(shop)) return 'grocery';
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
    .toLocaleLowerCase('nb-NO')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a');
}
