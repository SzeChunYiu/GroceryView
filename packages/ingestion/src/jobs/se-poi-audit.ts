type OsmType = 'node' | 'way' | 'relation';

export type SwedenPoiDomain = 'grocery' | 'pharmacy' | 'fuel';

export type SwedenPoiChain =
  | 'ica'
  | 'coop'
  | 'willys'
  | 'hemkop'
  | 'lidl'
  | 'citygross'
  | 'mathem'
  | 'matspar'
  | 'pressbyran'
  | 'seven_eleven'
  | 'direkten'
  | 'apoteket'
  | 'hjartat'
  | 'kronans'
  | 'lloyds'
  | 'circle_k'
  | 'okq8'
  | 'preem'
  | 'st1'
  | 'shell'
  | 'tanka'
  | 'ingo'
  | 'din_x'
  | 'unknown';

export type SwedenPoiAuditRow = {
  osmType: OsmType;
  osmId: number;
  name: string;
  brand: string;
  operator: string;
  domain: SwedenPoiDomain;
  chain: SwedenPoiChain;
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

export type SwedenPoiAuditStoreRow = {
  store_id?: string;
  store_slug?: string;
  store_name: string;
  chain_slug?: string;
  chain_name?: string;
  external_ref?: string | null;
  country_code?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  city?: string | null;
};

export type SwedenPoiAuditUnlinkedRow = SwedenPoiAuditRow & {
  reason: 'unknown_chain' | 'missing_store_match';
  nearestStoreSlug: string;
  nearestStoreDistanceMeters: number | null;
};

export type SwedenPoiAuditReport = {
  generatedAt: string;
  totals: {
    pois: number;
    grocery: number;
    pharmacy: number;
    fuel: number;
    unknownChain: number;
    missingStoreMatch: number;
    unlinkedSupermarkets: number;
  };
  unlinkedPois: SwedenPoiAuditUnlinkedRow[];
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

export const SE_POI_AUDIT_OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
export const SWEDEN_POI_AUDIT_SHOP_VALUES = ['supermarket', 'convenience', 'grocery', 'deli', 'greengrocer', 'butcher', 'bakery'] as const;

const SWEDEN_POI_AUDIT_SHOP_REGEX = `^(${SWEDEN_POI_AUDIT_SHOP_VALUES.join('|')})$`;
const STORE_MATCH_DISTANCE_METERS = 250;

export const SE_POI_AUDIT_OVERPASS_QUERY = `[out:json][timeout:180];
area["ISO3166-1"="SE"][admin_level=2]->.searchArea;
(
  node["shop"~"${SWEDEN_POI_AUDIT_SHOP_REGEX}"](area.searchArea);
  way["shop"~"${SWEDEN_POI_AUDIT_SHOP_REGEX}"](area.searchArea);
  relation["shop"~"${SWEDEN_POI_AUDIT_SHOP_REGEX}"](area.searchArea);
  node["amenity"="pharmacy"](area.searchArea);
  way["amenity"="pharmacy"](area.searchArea);
  relation["amenity"="pharmacy"](area.searchArea);
  node["amenity"="fuel"](area.searchArea);
  way["amenity"="fuel"](area.searchArea);
  relation["amenity"="fuel"](area.searchArea);
);
out center tags;`;

export const SE_POI_AUDIT_STORES_QUERY = `select stores.id::text as store_id,
       stores.slug as store_slug,
       stores.name as store_name,
       stores.external_ref,
       stores.city,
       stores.country_code,
       chains.slug as chain_slug,
       chains.name as chain_name,
       case when stores.position is null then null else ST_Y(stores.position::geometry) end as latitude,
       case when stores.position is null then null else ST_X(stores.position::geometry) end as longitude
from stores
join chains on chains.id = stores.chain_id
where stores.country_code = 'SE'`;

export type FetchSwedenPoiAuditOptions = {
  fetchImpl?: typeof fetch;
  query?: string;
  retrievedAt?: string;
};

export async function fetchSwedenPoiAudit(options: FetchSwedenPoiAuditOptions = {}): Promise<SwedenPoiAuditRow[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const query = options.query ?? SE_POI_AUDIT_OVERPASS_QUERY;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const response = await fetchImpl(SE_POI_AUDIT_OVERPASS_URL, {
    method: 'POST',
    body: new URLSearchParams({ data: query }),
    headers: {
      accept: 'application/json',
      'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'user-agent': 'GroceryView/0.1 SE POI audit (https://github.com/SzeChunYiu/GroceryView)'
    }
  });

  if (!response.ok) throw new Error(`Overpass SE POI audit request failed: ${response.status}`);
  return parseSwedenPoiAudit(await response.json() as OverpassResponse, retrievedAt);
}

export function parseSwedenPoiAudit(payload: OverpassResponse, retrievedAt: string): SwedenPoiAuditRow[] {
  return (payload.elements ?? [])
    .map((element) => normalizeSwedenPoi(element, retrievedAt))
    .filter((row): row is SwedenPoiAuditRow => row !== null);
}

export function normalizeSwedenPoi(element: OverpassElement, retrievedAt: string): SwedenPoiAuditRow | null {
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
    chain: matchSwedenPoiChain([brand, name, operator]),
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
    sourceUrl: SE_POI_AUDIT_OVERPASS_URL,
    retrievedAt
  };
}

export function buildSwedenPoiAuditReport(
  pois: SwedenPoiAuditRow[],
  stores: SwedenPoiAuditStoreRow[],
  generatedAt = new Date().toISOString()
): SwedenPoiAuditReport {
  const normalizedStores = stores
    .filter((store) => !store.country_code || store.country_code === 'SE')
    .map((store) => ({ store, chain: matchSwedenPoiChain([store.chain_slug, store.chain_name, store.store_name]) }));

  const unlinkedPois = pois.flatMap((poi): SwedenPoiAuditUnlinkedRow[] => {
    const nearest = nearestStore(poi, normalizedStores.map(({ store }) => store));
    if (poi.chain === 'unknown') return [{ ...poi, reason: 'unknown_chain', ...nearest }];
    const hasStoreMatch = normalizedStores.some(({ store, chain }) => chain === poi.chain && storeMatchesPoi(store, poi));
    return hasStoreMatch ? [] : [{ ...poi, reason: 'missing_store_match', ...nearest }];
  });

  return {
    generatedAt,
    totals: {
      pois: pois.length,
      grocery: pois.filter((poi) => poi.domain === 'grocery').length,
      pharmacy: pois.filter((poi) => poi.domain === 'pharmacy').length,
      fuel: pois.filter((poi) => poi.domain === 'fuel').length,
      unknownChain: unlinkedPois.filter((poi) => poi.reason === 'unknown_chain').length,
      missingStoreMatch: unlinkedPois.filter((poi) => poi.reason === 'missing_store_match').length,
      unlinkedSupermarkets: unlinkedPois.filter((poi) => poi.shop === 'supermarket').length
    },
    unlinkedPois
  };
}

export function matchSwedenPoiChain(values: unknown[]): SwedenPoiChain {
  const haystack = normalizedSearchText(values);
  if (/\bica\b/.test(haystack)) return 'ica';
  if (/\bcoop\b|\bstora\s*coop\b|\bcoop\s*extra\b|\bcoop\s*nara\b/.test(haystack)) return 'coop';
  if (/\bwillys\b/.test(haystack)) return 'willys';
  if (/\bhemkop\b/.test(haystack)) return 'hemkop';
  if (/\blidl\b/.test(haystack)) return 'lidl';
  if (/\bcity\s*gross\b/.test(haystack)) return 'citygross';
  if (/\bmathem\b/.test(haystack)) return 'mathem';
  if (/\bmatspar\b/.test(haystack)) return 'matspar';
  if (/\bpressbyran\b/.test(haystack)) return 'pressbyran';
  if (/\b7-?eleven\b|\bseven\s*eleven\b/.test(haystack)) return 'seven_eleven';
  if (/\bdirekten\b/.test(haystack)) return 'direkten';
  if (/\bapotek\s*hjartat\b|\bhjartat\b/.test(haystack)) return 'hjartat';
  if (/\bkronans\b/.test(haystack)) return 'kronans';
  if (/\blloyds\b/.test(haystack)) return 'lloyds';
  if (/\bapoteket\b/.test(haystack)) return 'apoteket';
  if (/\bcircle\s*k\b/.test(haystack)) return 'circle_k';
  if (/\bokq8\b/.test(haystack)) return 'okq8';
  if (/\bpreem\b/.test(haystack)) return 'preem';
  if (/\bst1\b/.test(haystack)) return 'st1';
  if (/\bshell\b/.test(haystack)) return 'shell';
  if (/\btanka\b/.test(haystack)) return 'tanka';
  if (/\bingo\b/.test(haystack)) return 'ingo';
  if (/\bdin-?x\b/.test(haystack)) return 'din_x';
  return 'unknown';
}

function domainForTags(shop: string, amenity: string): SwedenPoiDomain | null {
  if ((SWEDEN_POI_AUDIT_SHOP_VALUES as readonly string[]).includes(shop)) return 'grocery';
  if (amenity === 'pharmacy') return 'pharmacy';
  if (amenity === 'fuel') return 'fuel';
  return null;
}

function storeMatchesPoi(store: SwedenPoiAuditStoreRow, poi: SwedenPoiAuditRow): boolean {
  if (store.external_ref && normalizedExternalRef(store.external_ref) === `${poi.osmType}/${poi.osmId}`) return true;
  const storeName = normalizedSearchText([store.store_name]);
  const poiName = normalizedSearchText([poi.name, poi.brand, poi.operator]);
  if (storeName.length > 0 && poiName.includes(storeName)) return true;
  const distance = distanceMeters(store.latitude, store.longitude, poi.latitude, poi.longitude);
  return distance !== null && distance <= STORE_MATCH_DISTANCE_METERS;
}

function nearestStore(poi: SwedenPoiAuditRow, stores: SwedenPoiAuditStoreRow[]): Pick<SwedenPoiAuditUnlinkedRow, 'nearestStoreSlug' | 'nearestStoreDistanceMeters'> {
  let nearest: { slug: string; distance: number } | null = null;
  for (const store of stores) {
    const distance = distanceMeters(store.latitude, store.longitude, poi.latitude, poi.longitude);
    if (distance === null) continue;
    if (!nearest || distance < nearest.distance) nearest = { slug: store.store_slug ?? '', distance };
  }
  return {
    nearestStoreSlug: nearest?.slug ?? '',
    nearestStoreDistanceMeters: nearest ? Math.round(nearest.distance) : null
  };
}

function distanceMeters(latA: unknown, lonA: unknown, latB: unknown, lonB: unknown): number | null {
  const aLat = numeric(latA);
  const aLon = numeric(lonA);
  const bLat = numeric(latB);
  const bLon = numeric(lonB);
  if (aLat === null || aLon === null || bLat === null || bLon === null) return null;
  const toRad = Math.PI / 180;
  const dLat = (bLat - aLat) * toRad;
  const dLon = (bLon - aLon) * toRad;
  const lat1 = aLat * toRad;
  const lat2 = bLat * toRad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function normalizedExternalRef(value: string): string {
  return value.trim().replace(/^osm:/, '').replace(':', '/');
}

function asOsmType(value: unknown): OsmType | null {
  return value === 'node' || value === 'way' || value === 'relation' ? value : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function numeric(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizedSearchText(values: unknown[]): string {
  return values
    .map(text)
    .join(' ')
    .toLocaleLowerCase('sv-SE')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ä/g, 'a')
    .replace(/å/g, 'a')
    .replace(/ö/g, 'o');
}
