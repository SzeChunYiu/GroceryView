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

export type IcelandPoiAuditRow = {
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

export type IcelandPoiAuditReport = {
  retrievedAt: string;
  counts: Record<PoiKind, number>;
  unlinkedSupermarkets: IcelandPoiAuditRow[];
};

export const ICELAND_OVERPASS_BBOX = '63.0,-25.0,67.0,-13.0';
export const LINKED_ICELANDIC_SUPERMARKET_BRANDS = [
  '10-11',
  'bonus',
  'bónus',
  'costco',
  'hagkaup',
  'iceland',
  'kjörbúðin',
  'krambúðin',
  'kronan',
  'krónan',
  'melabúðin',
  'netto',
  'nettó',
  'samkaup'
] as const;

export function buildIcelandPoiAuditOverpassQuery(bbox = ICELAND_OVERPASS_BBOX): string {
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

export async function runIcelandPoiAudit(options: { fetchImpl?: typeof fetch; retrievedAt?: string } = {}): Promise<IcelandPoiAuditReport> {
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const response = await (options.fetchImpl ?? fetch)(OVERPASS_INTERPRETER_URL, {
    method: 'POST',
    body: new URLSearchParams({ data: buildIcelandPoiAuditOverpassQuery() }),
    headers: {
      accept: 'application/json',
      'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'user-agent': 'GroceryView/0.1 Iceland POI audit'
    }
  });
  if (!response.ok) throw new Error(`Iceland POI Overpass audit failed: ${response.status}`);

  return summarizeIcelandPoiAudit(await response.json() as OverpassResponse, retrievedAt);
}

export function summarizeIcelandPoiAudit(payload: OverpassResponse, retrievedAt: string): IcelandPoiAuditReport {
  const rows = (payload.elements ?? [])
    .map((element) => normalizeIcelandPoi(element, retrievedAt))
    .filter((row): row is IcelandPoiAuditRow => row !== null);
  const counts = {
    supermarket: rows.filter((row) => row.kind === 'supermarket').length,
    pharmacy: rows.filter((row) => row.kind === 'pharmacy').length,
    fuel: rows.filter((row) => row.kind === 'fuel').length
  };
  const unlinkedSupermarkets = rows.filter((row) => row.kind === 'supermarket' && !isLinkedIcelandicSupermarket(row));

  return { retrievedAt, counts, unlinkedSupermarkets };
}

function normalizeIcelandPoi(element: OverpassElement, retrievedAt: string): IcelandPoiAuditRow | null {
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

function isLinkedIcelandicSupermarket(row: IcelandPoiAuditRow): boolean {
  const haystack = `${row.brand} ${row.name}`.toLowerCase();
  return LINKED_ICELANDIC_SUPERMARKET_BRANDS.some((brand) => haystack.includes(brand));
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
  runIcelandPoiAudit()
    .then((report) => process.stdout.write(`${JSON.stringify(report, null, 2)}\n`))
    .catch((error: unknown) => {
      process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
      process.exitCode = 1;
    });
}
