export const NORMAL_SE_PRODUCTS_URL = 'https://www.normalstores.com/se/produkter/';
export const NORMAL_SE_DEFAULT_SOURCE_URLS = [
  NORMAL_SE_PRODUCTS_URL,
  'https://www.normalstores.com/se/normala-varor/',
  'https://www.normalstores.com/se/onormala-priser/',
  'https://www.normalstores.com/se/nyheter/',
  'https://www.normalstores.com/se/testvinnare/'
] as const;
export const NORMAL_SE_PARSER_VERSION = 'normal-se-appdata-products-v1';

export type NormalSeProduct = {
  country: 'SE';
  currency: 'SEK';
  chain: 'normal-se';
  retailerType: 'cosmetics';
  code: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  priceText: string;
  pricePerUnit: string;
  available: boolean;
  maxQuantityPerOrder: number | null;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

export type FetchNormalSeProductsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

type NormalSeProductCandidate = {
  sku?: unknown;
  availabilityState?: unknown;
  image?: { url?: unknown } | null;
  pricePerUnit?: unknown;
  displayName?: unknown;
  brand?: unknown;
  unitPrice?: { value?: unknown; formatted?: unknown } | null;
  maxQuantityPerOrder?: unknown;
};

type ProductBlockProduct = {
  product?: NormalSeProductCandidate | null;
};

export async function fetchNormalSeProducts(options: FetchNormalSeProductsOptions = {}): Promise<NormalSeProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: NormalSeProduct[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of options.sourceUrls ?? NORMAL_SE_DEFAULT_SOURCE_URLS) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 normal-se-connector (+https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
      throw new Error(`Normal SE source blocked with HTTP ${response.status}.`);
    }
    if (!response.ok) throw new Error(`Normal SE source failed for ${sourceUrl}: HTTP ${response.status}.`);

    for (const product of parseNormalSeProducts(await response.text(), sourceUrl, retrievedAt)) {
      if (seen.has(product.code)) continue;
      seen.add(product.code);
      rows.push(product);
      if (options.maxRows && rows.length >= options.maxRows) return rows;
    }
  }

  return rows;
}

export function parseNormalSeProducts(html: string, sourceUrl = NORMAL_SE_PRODUCTS_URL, retrievedAt = new Date().toISOString()): NormalSeProduct[] {
  const firstPage = extractFirstPage(html);
  return collectProductBlockProducts(firstPage)
    .map((entry) => normalizeNormalSeProduct(entry.product, entry.category, sourceUrl, retrievedAt))
    .filter((product): product is NormalSeProduct => product !== null);
}

function normalizeNormalSeProduct(
  candidate: NormalSeProductCandidate | null | undefined,
  category: string,
  sourceUrl: string,
  retrievedAt: string
): NormalSeProduct | null {
  if (!candidate) return null;
  const code = text(candidate.sku);
  const name = text(candidate.displayName);
  const price = money(candidate.unitPrice?.value ?? candidate.unitPrice?.formatted);
  if (!code || !name || price === null) return null;

  return {
    country: 'SE',
    currency: 'SEK',
    chain: 'normal-se',
    retailerType: 'cosmetics',
    code,
    name,
    brand: text(candidate.brand) || 'Normal',
    category,
    price,
    priceText: formatSwedishMoney(price),
    pricePerUnit: text(candidate.pricePerUnit),
    available: !/unavailable|soldout|outofstock/i.test(text(candidate.availabilityState)),
    maxQuantityPerOrder: integerOrNull(candidate.maxQuantityPerOrder),
    productUrl: `${sourceUrl.replace(/#.*$/, '')}#sku-${encodeURIComponent(code)}`,
    imageUrl: text(candidate.image?.url),
    sourceUrl,
    retrievedAt
  };
}

function extractFirstPage(html: string): unknown {
  const match = html.match(/firstPage:\s*({[\s\S]*?})\s*,\s*isPrerenderRequest:/);
  if (!match?.[1]) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function collectProductBlockProducts(firstPage: unknown): Array<{ product: NormalSeProductCandidate; category: string }> {
  const rows: Array<{ product: NormalSeProductCandidate; category: string }> = [];
  const blocks = recordAt(firstPage, ['content'])?.blocks;
  if (!Array.isArray(blocks)) return rows;

  for (const block of blocks) {
    const content = recordAt(block, ['content']);
    const products = content?.products;
    if (!Array.isArray(products)) continue;
    const category = text(content?.title) || 'cosmetics';
    for (const entry of products as ProductBlockProduct[]) {
      if (isRecord(entry.product)) rows.push({ product: entry.product, category });
    }
  }

  return rows;
}

function recordAt(value: unknown, path: string[]): Record<string, unknown> | null {
  let current: unknown = value;
  for (const key of path) {
    if (!isRecord(current)) return null;
    current = current[key];
  }
  return isRecord(current) ? current : null;
}

function text(value: unknown): string {
  if (typeof value === 'string') return decodeHtml(value.trim());
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function money(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return Math.round((value + Number.EPSILON) * 100) / 100;
  const normalized = text(value).replace(/\s/g, '').replace(/kr|sek|:-/gi, '').replace(',', '.');
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round((parsed + Number.EPSILON) * 100) / 100 : null;
}

function integerOrNull(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number.parseInt(text(value), 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function formatSwedishMoney(value: number): string {
  return Number.isInteger(value)
    ? `${value.toLocaleString('sv-SE')} kr`
    : `${value.toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr`;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, ' ')
    .trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
