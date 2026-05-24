export type MlynNoProduct = {
  chain: 'mlyn-no';
  country: 'NO';
  category: 'ethnic_polish_eastern_european';
  storeId: string;
  storeName: string;
  code: string;
  name: string;
  brand: string;
  price: number;
  priceText: string;
  currency: 'NOK';
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

type MlynNoRawProduct = {
  '@type'?: unknown;
  brand?: unknown;
  image?: unknown;
  name?: unknown;
  offers?: { price?: unknown; priceCurrency?: unknown; url?: unknown } | Array<{ price?: unknown; priceCurrency?: unknown; url?: unknown }>;
  price?: unknown;
  sku?: unknown;
  url?: unknown;
};

export type MlynNoStoreSource = {
  id: string;
  name: string;
  url: string;
};

export type FetchMlynNoProductsOptions = {
  fetchImpl?: typeof fetch;
  maxRows?: number;
  retrievedAt?: string;
  stores?: readonly MlynNoStoreSource[];
};

export const MLYN_NO_BASE_URL = 'https://mlyn.no';

export const DEFAULT_MLYN_NO_STORES = [
  { id: 'mlyn-no-oslo', name: 'Mlyn Oslo', url: 'https://mlyn.no/' },
  { id: 'mlyn-no-nettbutikk', name: 'Mlyn nettbutikk', url: 'https://mlyn.no/collections/all' }
] as const;

export async function fetchMlynNoProducts(options: FetchMlynNoProductsOptions = {}): Promise<MlynNoProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const stores = options.stores ?? DEFAULT_MLYN_NO_STORES;
  const rows: MlynNoProduct[] = [];
  const seen = new Set<string>();

  for (const store of stores) {
    const response = await fetchImpl(store.url, { headers: { accept: 'text/html,application/xhtml+xml' } });
    if (!response.ok) {
      throw new Error(`Mlyn request failed for ${store.url}: ${response.status}`);
    }

    for (const product of parseMlynNoProducts(await response.text(), store, retrievedAt)) {
      const dedupeKey = `${product.storeId}:${product.code}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      rows.push(product);
      if (options.maxRows && rows.length >= options.maxRows) return rows;
    }
  }

  return rows;
}

export function parseMlynNoProducts(html: string, store: MlynNoStoreSource, retrievedAt: string): MlynNoProduct[] {
  const products: MlynNoRawProduct[] = [];
  for (const data of extractJsonLd(html)) {
    visit(data, (value) => {
      const candidate = value as MlynNoRawProduct;
      if ((candidate.name && candidate.offers) || (candidate.name && candidate.price)) {
        products.push(candidate);
      }
    });
  }

  return products
    .map((product) => normalizeMlynNoProduct(product, store, retrievedAt))
    .filter((product): product is MlynNoProduct => product !== null);
}

export function normalizeMlynNoProduct(
  product: MlynNoRawProduct,
  store: MlynNoStoreSource,
  retrievedAt: string
): MlynNoProduct | null {
  const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
  const name = text(product.name);
  const price = numberFromText(offer?.price ?? product.price);
  const code = text(product.sku) || slugFromText(name);
  if (!name || !code || price === null) return null;

  return {
    chain: 'mlyn-no',
    country: 'NO',
    category: 'ethnic_polish_eastern_european',
    storeId: store.id,
    storeName: store.name,
    code,
    name,
    brand: brandText(product.brand),
    price,
    priceText: `${price.toFixed(2)} NOK`,
    currency: 'NOK',
    productUrl: absoluteUrl(offer?.url ?? product.url, MLYN_NO_BASE_URL),
    imageUrl: absoluteUrl(firstImage(product.image), MLYN_NO_BASE_URL),
    sourceUrl: store.url,
    retrievedAt
  };
}

function extractJsonLd(html: string): unknown[] {
  return [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].flatMap((match) => parseJson(match[1] ?? ''));
}

function parseJson(source: string): unknown[] {
  try {
    return [JSON.parse(source.trim())];
  } catch {
    return [];
  }
}

function visit(value: unknown, callback: (value: unknown) => void): void {
  callback(value);
  if (Array.isArray(value)) {
    for (const item of value) visit(item, callback);
    return;
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) visit(item, callback);
  }
}

function absoluteUrl(value: unknown, baseUrl: string): string {
  const raw = text(value);
  return raw ? new URL(raw, baseUrl).toString() : '';
}

function brandText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (value && typeof value === 'object' && 'name' in value) return text((value as { name?: unknown }).name);
  return '';
}

function firstImage(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value;
}

function numberFromText(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const parsed = Number.parseFloat(value.replace(/[^\d,.]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function slugFromText(value: string): string {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
