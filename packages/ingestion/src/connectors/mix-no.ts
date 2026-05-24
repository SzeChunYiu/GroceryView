export type MixNoProduct = {
  code: string;
  name: string;
  brand: string;
  packageText: string;
  category: string;
  price: number;
  priceText: string;
  currency: 'NOK';
  country: 'NO';
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

type MixNoProductCandidate = {
  sku?: unknown;
  id?: unknown;
  gtin?: unknown;
  name?: unknown;
  brand?: unknown;
  category?: unknown;
  description?: unknown;
  image?: unknown;
  url?: unknown;
  offers?: {
    price?: unknown;
    priceCurrency?: unknown;
  } | Array<{
    price?: unknown;
    priceCurrency?: unknown;
  }>;
  price?: unknown;
  priceCurrency?: unknown;
};

export const MIX_NO_BASE_URL = 'https://mixmix.no';
export const DEFAULT_MIX_NO_SEARCH_QUERIES = ['kaffe', 'sjokolade', 'brus', 'is', 'pølse', 'baguette'] as const;
export const DEFAULT_MIX_NO_MAX_ROWS = 500;

export type FetchMixNoProductsOptions = {
  fetchImpl?: typeof fetch;
  queries?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

export function buildMixNoSearchUrl(query: string): string {
  const url = new URL('/search', MIX_NO_BASE_URL);
  url.searchParams.set('q', query);
  return url.toString();
}

export async function fetchMixNoProducts(options: FetchMixNoProductsOptions = {}): Promise<MixNoProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const queries = options.queries ?? DEFAULT_MIX_NO_SEARCH_QUERIES;
  const maxRows = options.maxRows ?? DEFAULT_MIX_NO_MAX_ROWS;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: MixNoProduct[] = [];
  const seen = new Set<string>();

  for (const query of queries) {
    const sourceUrl = buildMixNoSearchUrl(query);
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml,application/json',
        'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (!response.ok) throw new Error(`Mix NO search request failed for ${query}: ${response.status}`);

    for (const row of parseMixNoProducts(await response.text(), sourceUrl, retrievedAt)) {
      if (seen.has(row.code)) continue;
      seen.add(row.code);
      rows.push(row);
      if (rows.length >= maxRows) return rows;
    }
  }

  return rows;
}

export function parseMixNoProducts(html: string, sourceUrl: string, retrievedAt: string): MixNoProduct[] {
  const candidates = [
    ...parseJsonLdProducts(html),
    ...parseNextDataProducts(html)
  ];
  const rows: MixNoProduct[] = [];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    const row = normalizeMixNoProduct(candidate, sourceUrl, retrievedAt);
    if (!row || seen.has(row.code)) continue;
    seen.add(row.code);
    rows.push(row);
  }
  return rows;
}

export function normalizeMixNoProduct(candidate: MixNoProductCandidate, sourceUrl: string, retrievedAt: string): MixNoProduct | null {
  const name = text(candidate.name);
  const offer = Array.isArray(candidate.offers) ? candidate.offers[0] : candidate.offers;
  const price = numberValue(offer?.price ?? candidate.price);
  if (!name || price === null) return null;

  const code = text(candidate.gtin ?? candidate.sku ?? candidate.id) || slugify(name);
  const productUrl = absoluteUrl(text(candidate.url), sourceUrl);
  const image = Array.isArray(candidate.image) ? candidate.image[0] : candidate.image;
  return {
    code,
    name,
    brand: brandText(candidate.brand),
    packageText: packageTextFrom(candidate.description),
    category: text(candidate.category),
    price,
    priceText: `${price.toFixed(2)} NOK`,
    currency: 'NOK',
    country: 'NO',
    productUrl,
    imageUrl: absoluteUrl(text(image), sourceUrl),
    sourceUrl,
    retrievedAt
  };
}

function parseJsonLdProducts(html: string): MixNoProductCandidate[] {
  const rows: MixNoProductCandidate[] = [];
  const scriptPattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(scriptPattern)) {
    const json = decodeHtml(match[1]);
    try {
      collectProductCandidates(JSON.parse(json), rows);
    } catch {
      // Ignore unrelated or malformed script blocks.
    }
  }
  return rows;
}

function parseNextDataProducts(html: string): MixNoProductCandidate[] {
  const match = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!match) return [];
  const rows: MixNoProductCandidate[] = [];
  try {
    collectProductCandidates(JSON.parse(decodeHtml(match[1])), rows);
  } catch {
    return [];
  }
  return rows;
}

function collectProductCandidates(value: unknown, rows: MixNoProductCandidate[]): void {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) collectProductCandidates(item, rows);
    return;
  }

  const object = value as Record<string, unknown>;
  const type = object['@type'];
  const typeText = Array.isArray(type) ? type.join(' ') : text(type);
  if (/Product/i.test(typeText) || (object.name && (object.offers || object.price))) {
    rows.push(object as MixNoProductCandidate);
  }

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
  const description = text(value);
  return description.match(/\b\d+[,.]?\d*\s?(g|kg|ml|l|stk|pk)\b/i)?.[0] ?? '';
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

function decodeHtml(value: string): string {
  return value.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').trim();
}
