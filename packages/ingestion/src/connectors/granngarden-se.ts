export type GranngardenProduct = {
  code: string;
  name: string;
  brand: string;
  packageText: string;
  category: string;
  price: number;
  priceText: string;
  currency: 'SEK';
  country: 'SE';
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

type GranngardenProductCandidate = {
  sku?: unknown;
  id?: unknown;
  gtin?: unknown;
  name?: unknown;
  brand?: unknown;
  category?: unknown;
  description?: unknown;
  image?: unknown;
  url?: unknown;
  offers?: { price?: unknown; priceCurrency?: unknown } | Array<{ price?: unknown; priceCurrency?: unknown }>;
  price?: unknown;
  priceCurrency?: unknown;
};

export const GRANNGARDEN_BASE_URL = 'https://www.granngarden.se';
export const DEFAULT_GRANNGARDEN_SEARCH_QUERIES = ['hundmat', 'kattmat', 'fågelfrö', 'jord', 'pellets', 'tvättmedel'] as const;
export const DEFAULT_GRANNGARDEN_MAX_ROWS = 1000;

export type FetchGranngardenProductsOptions = {
  fetchImpl?: typeof fetch;
  queries?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

export function buildGranngardenSearchUrl(query: string): string {
  const url = new URL('/sok', GRANNGARDEN_BASE_URL);
  url.searchParams.set('q', query);
  return url.toString();
}

export async function fetchGranngardenProducts(options: FetchGranngardenProductsOptions = {}): Promise<GranngardenProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const queries = options.queries ?? DEFAULT_GRANNGARDEN_SEARCH_QUERIES;
  const maxRows = options.maxRows ?? DEFAULT_GRANNGARDEN_MAX_ROWS;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: GranngardenProduct[] = [];
  const seen = new Set<string>();

  for (const query of queries) {
    const sourceUrl = buildGranngardenSearchUrl(query);
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml,application/json',
        'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (!response.ok) throw new Error(`Granngården search request failed for ${query}: ${response.status}`);

    for (const row of parseGranngardenProducts(await response.text(), sourceUrl, retrievedAt)) {
      if (seen.has(row.code)) continue;
      seen.add(row.code);
      rows.push(row);
      if (rows.length >= maxRows) return rows;
    }
  }

  return rows;
}

export function parseGranngardenProducts(html: string, sourceUrl: string, retrievedAt: string): GranngardenProduct[] {
  const candidates = [
    ...parseJsonLdProducts(html),
    ...parseNextDataProducts(html)
  ];
  const rows: GranngardenProduct[] = [];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    const row = normalizeGranngardenProduct(candidate, sourceUrl, retrievedAt);
    if (!row || seen.has(row.code)) continue;
    seen.add(row.code);
    rows.push(row);
  }
  return rows;
}

export function normalizeGranngardenProduct(candidate: GranngardenProductCandidate, sourceUrl: string, retrievedAt: string): GranngardenProduct | null {
  const name = text(candidate.name);
  const offer = Array.isArray(candidate.offers) ? candidate.offers[0] : candidate.offers;
  const price = numberValue(offer?.price ?? candidate.price);
  if (!name || price === null) return null;

  const image = Array.isArray(candidate.image) ? candidate.image[0] : candidate.image;
  return {
    code: text(candidate.gtin ?? candidate.sku ?? candidate.id) || slugify(name),
    name,
    brand: brandText(candidate.brand),
    packageText: packageTextFrom(candidate.description ?? name),
    category: text(candidate.category),
    price,
    priceText: `${price.toFixed(2)} SEK`,
    currency: 'SEK',
    country: 'SE',
    productUrl: absoluteUrl(text(candidate.url), sourceUrl),
    imageUrl: absoluteUrl(text(image), sourceUrl),
    sourceUrl,
    retrievedAt
  };
}

function parseJsonLdProducts(html: string): GranngardenProductCandidate[] {
  const rows: GranngardenProductCandidate[] = [];
  const scriptPattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(scriptPattern)) {
    try {
      collectProductCandidates(JSON.parse(decodeHtml(match[1])), rows);
    } catch {
      // Ignore unrelated script blocks.
    }
  }
  return rows;
}

function parseNextDataProducts(html: string): GranngardenProductCandidate[] {
  const match = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!match) return [];
  const rows: GranngardenProductCandidate[] = [];
  try {
    collectProductCandidates(JSON.parse(decodeHtml(match[1])), rows);
  } catch {
    return [];
  }
  return rows;
}

function collectProductCandidates(value: unknown, rows: GranngardenProductCandidate[]): void {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) collectProductCandidates(item, rows);
    return;
  }
  const object = value as Record<string, unknown>;
  const type = object['@type'];
  const typeText = Array.isArray(type) ? type.join(' ') : text(type);
  if (/Product/i.test(typeText) || (object.name && (object.offers || object.price))) rows.push(object as GranngardenProductCandidate);
  if (Array.isArray(object.itemListElement)) collectProductCandidates(object.itemListElement, rows);
  if (object.item) collectProductCandidates(object.item, rows);
  if (object.product) collectProductCandidates(object.product, rows);
  if (object.products) collectProductCandidates(object.products, rows);
  if (object.props) collectProductCandidates(object.props, rows);
}

function brandText(value: unknown): string {
  if (!value || typeof value !== 'object') return text(value);
  return text((value as { name?: unknown }).name);
}

function packageTextFrom(value: unknown): string {
  const label = text(value);
  return label.match(/\b\d+[,.]?\d*\s?(g|kg|ml|l|st|stk|pack|säck)\b/i)?.[0] ?? '';
}

function absoluteUrl(value: string, sourceUrl: string): string {
  if (!value) return '';
  try {
    return new URL(value, sourceUrl).toString();
  } catch {
    return value;
  }
}

function numberValue(value: unknown): number | null {
  const numeric = typeof value === 'number' ? value : Number.parseFloat(text(value).replace(',', '.'));
  return Number.isFinite(numeric) ? numeric : null;
}

function slugify(value: string): string {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}

function decodeHtml(value: string | undefined): string {
  return (value ?? '').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').trim();
}
