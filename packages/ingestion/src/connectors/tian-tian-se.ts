import { isOverlapCategory } from './overlapCategories.js';

export type TianTianProduct = {
  country: 'SE';
  currency: 'SEK';
  chain: 'tian-tian';
  retailer_type: 'ethnic_asian';
  code: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  priceText: string;
  packageText: string;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

export type FetchTianTianProductsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

export const DEFAULT_TIAN_TIAN_SOURCE_URLS = [
  'https://wolt.com/sv/swe/stockholm/venue/asian-express-supermarket'
] as const;

export const TIAN_TIAN_CHAIN_STATUS = {
  qualifies: true,
  chain: 'tian-tian',
  publicName: 'Asian Express Supermarket',
  retailer_type: 'ethnic_asian',
  evidenceUrl: DEFAULT_TIAN_TIAN_SOURCE_URLS[0],
  evidence: 'Asian Express Supermarket is an active Stockholm grocery venue with Asian grocery categories on Wolt.'
} as const;

export async function fetchTianTianProducts(options: FetchTianTianProductsOptions = {}): Promise<TianTianProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: TianTianProduct[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of options.sourceUrls ?? DEFAULT_TIAN_TIAN_SOURCE_URLS) {
    const response = await fetchImpl(sourceUrl, htmlHeaders());
    if (!response.ok) throw new Error(`Tian Tian / Asian Express request failed for ${sourceUrl}: ${response.status}`);
    for (const product of parseTianTianProducts(await response.text(), sourceUrl, retrievedAt)) {
      if (seen.has(product.code)) continue;
      seen.add(product.code);
      rows.push(product);
      if (options.maxRows && rows.length >= options.maxRows) return rows;
    }
  }

  return rows;
}

export function parseTianTianProducts(html: string, sourceUrl: string, retrievedAt: string): TianTianProduct[] {
  const rows: TianTianProduct[] = [];
  for (const payload of extractJsonPayloads(html)) {
    visit(payload, '', (candidate, category) => {
      const row = normalizeTianTianProduct(candidate, category, sourceUrl, retrievedAt);
      if (row) rows.push(row);
    });
  }
  return rows;
}

export function normalizeTianTianProduct(
  product: Record<string, unknown>,
  parentCategory: string,
  sourceUrl: string,
  retrievedAt: string
): TianTianProduct | null {
  const category = text(product.category) || parentCategory;
  if (!category || !isOverlapCategory('ethnic_asian', category)) return null;

  const name = text(product.name ?? product.title);
  const price = priceNumber(product.price ?? product.priceText ?? product.baseprice ?? product.unitPrice);
  if (!name || price === null) return null;

  const code = text(product.id ?? product.sku ?? product.slug) || slugify(`${category}-${name}`);
  const packageText = text(product.packageText ?? product.subtitle ?? product.description);
  return {
    country: 'SE',
    currency: 'SEK',
    chain: 'tian-tian',
    retailer_type: 'ethnic_asian',
    code,
    name,
    brand: text(product.brand) || brandFromName(name),
    category,
    price,
    priceText: text(product.priceText ?? product.formattedPrice) || `${price.toFixed(2)} kr`,
    packageText,
    productUrl: absoluteUrl(text(product.url ?? product.path), sourceUrl),
    imageUrl: absoluteUrl(text(product.image ?? product.imageUrl ?? valueAt(product, ['image', 'url'])), sourceUrl),
    sourceUrl,
    retrievedAt
  };
}

function extractJsonPayloads(html: string): unknown[] {
  const payloads: unknown[] = [];
  for (const match of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)) {
    const script = match[1].trim();
    if (!script) continue;
    const directJson = script.startsWith('{') || script.startsWith('[') ? script : '';
    const assignedJson = script.match(/window\.__(?:WOLT|NEXT|INITIAL)[A-Z_]*__?\s*=\s*({[\s\S]*?});?$/)?.[1] ?? '';
    const jsonText = directJson || assignedJson;
    if (!jsonText) continue;
    try {
      payloads.push(JSON.parse(jsonText) as unknown);
    } catch {
      // Ignore unrelated inline scripts.
    }
  }
  return payloads;
}

function visit(value: unknown, category: string, onProduct: (value: Record<string, unknown>, category: string) => void): void {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) visit(item, category, onProduct);
    return;
  }
  const record = value as Record<string, unknown>;
  const nextCategory = text(record.category ?? record.title ?? record.name) || category;
  if ((record.price !== undefined || record.priceText !== undefined || record.baseprice !== undefined) && (record.name || record.title)) {
    onProduct(record, category);
  }
  for (const [key, child] of Object.entries(record)) {
    if (key === 'price' || key === 'priceText') continue;
    visit(child, nextCategory, onProduct);
  }
}

function htmlHeaders(): RequestInit {
  return {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  };
}

function valueAt(value: unknown, path: Array<string | number>): unknown {
  let current = value;
  for (const key of path) {
    if (typeof key === 'number') {
      if (!Array.isArray(current)) return undefined;
      current = current[key];
    } else {
      if (!current || typeof current !== 'object' || Array.isArray(current)) return undefined;
      current = (current as Record<string, unknown>)[key];
    }
  }
  return current;
}

function absoluteUrl(value: string, sourceUrl: string): string {
  if (!value) return '';
  return value.startsWith('https://') ? value : new URL(value, sourceUrl).toString();
}

function priceNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value > 1000 ? value / 100 : value;
  const parsed = Number.parseFloat(text(value).replace(/\s/g, '').replace(',', '.').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function brandFromName(name: string): string {
  const parts = name.split(/\s+-\s+/);
  return parts.length > 1 ? parts.at(-1)!.trim() : '';
}

function slugify(value: string): string {
  return value.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 120);
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}
