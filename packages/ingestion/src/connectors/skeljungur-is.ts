type SkeljungurStationInput = Record<string, unknown>;

export type SkeljungurIsStation = {
  id: string;
  chainId: 'skeljungur-shell-is';
  chainName: 'Shell';
  operatorName: 'Skeljungur';
  countryCode: 'IS';
  name: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  sourceUrl: string;
  retrievedAt: string;
  provenance: {
    source: 'skeljungur_is';
    parserVersion: 'skeljungur-is-v1';
    rawRecordId: string;
  };
};

export type FetchSkeljungurIsStationsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  retrievedAt?: string;
};

export const SKELJUNGUR_IS_SOURCE_URL = 'https://www.skeljungur.is/';
export const SKELJUNGUR_IS_CHAIN_ID = 'skeljungur-shell-is';

export async function fetchSkeljungurIsStations(options: FetchSkeljungurIsStationsOptions = {}): Promise<SkeljungurIsStation[]> {
  const sourceUrl = options.sourceUrl ?? SKELJUNGUR_IS_SOURCE_URL;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'application/json,text/html;q=0.9',
      'user-agent': 'GroceryView/0.1 skeljungur-is-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });

  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Skeljungur IS source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Skeljungur IS source failed with HTTP ${response.status}.`);

  const body = await response.text();
  return parseSkeljungurIsStations(body, { sourceUrl, retrievedAt });
}

export function parseSkeljungurIsStations(
  body: string,
  context: { sourceUrl?: string; retrievedAt: string }
): SkeljungurIsStation[] {
  const sourceUrl = context.sourceUrl ?? SKELJUNGUR_IS_SOURCE_URL;
  const records = stationRecordsFromBody(body);
  const stations = records
    .map((record, index) => normalizeSkeljungurIsStation(record, { sourceUrl, retrievedAt: context.retrievedAt, fallbackIndex: index }))
    .filter((station): station is SkeljungurIsStation => station !== null);

  if (stations.length === 0) throw new Error('No Skeljungur Shell Iceland station records found.');
  return stations;
}

export function normalizeSkeljungurIsStation(
  record: SkeljungurStationInput,
  context: { sourceUrl: string; retrievedAt: string; fallbackIndex: number }
): SkeljungurIsStation | null {
  const name = firstText(record.name, record.title, record.stationName, record.nafn) || 'Shell Iceland station';
  const brand = firstText(record.brand, record.chain, record.operator, record.company, record.merki);
  if (brand && !/shell|skeljungur/i.test(brand)) return null;

  const latitude = firstNumber(record.latitude, record.lat, record.y, nested(record, 'geo', 'latitude'));
  const longitude = firstNumber(record.longitude, record.lng, record.lon, record.x, nested(record, 'geo', 'longitude'));
  const idSource = firstText(record.id, record.stationId, record.slug, record.url) || `${name}-${context.fallbackIndex}`;

  return {
    id: `is-shell-${slugify(idSource)}`,
    chainId: SKELJUNGUR_IS_CHAIN_ID,
    chainName: 'Shell',
    operatorName: 'Skeljungur',
    countryCode: 'IS',
    name,
    address: firstText(record.address, record.streetAddress, nested(record, 'address', 'streetAddress')),
    city: firstText(record.city, record.locality, nested(record, 'address', 'addressLocality')),
    latitude,
    longitude,
    sourceUrl: context.sourceUrl,
    retrievedAt: context.retrievedAt,
    provenance: {
      source: 'skeljungur_is',
      parserVersion: 'skeljungur-is-v1',
      rawRecordId: String(idSource)
    }
  };
}

function stationRecordsFromBody(body: string): SkeljungurStationInput[] {
  const json = parseJson(body);
  if (json) return stationRecordsFromJson(json);

  const jsonLdRecords = [...body.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .flatMap((match) => stationRecordsFromJson(parseJson(decodeHtml(match[1] ?? ''))));
  if (jsonLdRecords.length > 0) return jsonLdRecords;

  const embeddedJson = body.match(/(?:stations|locations|markers)\s*[:=]\s*(\[[\s\S]*?\]);/i)?.[1];
  return stationRecordsFromJson(parseJson(embeddedJson ?? ''));
}

function stationRecordsFromJson(value: unknown): SkeljungurStationInput[] {
  if (Array.isArray(value)) return value.flatMap(stationRecordsFromJson);
  if (!value || typeof value !== 'object') return [];
  const record = value as SkeljungurStationInput;
  const graph = record['@graph'];
  if (Array.isArray(graph)) return graph.flatMap(stationRecordsFromJson);
  for (const key of ['stations', 'locations', 'markers', 'items', 'features']) {
    const nestedValue = record[key];
    if (Array.isArray(nestedValue)) return nestedValue.flatMap(stationRecordsFromJson);
  }
  const properties = record.properties;
  if (properties && typeof properties === 'object') return [{ ...(properties as SkeljungurStationInput), ...coordinatesFromGeometry(record.geometry) }];
  return [record];
}

function coordinatesFromGeometry(geometry: unknown): SkeljungurStationInput {
  if (!geometry || typeof geometry !== 'object') return {};
  const coordinates = (geometry as { coordinates?: unknown }).coordinates;
  if (!Array.isArray(coordinates)) return {};
  return { longitude: coordinates[0], latitude: coordinates[1] };
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function nested(record: SkeljungurStationInput, key: string, childKey: string): unknown {
  const value = record[key];
  return value && typeof value === 'object' ? (value as Record<string, unknown>)[childKey] : undefined;
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return decodeHtml(value).trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function firstNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.replace(',', '.')) : Number.NaN;
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function decodeHtml(value: string): string {
  return value.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#x2F;/g, '/').replace(/&nbsp;/g, ' ');
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'station';
}
