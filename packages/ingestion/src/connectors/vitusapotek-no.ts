export type VitusapotekNoProduct = {
  country: 'NO';
  currency: 'NOK';
  chain: 'vitusapotek';
  code: string;
  ean: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  priceText: string;
  originalPrice: number | null;
  originalPriceText: string;
  stockStatus: string;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

type VitusapotekOffer = {
  price?: unknown;
  priceCurrency?: unknown;
  availability?: unknown;
};

type VitusapotekJsonProduct = {
  '@type'?: unknown;
  sku?: unknown;
  gtin?: unknown;
  gtin13?: unknown;
  ean?: unknown;
  name?: unknown;
  brand?: { name?: unknown } | string;
  category?: unknown;
  image?: unknown;
  offers?: VitusapotekOffer | VitusapotekOffer[];
  url?: unknown;
};

export type FetchVitusapotekNoProductsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

export const VITUSAPOTEK_NO_BASE_URL = 'https://www.vitusapotek.no';

export const DEFAULT_VITUSAPOTEK_NO_SOURCE_URLS = [
  'https://www.vitusapotek.no/search?text=vitamin',
  'https://www.vitusapotek.no/search?text=paracet',
  'https://www.vitusapotek.no/search?text=solkrem',
  'https://www.vitusapotek.no/search?text=tannkrem',
  'https://www.vitusapotek.no/produkter/kosttilskudd',
  'https://www.vitusapotek.no/produkter/hudpleie'
] as const;

export async function fetchVitusapotekNoProducts(options: FetchVitusapotekNoProductsOptions = {}): Promise<VitusapotekNoProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: VitusapotekNoProduct[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of options.sourceUrls ?? DEFAULT_VITUSAPOTEK_NO_SOURCE_URLS) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryViewBot/1.0 (+https://groceryview.se)'
      }
    });

    if (!response.ok) {
      throw new Error(`Vitusapotek request failed for ${sourceUrl}: ${response.status}`);
    }

    for (const product of parseVitusapotekNoProducts(await response.text(), sourceUrl, retrievedAt)) {
      const key = product.ean || product.code || product.productUrl;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(product);
      if (options.maxRows && rows.length >= options.maxRows) {
        return rows;
      }
    }
  }

  return rows;
}

export function parseVitusapotekNoProducts(html: string, sourceUrl: string, retrievedAt: string): VitusapotekNoProduct[] {
  return extractJsonLdProducts(html)
    .map((product) => normalizeVitusapotekNoProduct(product, sourceUrl, retrievedAt))
    .filter((product): product is VitusapotekNoProduct => product !== null);
}

export function normalizeVitusapotekNoProduct(
  product: VitusapotekJsonProduct,
  sourceUrl: string,
  retrievedAt: string
): VitusapotekNoProduct | null {
  const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
  const price = numberFromText(offer?.price);
  const name = text(product.name);
  const ean = eanText(product.gtin13 ?? product.gtin ?? product.ean);

  if (!name || !ean || price === null) {
    return null;
  }

  const productUrl = absoluteUrl(product.url, VITUSAPOTEK_NO_BASE_URL);
  return {
    country: 'NO',
    currency: 'NOK',
    chain: 'vitusapotek',
    code: text(product.sku) || ean,
    ean,
    name,
    brand: typeof product.brand === 'string' ? product.brand : text(product.brand?.name),
    category: text(product.category),
    price,
    priceText: `${price.toFixed(2)} NOK`,
    originalPrice: null,
    originalPriceText: '',
    stockStatus: text(offer?.availability).replace('https://schema.org/', ''),
    productUrl,
    imageUrl: absoluteUrl(Array.isArray(product.image) ? product.image[0] : product.image, VITUSAPOTEK_NO_BASE_URL),
    sourceUrl,
    retrievedAt
  };
}

function extractJsonLdProducts(html: string) {
  const products: VitusapotekJsonProduct[] = [];
  const scriptPattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptPattern.exec(html)) !== null) {
    const parsed = parseJson(match[1]);
    visit(parsed, (value) => {
      const candidate = value as VitusapotekJsonProduct;
      if (candidate?.['@type'] === 'Product' && candidate.name && candidate.offers) {
        products.push(candidate);
      }
    });
  }

  return products;
}

function visit(value: unknown, visitor: (value: unknown) => void) {
  visitor(value);
  if (Array.isArray(value)) {
    value.forEach((item) => visit(item, visitor));
    return;
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => visit(item, visitor));
  }
}

function parseJson(value: string | undefined) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function eanText(value: unknown) {
  const normalized = text(value).replace(/\D/g, '');
  return normalized.length >= 8 ? normalized : '';
}

function numberFromText(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const normalized = value.replace(/\s/g, '').replace(',', '.').match(/\d+(?:\.\d+)?/);
  if (!normalized) return null;
  const parsed = Number(normalized[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function absoluteUrl(value: unknown, baseUrl: string) {
  const path = text(value);
  if (!path) return '';
  return new URL(path, baseUrl).toString();
}
