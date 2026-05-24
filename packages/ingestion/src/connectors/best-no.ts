export const BEST_NO_STATIONS_URL = 'https://best.no/stasjoner/';

export type BestNoStation = {
  stationId: string;
  chain: 'Best';
  countryCode: 'NO';
  name: string;
  address: string;
  postalCode: string;
  city: string;
  latitude: number;
  longitude: number;
  phone: string;
  website: string;
  sourceUrl: string;
  retrievedAt: string;
};

export type FetchBestNoStationsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  retrievedAt?: string;
};

export type JsonLdStation = {
  '@type'?: unknown;
  name?: unknown;
  url?: unknown;
  telephone?: unknown;
  address?: {
    streetAddress?: unknown;
    postalCode?: unknown;
    addressLocality?: unknown;
  };
  geo?: {
    latitude?: unknown;
    longitude?: unknown;
  };
};

export async function fetchBestNoStations(options: FetchBestNoStationsOptions = {}): Promise<BestNoStation[]> {
  const sourceUrl = options.sourceUrl ?? BEST_NO_STATIONS_URL;
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 Best Norway connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (!response.ok) throw new Error(`Best Norway station request failed: ${response.status}`);
  return parseBestNoStationsHtml(await response.text(), sourceUrl, options.retrievedAt ?? new Date().toISOString());
}

export function parseBestNoStationsHtml(html: string, sourceUrl: string, retrievedAt: string): BestNoStation[] {
  return extractJsonLdStations(html)
    .map((station) => normalizeBestNoStation(station, sourceUrl, retrievedAt))
    .filter((station): station is BestNoStation => station !== null);
}

export function normalizeBestNoStation(station: JsonLdStation, sourceUrl: string, retrievedAt: string): BestNoStation | null {
  const name = text(station.name);
  const latitude = numberOrNull(station.geo?.latitude);
  const longitude = numberOrNull(station.geo?.longitude);
  if (!name || latitude === null || longitude === null) return null;
  const website = absoluteBestUrl(text(station.url));
  return {
    stationId: stableBestStationId(name, text(station.address?.postalCode), website),
    chain: 'Best',
    countryCode: 'NO',
    name,
    address: text(station.address?.streetAddress),
    postalCode: text(station.address?.postalCode),
    city: text(station.address?.addressLocality),
    latitude,
    longitude,
    phone: text(station.telephone),
    website,
    sourceUrl,
    retrievedAt
  };
}

function extractJsonLdStations(html: string): JsonLdStation[] {
  const stations: JsonLdStation[] = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    const parsed = parseJson(match[1]);
    for (const item of flattenJsonLd(parsed)) {
      if (isRecord(item) && /GasStation|LocalBusiness|Store/.test(text(item['@type']))) stations.push(item as JsonLdStation);
    }
  }
  return stations;
}

function flattenJsonLd(value: unknown): unknown[] {
  if (Array.isArray(value)) return value.flatMap(flattenJsonLd);
  if (!isRecord(value)) return [];
  const graph = value['@graph'];
  return Array.isArray(graph) ? graph.flatMap(flattenJsonLd) : [value];
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value.trim());
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function numberOrNull(value: unknown): number | null {
  const numberValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.replace(',', '.')) : NaN;
  return Number.isFinite(numberValue) ? numberValue : null;
}

function absoluteBestUrl(value: string) {
  if (!value) return '';
  return value.startsWith('http') ? value : new URL(value, 'https://best.no').toString();
}

function stableBestStationId(name: string, postalCode: string, website: string) {
  return `best-no-${[name, postalCode, website].join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}
