export type BootsNoPharmacyCategory = 'otc' | 'supplement' | 'beauty';

export type BootsNoProduct = {
  chain: 'boots-no';
  country: 'NO';
  currency: 'NOK';
  code: string;
  ean: string;
  name: string;
  brand: string;
  category: BootsNoPharmacyCategory;
  price: number;
  priceText: string;
  originalPrice: number | null;
  originalPriceText: string;
  stockStatus: string;
  productUrl: string;
  imageUrl: string;
  isOtc: boolean;
  sourceUrl: string;
  retrievedAt: string;
};

type BootsNoProductCandidate = {
  '@type'?: unknown;
  brand?: unknown | { name?: unknown };
  ean?: unknown;
  gtin?: unknown;
  gtin13?: unknown;
  image?: unknown;
  isPrescriptionProduct?: unknown;
  name?: unknown;
  offers?: unknown | Array<unknown>;
  price?: unknown;
  sku?: unknown;
  url?: unknown;
};

export type FetchBootsNoProductsOptions = {
  fetchImpl?: typeof fetch;
  maxRows?: number;
  retrievedAt?: string;
  sourcePaths?: readonly string[];
};

export const BOOTS_NO_BASE_URL = 'https://www.boots.no';

export const DEFAULT_BOOTS_NO_SOURCE_PATHS = [
  '/search?text=vitamin',
  '/search?text=solkrem',
  '/search?text=paracetamol',
  '/search?text=tannkrem',
  '/search?text=la%20roche',
  '/helse-og-velvaere',
  '/hudpleie'
] as const;

export async function fetchBootsNoProducts(options: FetchBootsNoProductsOptions = {}): Promise<BootsNoProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: BootsNoProduct[] = [];
  const seen = new Set<string>();

  for (const sourcePath of options.sourcePaths ?? DEFAULT_BOOTS_NO_SOURCE_PATHS) {
    const sourceUrl = absoluteUrl(sourcePath, BOOTS_NO_BASE_URL);
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
      }
    });

    if (!response.ok) {
      throw new Error(`Boots NO request failed for ${sourceUrl}: ${response.status}`);
    }

    for (const product of parseBootsNoProducts(await response.text(), sourceUrl, retrievedAt)) {
      if (seen.has(product.code)) continue;
      seen.add(product.code);
      rows.push(product);
      if (options.maxRows && rows.length >= options.maxRows) return rows;
    }
  }

  return rows;
}

export function parseBootsNoProducts(html: string, sourceUrl: string, retrievedAt: string): BootsNoProduct[] {
  const candidates: BootsNoProductCandidate[] = [];
  for (const data of extractJsonBlocks(html)) {
    visit(data, (value) => {
      const candidate = value as BootsNoProductCandidate;
      if (isProductCandidate(candidate)) {
        candidates.push(candidate);
      }
    });
  }

  return candidates
    .map((product) => normalizeBootsNoProduct(product, sourceUrl, retrievedAt))
    .filter((product): product is BootsNoProduct => product !== null);
}

export function normalizeBootsNoProduct(
  product: BootsNoProductCandidate,
  sourceUrl: string,
  retrievedAt: string
): BootsNoProduct | null {
  if (product.isPrescriptionProduct === true) return null;

  const offer = Array.isArray(product.offers) ? product.offers[0] : product.offers;
  const offerRecord = offer && typeof offer === 'object' ? offer as Record<string, unknown> : {};
  const ean = eanText(product.gtin13 ?? product.gtin ?? product.ean);
  const name = text(product.name);
  const price = numberFromText(offerRecord.price ?? product.price);
  if (!name || price === null) return null;

  const code = text(product.sku) || ean || slugFromUrl(product.url);
  if (!code) return null;

  const originalPrice = numberFromText(offerRecord.highPrice ?? offerRecord.listPrice);
  const category = bootsNoCategory(name, sourceUrl);

  return {
    chain: 'boots-no',
    country: 'NO',
    currency: 'NOK',
    code,
    ean,
    name,
    brand: brandText(product.brand),
    category,
    price,
    priceText: `${price.toFixed(2)} NOK`,
    originalPrice,
    originalPriceText: originalPrice === null ? '' : `${originalPrice.toFixed(2)} NOK`,
    stockStatus: text(offerRecord.availability),
    productUrl: absoluteUrl(product.url, BOOTS_NO_BASE_URL),
    imageUrl: imageUrl(product.image),
    isOtc: category === 'otc',
    sourceUrl,
    retrievedAt
  };
}

function isProductCandidate(candidate: BootsNoProductCandidate) {
  const type = text(candidate['@type']).toLowerCase();
  return Boolean(candidate.name && (type === 'product' || candidate.offers || candidate.price));
}

function extractJsonBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];
  const scriptPattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(scriptPattern)) {
    const jsonText = match[1];
    if (!jsonText) continue;

    try {
      blocks.push(JSON.parse(jsonText.trim()));
    } catch {
      // Ignore unrelated or malformed JSON-LD blocks.
    }
  }

  const nextDataMatch = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (nextDataMatch?.[1]) {
    try {
      blocks.push(JSON.parse(nextDataMatch[1]));
    } catch {
      // Ignore if Boots changes its hydration payload.
    }
  }

  return blocks;
}

function bootsNoCategory(name: string, sourceUrl: string): BootsNoPharmacyCategory {
  const value = `${name} ${sourceUrl}`.toLowerCase();
  if (/paracetamol|ibuprofen|nesespray|hoste|forkj|legemiddel|pain/.test(value)) return 'otc';
  if (/vitamin|mineral|omega|kosttilskudd|supplement/.test(value)) return 'supplement';
  return 'beauty';
}

function imageUrl(value: unknown) {
  const firstImage = Array.isArray(value) ? value[0] : value;
  return absoluteUrl(firstImage, BOOTS_NO_BASE_URL);
}

function brandText(value: unknown) {
  if (value && typeof value === 'object' && 'name' in value) {
    return text((value as { name?: unknown }).name);
  }

  return text(value);
}

function slugFromUrl(value: unknown) {
  const url = text(value);
  if (!url) return '';

  const parts = url.split('/').filter(Boolean);
  return parts[parts.length - 1] ?? '';
}

function eanText(value: unknown) {
  return text(value).replace(/\D/g, '');
}

function numberFromText(value: unknown): number | null {
  const numeric = typeof value === 'number' ? value : Number.parseFloat(text(value).replace(',', '.').replace(/[^\d.-]/g, ''));
  return Number.isFinite(numeric) ? numeric : null;
}

function absoluteUrl(value: unknown, baseUrl: string) {
  const raw = text(value);
  if (!raw) return '';

  return new URL(raw, baseUrl).toString();
}

function text(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function visit(value: unknown, visitor: (value: unknown) => void) {
  visitor(value);
  if (Array.isArray(value)) {
    for (const item of value) visit(item, visitor);
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) visit(item, visitor);
  }
}
