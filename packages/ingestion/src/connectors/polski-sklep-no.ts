export type PolskiSklepNoStore = {
  address: string;
  chain: 'polski-sklep-no';
  city: string;
  country: 'NO';
  latitude: number | null;
  longitude: number | null;
  name: string;
  phone: string;
  postalCode: string;
  retrievedAt: string;
  sourceUrl: string;
  storeId: string;
  url: string;
};

export type FetchPolskiSklepNoStoresOptions = {
  fetchImpl?: typeof fetch;
  retrievedAt?: string;
  sourceUrls?: readonly string[];
};

export const POLSKI_SKLEP_NO_BASE_URL = 'https://polskisklep.no';
export const DEFAULT_POLSKI_SKLEP_NO_STORE_URLS = [
  'https://polskisklep.no',
  'https://polskisklep.no/butikker',
  'https://polskisklep.no/kontakt'
] as const;

export async function fetchPolskiSklepNoStores(options: FetchPolskiSklepNoStoresOptions = {}): Promise<PolskiSklepNoStore[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: PolskiSklepNoStore[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of options.sourceUrls ?? DEFAULT_POLSKI_SKLEP_NO_STORE_URLS) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 store-connector (+https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (!response.ok) continue;

    for (const store of parsePolskiSklepNoStores(await response.text(), sourceUrl, retrievedAt)) {
      if (seen.has(store.storeId)) continue;
      seen.add(store.storeId);
      rows.push(store);
    }
  }

  if (rows.length < 3) {
    throw new Error(`Polski Sklep NO connector expected at least 3 stores, found ${rows.length}.`);
  }
  return rows;
}

export function parsePolskiSklepNoStores(html: string, sourceUrl: string, retrievedAt: string): PolskiSklepNoStore[] {
  const candidates = [
    ...storesFromJsonLd(html),
    ...storesFromHtml(html)
  ];

  return candidates
    .map((candidate) => normalizePolskiSklepNoStore(candidate, sourceUrl, retrievedAt))
    .filter((store): store is PolskiSklepNoStore => store !== null);
}

type StoreCandidate = {
  address?: unknown;
  city?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  name?: unknown;
  phone?: unknown;
  postalCode?: unknown;
  url?: unknown;
};

export function normalizePolskiSklepNoStore(candidate: StoreCandidate, sourceUrl: string, retrievedAt: string): PolskiSklepNoStore | null {
  const name = text(candidate.name) || 'Polski Sklep';
  const address = text(candidate.address);
  const city = text(candidate.city) || cityFromAddress(address);
  const url = absoluteUrl(candidate.url, POLSKI_SKLEP_NO_BASE_URL) || sourceUrl;
  if (!address && !city && url === sourceUrl) return null;

  return {
    address,
    chain: 'polski-sklep-no',
    city,
    country: 'NO',
    latitude: numberOrNull(candidate.latitude),
    longitude: numberOrNull(candidate.longitude),
    name,
    phone: text(candidate.phone),
    postalCode: text(candidate.postalCode) || postalCodeFromAddress(address),
    retrievedAt,
    sourceUrl,
    storeId: slugify(`${name}-${address || city || url}`),
    url
  };
}

function storesFromJsonLd(html: string): StoreCandidate[] {
  const stores: StoreCandidate[] = [];
  for (const json of extractJsonLd(html)) collectStoreCandidates(json, stores);
  return stores;
}

function collectStoreCandidates(value: unknown, stores: StoreCandidate[]) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((entry) => collectStoreCandidates(entry, stores));
    return;
  }
  const record = value as Record<string, unknown>;
  const type = String(record['@type'] ?? '').toLowerCase();
  if (/store|localbusiness|grocery/.test(type) || record.address) {
    const address = record.address as Record<string, unknown> | string | undefined;
    stores.push({
      address: typeof address === 'string' ? address : address?.streetAddress,
      city: typeof address === 'object' ? address.addressLocality : undefined,
      latitude: (record.geo as Record<string, unknown> | undefined)?.latitude,
      longitude: (record.geo as Record<string, unknown> | undefined)?.longitude,
      name: record.name,
      phone: record.telephone,
      postalCode: typeof address === 'object' ? address.postalCode : undefined,
      url: record.url
    });
  }
  Object.values(record).forEach((entry) => collectStoreCandidates(entry, stores));
}

function storesFromHtml(html: string): StoreCandidate[] {
  const pageText = decodeHtmlText(html);
  const storeBlocks = pageText.split(/Polski\s+Sklep/gi).slice(1);
  return storeBlocks.map((block, index) => {
    const address = block.match(/([A-ZÆØÅa-zæøå0-9 .'-]+\s+\d+[A-Z]?,?\s*\d{4}\s+[A-ZÆØÅa-zæøå .'-]+)/)?.[1]?.trim();
    return {
      address,
      city: cityFromAddress(address ?? ''),
      name: `Polski Sklep ${cityFromAddress(address ?? '') || index + 1}`,
      phone: block.match(/(\+47\s*)?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}/)?.[0]
    };
  });
}

function extractJsonLd(html: string): unknown[] {
  return [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => parseJson(match[1] ?? ''));
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value.replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
  } catch {
    return null;
  }
}

function decodeHtmlText(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|\u00a0/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

function text(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function numberOrNull(value: unknown): number | null {
  const parsed = Number(text(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function postalCodeFromAddress(address: string): string {
  return address.match(/\b\d{4}\b/)?.[0] ?? '';
}

function cityFromAddress(address: string): string {
  return address.replace(/,?\s*\d{4}\s*/, ' ').trim().split(/\s{2,}|,/).pop()?.trim() ?? '';
}

function absoluteUrl(value: unknown, baseUrl: string): string {
  const raw = text(value);
  if (!raw) return '';
  try {
    return new URL(raw, baseUrl).toString();
  } catch {
    return '';
  }
}

function slugify(value: string): string {
  return value.toLowerCase().normalize('NFKD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 72) || 'polski-sklep-no';
}
