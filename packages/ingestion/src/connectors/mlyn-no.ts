export type MlynNoStore = {
  address: string;
  category: 'ethnic_polish_eastern_european';
  chain: 'Mlyn';
  city: string;
  countryCode: 'NO';
  name: string;
  sourceUrl: string;
  storeId: string;
  url: string;
  verifiedMultiLocation: boolean;
};

type MlynNoLocationInput = {
  address?: { addressLocality?: unknown; streetAddress?: unknown } | string;
  name?: unknown;
  url?: unknown;
};

type MlynNoJsonLd = {
  '@type'?: unknown;
  department?: MlynNoLocationInput[];
  location?: MlynNoLocationInput | MlynNoLocationInput[];
  name?: unknown;
  url?: unknown;
};

export const mlynNoConnector = {
  id: 'mlyn-no',
  chain: 'Mlyn',
  country: 'NO',
  category: 'ethnic_polish_eastern_european',
  baseUrl: 'https://mlyn.no',
  minimumLocations: 2
} as const;

export function normalizeMlynNoLocations(payload: MlynNoJsonLd, sourceUrl = mlynNoConnector.baseUrl): MlynNoStore[] {
  const locations = [payload.location, payload.department]
    .flat(2)
    .filter((location): location is MlynNoLocationInput => Boolean(location));
  const unique = new Map<string, MlynNoStore>();

  for (const location of locations) {
    const name = text(location.name) || text(payload.name) || 'Mlyn';
    const address = typeof location.address === 'string' ? location.address : text(location.address?.streetAddress);
    const city = typeof location.address === 'string' ? '' : text(location.address?.addressLocality);
    if (!address && !city) continue;
    const storeId = slugify(`${name}-${address}-${city}`);
    unique.set(storeId, {
      address,
      category: 'ethnic_polish_eastern_european',
      chain: 'Mlyn',
      city,
      countryCode: 'NO',
      name,
      sourceUrl,
      storeId,
      url: absoluteUrl(text(location.url) || text(payload.url) || '/', sourceUrl),
      verifiedMultiLocation: false
    });
  }

  const rows = [...unique.values()];
  const verifiedMultiLocation = rows.length >= mlynNoConnector.minimumLocations;
  return rows.map((row) => ({ ...row, verifiedMultiLocation }));
}

export function extractMlynNoJsonLd(html: string): MlynNoJsonLd[] {
  const rows: MlynNoJsonLd[] = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(match[1].trim()) as MlynNoJsonLd | MlynNoJsonLd[];
      rows.push(...(Array.isArray(parsed) ? parsed : [parsed]));
    } catch {
      continue;
    }
  }
  return rows;
}

export async function fetchMlynNoStores(fetchImpl: typeof fetch = fetch, baseUrl = mlynNoConnector.baseUrl): Promise<MlynNoStore[]> {
  const response = await fetchImpl(baseUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (!response.ok) throw new Error(`Mlyn store page request failed: ${response.status}`);
  const sourceUrl = response.url || baseUrl;
  const rows = extractMlynNoJsonLd(await response.text()).flatMap((payload) => normalizeMlynNoLocations(payload, sourceUrl));
  if (rows.length < mlynNoConnector.minimumLocations) throw new Error('Mlyn connector requires at least two verified locations.');
  return rows;
}

function absoluteUrl(value: string, baseUrl: string): string {
  return new URL(value, baseUrl).toString();
}

function slugify(value: string): string {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
