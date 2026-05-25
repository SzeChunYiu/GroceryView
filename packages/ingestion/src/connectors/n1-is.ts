export type N1IsChain = 'n1-is';

export type N1IsProduct = {
  chain: N1IsChain;
  code: string;
  name: string;
  price: number;
  priceText: string;
  category: string;
  productUrl: string;
  imageUrl: string;
  inStock: boolean;
  sourceUrl: string;
  retrievedAt: string;
};

export type FetchN1IsProductsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

export const N1_IS_STORE_BASE_URL = 'https://www.n1.is';
export const DEFAULT_N1_IS_PRODUCT_URLS = [`${N1_IS_STORE_BASE_URL}/verslun/`] as const;

type N1FixtureProduct = {
  category?: unknown;
  code?: unknown;
  id?: unknown;
  image?: unknown;
  inStock?: unknown;
  name?: unknown;
  price?: unknown;
  productUrl?: unknown;
  slug?: unknown;
  title?: unknown;
  url?: unknown;
};

export async function fetchN1IsProducts(options: FetchN1IsProductsOptions = {}): Promise<N1IsProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: N1IsProduct[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of options.sourceUrls ?? DEFAULT_N1_IS_PRODUCT_URLS) {
    const response = await fetchImpl(sourceUrl, jsonHeaders());
    if (!response.ok) throw new Error(`N1 request failed for ${sourceUrl}: ${response.status}`);
    addRows(rows, seen, parseN1IsProducts(await response.text(), sourceUrl, retrievedAt), options.maxRows);
    if (options.maxRows && rows.length >= options.maxRows) return rows;
  }

  return rows;
}

export function parseN1IsProducts(fixtureText: string, sourceUrl: string, retrievedAt: string): N1IsProduct[] {
  const payload = JSON.parse(fixtureText) as { products?: unknown; data?: unknown };
  const candidates = Array.isArray(payload.products) ? payload.products : Array.isArray(payload.data) ? payload.data : [];
  return candidates
    .map((candidate) => normalizeN1IsProduct(candidate as N1FixtureProduct, sourceUrl, retrievedAt))
    .filter((product): product is N1IsProduct => product !== null);
}

export function normalizeN1IsProduct(product: N1FixtureProduct, sourceUrl: string, retrievedAt: string): N1IsProduct | null {
  const name = text(product.name ?? product.title);
  const priceText = text(product.price);
  const price = numberFromIcelandicPrice(priceText);
  if (!name || price === null) return null;

  const code = text(product.code ?? product.id) || stableCode(name);
  const productUrl = absoluteUrl(text(product.productUrl ?? product.url ?? product.slug), sourceUrl);
  return {
    chain: 'n1-is',
    code,
    name,
    price,
    priceText,
    category: text(product.category) || 'uncategorized',
    productUrl,
    imageUrl: absoluteUrl(text(product.image), sourceUrl),
    inStock: product.inStock !== false,
    sourceUrl,
    retrievedAt
  };
}

function addRows(rows: N1IsProduct[], seen: Set<string>, products: readonly N1IsProduct[], maxRows: number | undefined): void {
  for (const product of products) {
    const key = `${product.chain}:${product.code}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(product);
    if (maxRows && rows.length >= maxRows) return;
  }
}

function jsonHeaders(): RequestInit {
  return {
    headers: {
      accept: 'application/json,text/plain;q=0.9,*/*;q=0.8',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  };
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function numberFromIcelandicPrice(value: string): number | null {
  const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function stableCode(name: string): string {
  return name.toLocaleLowerCase('is-IS').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function absoluteUrl(value: string, baseUrl: string): string {
  if (!value) return '';
  return new URL(value, baseUrl).toString();
}
