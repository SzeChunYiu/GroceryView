export type NaturkraftSeProduct = {
  chain: 'naturkraft-se';
  country: 'SE';
  category: 'health_food';
  code: string;
  name: string;
  brand: string;
  price: number;
  priceText: string;
  currency: 'SEK';
  stockStatus: string;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

type NaturkraftRawProduct = {
  '@type'?: unknown;
  brand?: unknown;
  image?: unknown;
  name?: unknown;
  offers?: { availability?: unknown; price?: unknown; priceCurrency?: unknown; url?: unknown } | Array<{ availability?: unknown; price?: unknown; priceCurrency?: unknown; url?: unknown }>;
  price?: unknown;
  sku?: unknown;
  url?: unknown;
};

export type FetchNaturkraftSeProductsOptions = {
  fetchImpl?: typeof fetch;
  maxRows?: number;
  retrievedAt?: string;
  sourceUrls?: readonly string[];
};

export const NATURKRAFT_SE_BASE_URL = 'https://naturkraft.se';

export const DEFAULT_NATURKRAFT_SE_SOURCE_URLS = [
  'https://naturkraft.se/',
  'https://naturkraft.se/collections/all',
  'https://naturkraft.se/collections/kosttillskott',
  'https://naturkraft.se/collections/halsokost'
] as const;

export async function fetchNaturkraftSeProducts(options: FetchNaturkraftSeProductsOptions = {}): Promise<NaturkraftSeProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: NaturkraftSeProduct[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of options.sourceUrls ?? DEFAULT_NATURKRAFT_SE_SOURCE_URLS) {
    const response = await fetchImpl(sourceUrl, { headers: { accept: 'text/html,application/xhtml+xml' } });
    if (!response.ok) {
      throw new Error(`Naturkraft request failed for ${sourceUrl}: ${response.status}`);
    }

    for (const product of parseNaturkraftSeProducts(await response.text(), sourceUrl, retrievedAt)) {
      if (seen.has(product.code)) continue;
      seen.add(product.code);
      rows.push(product);
      if (options.maxRows && rows.length >= options.maxRows) return rows;
    }
  }

  return rows;
}

export function parseNaturkraftSeProducts(html: string, sourceUrl: string, retrievedAt: string): NaturkraftSeProduct[] {
  const candidates: NaturkraftRawProduct[] = [];
  for (const data of extractJsonLd(html)) {
    visit(data, (value) => {
      const candidate = value as NaturkraftRawProduct;
      if ((candidate.name && candidate.offers) || (candidate.name && candidate.price)) candidates.push(candidate);
    });
  }

  return candidates
    .map((product) => normalizeNaturkraftSeProduct(product, sourceUrl, retrievedAt))
    .filter((product): product is NaturkraftSeProduct => product !== null);
}

export function normalizeNaturkraftSeProduct(
  product: NaturkraftRawProduct,
  sourceUrl: string,
  retrievedAt: string
): NaturkraftSeProduct | null {
  const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
  const name = text(product.name);
  const price = numberFromText(offer?.price ?? product.price);
  const code = text(product.sku) || slugFromText(name);
  if (!name || !code || price === null) return null;

  return {
    chain: 'naturkraft-se',
    country: 'SE',
    category: 'health_food',
    code,
    name,
    brand: brandText(product.brand),
    price,
    priceText: `${price.toFixed(2)} SEK`,
    currency: 'SEK',
    stockStatus: text(offer?.availability),
    productUrl: absoluteUrl(offer?.url ?? product.url, NATURKRAFT_SE_BASE_URL),
    imageUrl: absoluteUrl(firstImage(product.image), NATURKRAFT_SE_BASE_URL),
    sourceUrl,
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
