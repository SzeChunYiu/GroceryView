export type NaturkraftSeProduct = {
  brand: string;
  category: 'health_food';
  currency: 'SEK';
  name: string;
  price: number;
  productId: string;
  sourceUrl: string;
  url: string;
};

export type NaturkraftSeStore = {
  address: string;
  category: 'health_food';
  city: string;
  countryCode: 'SE';
  name: string;
  sourceUrl: string;
  storeId: string;
  url: string;
};

type ProductJsonLd = {
  '@type'?: unknown;
  brand?: { name?: unknown } | string;
  name?: unknown;
  offers?: { price?: unknown; priceCurrency?: unknown; url?: unknown };
  sku?: unknown;
  url?: unknown;
};

type StoreJsonLd = {
  '@type'?: unknown;
  address?: { addressLocality?: unknown; streetAddress?: unknown } | string;
  name?: unknown;
  url?: unknown;
};

export const naturkraftSeConnector = {
  id: 'naturkraft-se',
  chain: 'Hälsokraft',
  country: 'SE',
  category: 'health_food',
  baseUrl: 'https://www.halsokraft.se'
} as const;

export function normalizeNaturkraftSeProduct(payload: ProductJsonLd, sourceUrl = naturkraftSeConnector.baseUrl): NaturkraftSeProduct | null {
  if (!hasType(payload['@type'], 'Product')) return null;
  const name = text(payload.name);
  const price = numberOrNull(payload.offers?.price);
  if (!name || price === null) return null;
  return {
    brand: typeof payload.brand === 'string' ? payload.brand : text(payload.brand?.name),
    category: 'health_food',
    currency: 'SEK',
    name,
    price,
    productId: text(payload.sku) || slugify(name),
    sourceUrl,
    url: absoluteUrl(text(payload.offers?.url) || text(payload.url) || sourceUrl, sourceUrl)
  };
}

export function normalizeNaturkraftSeStore(payload: StoreJsonLd, sourceUrl = naturkraftSeConnector.baseUrl): NaturkraftSeStore | null {
  if (!hasType(payload['@type'], 'Store') && !hasType(payload['@type'], 'LocalBusiness')) return null;
  const name = text(payload.name) || naturkraftSeConnector.chain;
  const address = typeof payload.address === 'string' ? payload.address : text(payload.address?.streetAddress);
  const city = typeof payload.address === 'string' ? '' : text(payload.address?.addressLocality);
  if (!address && !city) return null;
  return {
    address,
    category: 'health_food',
    city,
    countryCode: 'SE',
    name,
    sourceUrl,
    storeId: slugify(`${name}-${address}-${city}`),
    url: absoluteUrl(text(payload.url) || sourceUrl, sourceUrl)
  };
}

export function extractNaturkraftSeJsonLd(html: string): Array<ProductJsonLd | StoreJsonLd> {
  const rows: Array<ProductJsonLd | StoreJsonLd> = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(match[1].trim()) as ProductJsonLd | StoreJsonLd | Array<ProductJsonLd | StoreJsonLd>;
      rows.push(...(Array.isArray(parsed) ? parsed : [parsed]));
    } catch {
      continue;
    }
  }
  return rows;
}

export function parseNaturkraftSePage(html: string, sourceUrl = naturkraftSeConnector.baseUrl) {
  const payloads = extractNaturkraftSeJsonLd(html);
  return {
    products: payloads.map((payload) => normalizeNaturkraftSeProduct(payload as ProductJsonLd, sourceUrl)).filter((row): row is NaturkraftSeProduct => Boolean(row)),
    stores: payloads.map((payload) => normalizeNaturkraftSeStore(payload as StoreJsonLd, sourceUrl)).filter((row): row is NaturkraftSeStore => Boolean(row))
  };
}

function hasType(value: unknown, typeName: string): boolean {
  return Array.isArray(value) ? value.includes(typeName) : value === typeName;
}

function absoluteUrl(value: string, baseUrl: string): string {
  return new URL(value, baseUrl).toString();
}

function numberOrNull(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.replace(',', '.')) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function slugify(value: string): string {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
