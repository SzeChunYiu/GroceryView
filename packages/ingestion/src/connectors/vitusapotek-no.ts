export type VitusapotekProduct = {
  country: 'NO';
  currency: 'NOK';
  chain: 'vitusapotek';
  code: string;
  ean: string;
  name: string;
  brand: string;
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

type VitusapotekCandidate = {
  id?: unknown;
  sku?: unknown;
  code?: unknown;
  ean?: unknown;
  gtin?: unknown;
  name?: unknown;
  title?: unknown;
  brand?: unknown;
  brandName?: unknown;
  price?: unknown;
  currentPrice?: unknown;
  salesPrice?: unknown;
  originalPrice?: unknown;
  beforePrice?: unknown;
  url?: unknown;
  productUrl?: unknown;
  slug?: unknown;
  image?: unknown;
  imageUrl?: unknown;
  availability?: unknown;
  stockStatus?: unknown;
};

export type FetchVitusapotekProductsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

export const VITUSAPOTEK_BASE_URL = 'https://www.vitusapotek.no';
export const DEFAULT_VITUSAPOTEK_SOURCE_URLS = [
  `${VITUSAPOTEK_BASE_URL}/search?text=vitamin`,
  `${VITUSAPOTEK_BASE_URL}/search?text=paracet`,
  `${VITUSAPOTEK_BASE_URL}/search?text=solkrem`,
  `${VITUSAPOTEK_BASE_URL}/search?text=tannkrem`
] as const;

export async function fetchVitusapotekProducts(options: FetchVitusapotekProductsOptions = {}): Promise<VitusapotekProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: VitusapotekProduct[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of options.sourceUrls ?? DEFAULT_VITUSAPOTEK_SOURCE_URLS) {
    const response = await fetchImpl(sourceUrl, { headers: { accept: 'text/html,application/xhtml+xml' } });
    if (!response.ok) {
      throw new Error(`Vitusapotek request failed for ${sourceUrl}: ${response.status}`);
    }

    for (const product of parseVitusapotekProducts(await response.text(), sourceUrl, retrievedAt)) {
      const key = product.ean || product.code || product.productUrl;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(product);
      if (options.maxRows && rows.length >= options.maxRows) return rows;
    }
  }

  return rows;
}

export function parseVitusapotekProducts(html: string, sourceUrl: string, retrievedAt: string): VitusapotekProduct[] {
  const candidates: VitusapotekCandidate[] = [];
  for (const data of extractJsonPayloads(html)) {
    visit(data, (value) => {
      const candidate = value as VitusapotekCandidate;
      if ((candidate.name || candidate.title) && (candidate.price || candidate.currentPrice || candidate.salesPrice)) {
        candidates.push(candidate);
      }
    });
  }

  return candidates
    .map((candidate) => normalizeVitusapotekProduct(candidate, sourceUrl, retrievedAt))
    .filter((product): product is VitusapotekProduct => product !== null);
}

export function normalizeVitusapotekProduct(
  product: VitusapotekCandidate,
  sourceUrl: string,
  retrievedAt: string
): VitusapotekProduct | null {
  const name = text(product.name) || text(product.title);
  const price = numberFrom(product.price) ?? numberFrom(product.currentPrice) ?? numberFrom(product.salesPrice);
  if (!name || price === null) return null;

  const ean = text(product.ean) || text(product.gtin);
  const code = text(product.sku) || text(product.code) || text(product.id) || ean || slugify(name);
  const originalPrice = numberFrom(product.originalPrice) ?? numberFrom(product.beforePrice);

  return {
    country: 'NO',
    currency: 'NOK',
    chain: 'vitusapotek',
    code,
    ean,
    name,
    brand: text(product.brand) || text(product.brandName),
    price,
    priceText: `${price.toFixed(2)} NOK`,
    originalPrice,
    originalPriceText: originalPrice === null ? '' : `${originalPrice.toFixed(2)} NOK`,
    stockStatus: text(product.stockStatus) || text(product.availability),
    productUrl: absoluteUrl(text(product.productUrl) || text(product.url) || text(product.slug), VITUSAPOTEK_BASE_URL),
    imageUrl: absoluteUrl(text(product.imageUrl) || text(product.image), VITUSAPOTEK_BASE_URL),
    sourceUrl,
    retrievedAt
  };
}

function extractJsonPayloads(html: string): unknown[] {
  const payloads: unknown[] = [];
  const scriptPattern = /<script[^>]*(?:id="__NEXT_DATA__"|type="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(scriptPattern)) {
    try {
      payloads.push(JSON.parse(match[1]!.trim()));
    } catch {
      // Ignore non-JSON scripts.
    }
  }
  return payloads;
}

function visit(value: unknown, callback: (value: unknown) => void) {
  callback(value);
  if (Array.isArray(value)) {
    value.forEach((item) => visit(item, callback));
    return;
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => visit(item, callback));
  }
}

function text(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (value && typeof value === 'object' && 'url' in value) return text((value as { url?: unknown }).url);
  if (value && typeof value === 'object' && 'name' in value) return text((value as { name?: unknown }).name);
  return '';
}

function numberFrom(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^\d,.-]/g, '').replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (value && typeof value === 'object') {
    const object = value as { value?: unknown; amount?: unknown; price?: unknown; current?: unknown };
    return numberFrom(object.value) ?? numberFrom(object.amount) ?? numberFrom(object.price) ?? numberFrom(object.current);
  }
  return null;
}

function absoluteUrl(value: string, baseUrl: string): string {
  if (!value) return '';
  return new URL(value, baseUrl).toString();
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
