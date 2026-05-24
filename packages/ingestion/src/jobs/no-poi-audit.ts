import { pathToFileURL } from 'node:url';
import { OVERPASS_INTERPRETER_URL } from '../connectors/overpass.js';

type OsmType = 'node' | 'way' | 'relation';
type PoiKind = 'supermarket' | 'pharmacy' | 'fuel';

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

export type NorwayPoiAuditRow = {
  osmType: OsmType;
  osmId: number;
  kind: PoiKind;
  name: string;
  brand: string;
  latitude: number;
  longitude: number;
  city: string;
  postcode: string;
  retrievedAt: string;
};

export type NorwayPoiAuditReport = {
  retrievedAt: string;
  counts: Record<PoiKind, number>;
  unlinkedSupermarkets: NorwayPoiAuditRow[];
};

export const NORWAY_OVERPASS_BBOX = '57.8,4.0,71.4,31.4';
export const LINKED_NORWEGIAN_SUPERMARKET_BRANDS = [
  'bunnpris',
  'coop',
  'extra',
  'joker',
  'kiwi',
  'meny',
  'nærbutikken',
  'obs',
  'rema 1000',
  'spar'
] as const;

export function buildNorwayPoiAuditOverpassQuery(bbox = NORWAY_OVERPASS_BBOX): string {
  return `[out:json][timeout:180];
(
  node["shop"~"^(supermarket|convenience|grocery)$"](${bbox});
  way["shop"~"^(supermarket|convenience|grocery)$"](${bbox});
  relation["shop"~"^(supermarket|convenience|grocery)$"](${bbox});
  node["amenity"="pharmacy"](${bbox});
  way["amenity"="pharmacy"](${bbox});
  relation["amenity"="pharmacy"](${bbox});
  node["shop"="chemist"](${bbox});
  way["shop"="chemist"](${bbox});
  relation["shop"="chemist"](${bbox});
  node["amenity"="fuel"](${bbox});
  way["amenity"="fuel"](${bbox});
  relation["amenity"="fuel"](${bbox});
);
out center tags;`;
}

export async function runNorwayPoiAudit(options: { fetchImpl?: typeof fetch; retrievedAt?: string } = {}): Promise<NorwayPoiAuditReport> {
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const response = await (options.fetchImpl ?? fetch)(OVERPASS_INTERPRETER_URL, {
    method: 'POST',
    body: new URLSearchParams({ data: buildNorwayPoiAuditOverpassQuery() }),
    headers: {
      accept: 'application/json',
      'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'user-agent': 'GroceryView/0.1 Norway POI audit'
    }
  });
  if (!response.ok) throw new Error(`Norway POI Overpass audit failed: ${response.status}`);

  return summarizeNorwayPoiAudit(await response.json() as OverpassResponse, retrievedAt);
}

export function summarizeNorwayPoiAudit(payload: OverpassResponse, retrievedAt: string): NorwayPoiAuditReport {
  const rows = (payload.elements ?? [])
    .map((element) => normalizeNorwayPoi(element, retrievedAt))
    .filter((row): row is NorwayPoiAuditRow => row !== null);
  const counts = {
    supermarket: rows.filter((row) => row.kind === 'supermarket').length,
    pharmacy: rows.filter((row) => row.kind === 'pharmacy').length,
    fuel: rows.filter((row) => row.kind === 'fuel').length
  };
  const unlinkedSupermarkets = rows.filter((row) => row.kind === 'supermarket' && !isLinkedNorwegianSupermarket(row));

  return { retrievedAt, counts, unlinkedSupermarkets };
}

function normalizeNorwayPoi(element: OverpassElement, retrievedAt: string): NorwayPoiAuditRow | null {
  const osmType = asOsmType(element.type);
  const osmId = typeof element.id === 'number' ? element.id : null;
  const tags = element.tags ?? {};
  const kind = kindFor(tags);
  const latitude = numberOrNull(element.lat) ?? numberOrNull(element.center?.lat);
  const longitude = numberOrNull(element.lon) ?? numberOrNull(element.center?.lon);
  const name = text(tags.name) || text(tags.brand) || text(tags.operator);

  if (!osmType || osmId === null || !kind || latitude === null || longitude === null || !name) return null;

  return {
    osmType,
    osmId,
    kind,
    name,
    brand: text(tags.brand) || text(tags.operator) || name,
    latitude,
    longitude,
    city: text(tags['addr:city']),
    postcode: text(tags['addr:postcode']),
    retrievedAt
  };
}

function kindFor(tags: Record<string, unknown>): PoiKind | null {
  const shop = text(tags.shop);
  const amenity = text(tags.amenity);
  if (shop === 'supermarket' || shop === 'convenience' || shop === 'grocery') return 'supermarket';
  if (amenity === 'pharmacy' || shop === 'chemist') return 'pharmacy';
  if (amenity === 'fuel') return 'fuel';
  return null;
}

function isLinkedNorwegianSupermarket(row: NorwayPoiAuditRow): boolean {
  const haystack = `${row.brand} ${row.name}`.toLowerCase();
  return LINKED_NORWEGIAN_SUPERMARKET_BRANDS.some((brand) => haystack.includes(brand));
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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runNorwayPoiAudit()
    .then((report) => console.log(JSON.stringify(report, null, 2)))
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
