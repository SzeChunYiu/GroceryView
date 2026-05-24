export const NORMAL_NO_BASE_URL = 'https://www.normal.no';
export const NORMAL_NO_CONNECTOR_VERSION = 'normal-no-cosmetics-v1';

export type NormalNoProduct = {
  chain: 'normal-no';
  market: 'NO';
  category: 'cosmetics';
  sku: string;
  ean: string;
  name: string;
  brand: string;
  price: number;
  priceText: string;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
  provenance: {
    source: 'normal_no';
    parserVersion: string;
    rawName: string;
  };
};

type NormalRawProduct = Record<string, unknown>;

type FetchNormalNoProductsOptions = {
  fetchImpl?: typeof fetch;
  sourcePaths?: readonly string[];
  retrievedAt?: string;
  maxRows?: number;
};

export const DEFAULT_NORMAL_NO_SOURCE_PATHS = [
  '/produkter/kropp-og-hudpleie',
  '/produkter/haarpleie',
  '/produkter/sminke',
  '/produkter/duft'
] as const;

export const normalNoTestFixture = {
  products: [{
    sku: 'normal-mascara-01',
    ean: '5700000000001',
    name: 'Volume Mascara',
    brand: 'Normal',
    price: '39,00 kr',
    url: '/produkter/sminke/volume-mascara',
    imageUrl: 'https://www.normal.no/images/volume-mascara.png'
  }]
};

export async function fetchNormalNoProducts(options: FetchNormalNoProductsOptions = {}): Promise<NormalNoProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: NormalNoProduct[] = [];
  const seen = new Set<string>();

  for (const path of options.sourcePaths ?? DEFAULT_NORMAL_NO_SOURCE_PATHS) {
    const sourceUrl = absoluteUrl(path, NORMAL_NO_BASE_URL);
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml,application/json',
        'user-agent': 'GroceryView normal-no connector (+https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (!response.ok) throw new Error(`Normal.no request failed for ${sourceUrl}: ${response.status}`);
    const contentType = response.headers.get('content-type') ?? '';
    const payload = contentType.includes('json') ? await response.json() : extractJsonPayload(await response.text());
    for (const row of parseNormalNoProducts(payload, sourceUrl, retrievedAt)) {
      const key = row.ean || row.sku || row.productUrl;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(row);
      if (options.maxRows && rows.length >= options.maxRows) return rows;
    }
  }

  return rows;
}

export function parseNormalNoProducts(payload: unknown, sourceUrl: string, retrievedAt: string): NormalNoProduct[] {
  const products: NormalRawProduct[] = [];
  visit(payload, (value) => {
    const candidate = value as NormalRawProduct;
    if ((candidate.name || candidate.title) && (candidate.price || candidate.currentPrice || candidate.salesPrice)) {
      products.push(candidate);
    }
  });

  return products
    .map((product) => normalizeNormalNoProduct(product, sourceUrl, retrievedAt))
    .filter((product): product is NormalNoProduct => product !== null);
}

export function normalizeNormalNoProduct(product: NormalRawProduct, sourceUrl: string, retrievedAt: string): NormalNoProduct | null {
  const name = text(product.name) || text(product.title);
  const productPrice = price(product.price) ?? price(product.currentPrice) ?? price(product.salesPrice);
  if (!name || productPrice === null) return null;
  const nestedImageUrl = isRecord(product.image) ? text(product.image.url) : '';

  return {
    chain: 'normal-no',
    market: 'NO',
    category: 'cosmetics',
    sku: text(product.sku) || text(product.id) || stableSlug(name),
    ean: digits(text(product.ean) || text(product.gtin) || text(product.barcode)),
    name,
    brand: text(product.brand) || text(product.manufacturer) || 'Normal',
    price: productPrice,
    priceText: `${productPrice.toFixed(2)} NOK`,
    productUrl: absoluteUrl(text(product.url) || text(product.productUrl), NORMAL_NO_BASE_URL),
    imageUrl: absoluteUrl(text(product.imageUrl) || nestedImageUrl, NORMAL_NO_BASE_URL),
    sourceUrl,
    retrievedAt,
    provenance: {
      source: 'normal_no',
      parserVersion: NORMAL_NO_CONNECTOR_VERSION,
      rawName: name
    }
  };
}

function extractJsonPayload(html: string): unknown {
  const next = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i);
  if (next) return safeJson(next[1]);
  const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  if (ld) return safeJson(ld[1]);
  return {};
}

function safeJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function visit(value: unknown, visitor: (value: unknown) => void) {
  visitor(value);
  if (Array.isArray(value)) {
    for (const item of value) visit(item, visitor);
  } else if (isRecord(value)) {
    for (const item of Object.values(value)) visit(item, visitor);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function price(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const parsed = Number.parseFloat(value.replace(',', '.').replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function digits(value: string): string {
  return value.replace(/\D/g, '');
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

function stableSlug(value: string): string {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
