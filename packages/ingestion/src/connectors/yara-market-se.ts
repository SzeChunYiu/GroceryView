import { classifyMiddleEasternGroceryOverlap, type GroceryOverlapCategory } from './overlapCategories.js';

export type YaraMarketSeLocation = {
  name: string;
  address: string;
};

export type YaraMarketSeRow = {
  code: string;
  name: string;
  brand: string;
  category: string;
  overlap_category: GroceryOverlapCategory;
  price: number;
  priceText: string;
  country: 'SE';
  currency: 'SEK';
  chain: 'yara-market';
  retailer_type: 'ethnic_middle_eastern';
  store_scope: 'chain-wide';
  locations: YaraMarketSeLocation[];
  sourceUrl: string;
  imageUrl: string;
  retrievedAt: string;
};

export type FetchYaraMarketSeOptions = {
  fetchImpl?: typeof fetch;
  maxRows?: number;
  retrievedAt?: string;
  sourceUrl?: string;
};

type YaraCandidate = {
  brand?: unknown;
  category?: unknown;
  id?: unknown;
  image?: unknown;
  name?: unknown;
  offers?: unknown;
  price?: unknown;
  priceText?: unknown;
  sku?: unknown;
  url?: unknown;
};

export const YARA_MARKET_SE_URL = 'https://yaramarket.se/';
export const YARA_MARKET_MIN_LOCATIONS = 3;

export async function fetchYaraMarketSeRows(options: FetchYaraMarketSeOptions = {}): Promise<YaraMarketSeRow[]> {
  const sourceUrl = options.sourceUrl ?? YARA_MARKET_SE_URL;
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml,application/json',
      'accept-language': 'sv-SE,sv;q=0.9,en;q=0.7',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  });

  if (!response.ok) {
    throw new Error(`Yara Market SE request failed for ${sourceUrl}: ${response.status}`);
  }

  return parseYaraMarketSeRows(await response.text(), {
    maxRows: options.maxRows,
    retrievedAt: options.retrievedAt ?? new Date().toISOString(),
    sourceUrl
  });
}

export function parseYaraMarketSeRows(
  html: string,
  context: { maxRows?: number; retrievedAt: string; sourceUrl: string }
): YaraMarketSeRow[] {
  const locations = extractYaraMarketLocations(html);
  if (locations.length < YARA_MARKET_MIN_LOCATIONS) return [];

  const rows: YaraMarketSeRow[] = [];
  const seen = new Set<string>();

  for (const candidate of extractStructuredCandidates(html)) {
    const row = normalizeYaraMarketSeRow(candidate, { ...context, locations });
    if (!row || seen.has(row.code)) continue;
    seen.add(row.code);
    rows.push(row);
    if (rows.length >= (context.maxRows ?? 200)) return rows;
  }

  return rows;
}

export function normalizeYaraMarketSeRow(
  candidate: YaraCandidate,
  context: { locations: YaraMarketSeLocation[]; retrievedAt: string; sourceUrl: string }
): YaraMarketSeRow | null {
  const name = text(candidate.name);
  const category = text(candidate.category);
  const overlapCategory = classifyMiddleEasternGroceryOverlap(`${category} ${name}`);
  if (!name || !overlapCategory) return null;

  const offer = firstObject(candidate.offers);
  const priceText = text(candidate.priceText) || text(offer?.price) || text(candidate.price);
  const price = parseSekPrice(priceText);
  if (price === null) return null;

  const code = text(candidate.sku) || text(candidate.id) || slugify(`${name}-${priceText}`);

  return {
    code,
    name,
    brand: text(candidate.brand),
    category,
    overlap_category: overlapCategory,
    price,
    priceText: formatSekPrice(price),
    country: 'SE',
    currency: 'SEK',
    chain: 'yara-market',
    retailer_type: 'ethnic_middle_eastern',
    store_scope: 'chain-wide',
    locations: context.locations,
    sourceUrl: absoluteUrl(text(candidate.url), context.sourceUrl),
    imageUrl: imageUrl(candidate.image),
    retrievedAt: context.retrievedAt
  };
}

export function extractYaraMarketLocations(html: string): YaraMarketSeLocation[] {
  const locations: YaraMarketSeLocation[] = [];
  const seen = new Set<string>();
  const locationPattern = /data-yara-location=["']([^"']+)["'][^>]*data-yara-address=["']([^"']+)["']/gi;

  for (const match of html.matchAll(locationPattern)) {
    const location = { name: text(match[1]), address: text(match[2]) };
    const key = `${location.name}|${location.address}`;
    if (location.name && location.address && !seen.has(key)) {
      seen.add(key);
      locations.push(location);
    }
  }

  return locations;
}

export function parseSekPrice(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.round(value * 100) / 100;
  const normalized = text(value)
    .replace(/kr|sek/gi, '')
    .replace(/[^0-9,.-]/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : null;
}

function formatSekPrice(price: number): string {
  return `${new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 2 }).format(price)} kr`;
}

function extractStructuredCandidates(html: string): YaraCandidate[] {
  const candidates: YaraCandidate[] = [];
  for (const jsonText of extractJsonScriptBodies(html)) {
    try {
      collectCandidates(JSON.parse(jsonText), candidates);
    } catch {
      // Ignore unrelated script payloads.
    }
  }
  return candidates;
}

function extractJsonScriptBodies(html: string): string[] {
  const scripts: string[] = [];
  const scriptPattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(scriptPattern)) scripts.push(decodeHtml(match[1] ?? '').trim());
  const nextData = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i)?.[1];
  if (nextData) scripts.push(decodeHtml(nextData).trim());
  return scripts;
}

function collectCandidates(value: unknown, candidates: YaraCandidate[]) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectCandidates(item, candidates));
    return;
  }
  if (!value || typeof value !== 'object') return;
  const record = value as Record<string, unknown>;
  const type = text(record['@type'] ?? record.type).toLowerCase();
  const hasPrice = record.price !== undefined || record.priceText !== undefined || (record.offers && typeof record.offers === 'object');
  if ((type.includes('product') || record.name) && hasPrice) candidates.push(record as YaraCandidate);
  for (const child of Object.values(record)) {
    if (child && typeof child === 'object') collectCandidates(child, candidates);
  }
}

function firstObject(value: unknown): Record<string, unknown> | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  return first && typeof first === 'object' ? first as Record<string, unknown> : undefined;
}

function imageUrl(value: unknown): string {
  if (Array.isArray(value)) return text(value[0]);
  return text(value);
}

function absoluteUrl(value: string, baseUrl: string): string {
  if (!value) return baseUrl;
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return baseUrl;
  }
}

function text(value: unknown): string {
  if (typeof value === 'string') return decodeHtml(value).trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function decodeHtml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
