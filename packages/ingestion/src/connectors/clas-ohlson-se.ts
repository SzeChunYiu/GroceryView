export type ClasOhlsonSeProduct = {
  code: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  priceText: string;
  currency: 'SEK';
  country: 'SE';
  overlappingCategory: 'cleaning' | 'batteries' | 'kitchen_consumables';
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

export type FetchClasOhlsonSeProductsOptions = {
  fetchImpl?: typeof fetch;
  maxRows?: number;
  retrievedAt?: string;
  sourceUrls?: readonly string[];
};

type ClasOhlsonCandidate = {
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

export const DEFAULT_CLAS_OHLSON_SE_CATEGORY_URLS = [
  'https://www.clasohlson.com/se/Stadning/c/1195',
  'https://www.clasohlson.com/se/Batterier/c/1210',
  'https://www.clasohlson.com/se/Kokstillbehor/c/1237'
] as const;

const CATEGORY_MATCHERS: Array<[ClasOhlsonSeProduct['overlappingCategory'], RegExp]> = [
  ['cleaning', /städ|stad|clean|disk|rengör|rengor|tvätt|tvatt|sopp|mopp|borst/i],
  ['batteries', /batter|knappcell|alkalin|lithium|uppladdningsbar/i],
  ['kitchen_consumables', /kök|kok|kaffe|filter|folie|plastpås|plastpas|bakplåt|bakplat|servett|påse|pase/i]
];

export async function fetchClasOhlsonSeProducts(options: FetchClasOhlsonSeProductsOptions = {}): Promise<ClasOhlsonSeProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sourceUrls = options.sourceUrls ?? DEFAULT_CLAS_OHLSON_SE_CATEGORY_URLS;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const maxRows = options.maxRows ?? 300;
  const rows: ClasOhlsonSeProduct[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of sourceUrls) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml,application/json',
        'accept-language': 'sv-SE,sv;q=0.9,en;q=0.7',
        'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
      }
    });

    if (!response.ok) {
      throw new Error(`Clas Ohlson SE request failed for ${sourceUrl}: ${response.status}`);
    }

    for (const row of parseClasOhlsonSeProducts(await response.text(), { retrievedAt, sourceUrl, maxRows: maxRows - rows.length })) {
      if (seen.has(row.code)) continue;
      seen.add(row.code);
      rows.push(row);
      if (rows.length >= maxRows) return rows;
    }
  }

  return rows;
}

export function parseClasOhlsonSeProducts(
  html: string,
  context: { maxRows?: number; retrievedAt: string; sourceUrl: string }
): ClasOhlsonSeProduct[] {
  const rows: ClasOhlsonSeProduct[] = [];
  const seen = new Set<string>();

  for (const candidate of extractStructuredCandidates(html)) {
    const row = normalizeClasOhlsonSeProduct(candidate, context);
    if (!row || seen.has(row.code)) continue;
    seen.add(row.code);
    rows.push(row);
    if (rows.length >= (context.maxRows ?? 100)) return rows;
  }

  return rows;
}

export function normalizeClasOhlsonSeProduct(
  candidate: ClasOhlsonCandidate,
  context: { retrievedAt: string; sourceUrl: string }
): ClasOhlsonSeProduct | null {
  const name = text(candidate.name);
  const category = text(candidate.category);
  const overlappingCategory = classifyOverlappingCategory(`${category} ${name}`);
  if (!name || !overlappingCategory) return null;

  const offer = firstObject(candidate.offers);
  const priceText = text(candidate.priceText) || text(offer?.price) || text(candidate.price);
  const price = parseSekPrice(priceText);
  if (price === null) return null;

  const code = text(candidate.sku) || text(candidate.id) || slugify(`${name}-${priceText}`);

  return {
    code,
    name,
    brand: text(candidate.brand) || 'Clas Ohlson',
    category,
    price,
    priceText: formatSekPrice(price),
    currency: 'SEK',
    country: 'SE',
    overlappingCategory,
    imageUrl: imageUrl(candidate.image),
    sourceUrl: absoluteUrl(text(candidate.url), context.sourceUrl),
    retrievedAt: context.retrievedAt
  };
}

export function classifyOverlappingCategory(value: string): ClasOhlsonSeProduct['overlappingCategory'] | null {
  return CATEGORY_MATCHERS.find(([, pattern]) => pattern.test(value))?.[0] ?? null;
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

function extractStructuredCandidates(html: string): ClasOhlsonCandidate[] {
  const candidates: ClasOhlsonCandidate[] = [];
  for (const jsonText of extractJsonScriptBodies(html)) {
    try {
      collectCandidates(JSON.parse(jsonText), candidates);
    } catch {
      // Ignore unrelated scripts.
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

function collectCandidates(value: unknown, candidates: ClasOhlsonCandidate[]) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectCandidates(item, candidates));
    return;
  }
  if (!value || typeof value !== 'object') return;
  const record = value as Record<string, unknown>;
  const type = text(record['@type'] ?? record.type).toLowerCase();
  const hasPrice = record.price !== undefined || record.priceText !== undefined || (record.offers && typeof record.offers === 'object');
  if ((type.includes('product') || record.name) && hasPrice) candidates.push(record as ClasOhlsonCandidate);
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
