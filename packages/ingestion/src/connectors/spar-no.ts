export type SparNoProduct = {
  code: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  priceText: string;
  unitPriceText: string;
  sourceUrl: string;
  productUrl: string;
  imageUrl: string;
  retrievedAt: string;
};

type SparNoRawProduct = Record<string, unknown>;

export const SPAR_NO_CHAIN_ID = '1210';
export const SPAR_NO_BASE_URL = 'https://spar.no';
export const SPAR_NO_SEARCH_PATH = '/sok';
export const DEFAULT_SPAR_NO_SEARCH_QUERIES = [
  'melk',
  'brød',
  'kaffe',
  'ost',
  'yoghurt',
  'pasta',
  'ris',
  'egg',
  'smør',
  'kylling',
  'banan',
  'potet'
] as const;
export const DEFAULT_SPAR_NO_MAX_ROWS = 1000;

export type FetchSparNoProductsOptions = {
  fetchImpl?: typeof fetch;
  queries?: readonly string[];
  maxRows?: number;
  minRows?: number;
  retrievedAt?: string;
};

export function buildSparNoSearchUrl(query: string): string {
  const url = new URL(SPAR_NO_SEARCH_PATH, SPAR_NO_BASE_URL);
  url.searchParams.set('search', query);
  return url.toString();
}

export async function fetchSparNoProducts(options: FetchSparNoProductsOptions = {}): Promise<SparNoProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const queries = options.queries ?? DEFAULT_SPAR_NO_SEARCH_QUERIES;
  const maxRows = options.maxRows ?? DEFAULT_SPAR_NO_MAX_ROWS;
  const minRows = options.minRows ?? 0;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: SparNoProduct[] = [];
  const seenCodes = new Set<string>();

  for (const query of queries) {
    const sourceUrl = buildSparNoSearchUrl(query);
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml,application/json',
        'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
      }
    });

    if (!response.ok) throw new Error(`SPAR NO search request failed for ${query}: ${response.status}`);

    for (const product of parseSparNoProducts(await response.text())) {
      const row = normalizeSparNoProduct(product, sourceUrl, retrievedAt);
      if (!row || seenCodes.has(row.code)) continue;
      seenCodes.add(row.code);
      rows.push(row);
      if (rows.length >= maxRows) return ensureSparNoMinimumRows(rows, minRows);
    }
  }

  return ensureSparNoMinimumRows(rows, minRows);
}

export function parseSparNoProducts(payload: string): SparNoRawProduct[] {
  const products: SparNoRawProduct[] = [];

  for (const scriptJson of extractJsonCandidates(payload)) {
    try {
      collectProductLikeObjects(JSON.parse(scriptJson), products);
    } catch {
      // Keep trying other embedded payload fragments; SPAR ships several script formats.
    }
  }

  if (products.length > 0) return dedupeRawProducts(products);

  return dedupeRawProducts(extractProductObjectLiterals(payload));
}

export function normalizeSparNoProduct(
  product: SparNoRawProduct,
  sourceUrl: string,
  retrievedAt: string
): SparNoProduct | null {
  const code = text(product.gtin ?? product.gtin13 ?? product.ean ?? product.id ?? product.productId);
  const name = text(product.title ?? product.name ?? product.displayName ?? product.productName);
  const price = numberFromUnknown(product.price ?? product.regularPrice ?? product.currentPrice ?? product.pricePerUnit);
  if (!code || !name || price === null) return null;

  const relativeUrl = text(product.url ?? product.href ?? product.productUrl ?? product.slug);

  return {
    code,
    name,
    brand: text(product.brand ?? product.brandName ?? product.supplier),
    category: text(product.category ?? product.categoryName ?? product.department ?? product.breadcrumbs),
    price,
    priceText: text(product.priceText ?? product.priceDisplay ?? product.displayPrice) || `${price.toFixed(2)} NOK`,
    unitPriceText: text(product.unitPriceText ?? product.unitPrice ?? product.pricePerUnitText),
    sourceUrl,
    productUrl: buildSparNoProductUrl(relativeUrl),
    imageUrl: buildSparNoImageUrl(text(product.imageUrl ?? product.image ?? product.imagePath ?? product.restImagePath), code),
    retrievedAt
  };
}

function ensureSparNoMinimumRows(rows: SparNoProduct[], minRows: number): SparNoProduct[] {
  if (rows.length < minRows) throw new Error(`SPAR NO fetch returned only ${rows.length} rows; minimum required is ${minRows}`);
  return rows;
}

function extractJsonCandidates(payload: string): string[] {
  const candidates: string[] = [];
  const nextDataMatch = payload.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (nextDataMatch?.[1]) candidates.push(htmlDecode(nextDataMatch[1]));

  const envMatches = payload.matchAll(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)<\/script>/g);
  for (const match of envMatches) {
    if (!match[1]) continue;
    try {
      candidates.push(JSON.parse(`"${match[1]}"`));
    } catch {
      // Ignore non-JSON React flight chunks.
    }
  }

  return candidates;
}

function collectProductLikeObjects(value: unknown, products: SparNoRawProduct[]): void {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) collectProductLikeObjects(item, products);
    return;
  }

  const record = value as SparNoRawProduct;
  const hasProductName = Boolean(record.title ?? record.name ?? record.displayName ?? record.productName);
  const hasProductCode = Boolean(record.gtin ?? record.gtin13 ?? record.ean ?? record.productId ?? record.id);
  const hasPrice = Boolean(record.price ?? record.regularPrice ?? record.currentPrice ?? record.priceText ?? record.displayPrice);
  if (hasProductName && (hasProductCode || hasPrice)) products.push(record);

  for (const child of Object.values(record)) collectProductLikeObjects(child, products);
}

function extractProductObjectLiterals(payload: string): SparNoRawProduct[] {
  const products: SparNoRawProduct[] = [];
  const matches = payload.matchAll(/\{[^{}]*(?:"gtin"|"ean"|"productId")[^{}]*(?:"title"|"name")[^{}]*\}/g);
  for (const match of matches) {
    try {
      products.push(JSON.parse(match[0]) as SparNoRawProduct);
    } catch {
      // Ignore malformed object literals in minified scripts.
    }
  }
  return products;
}

function dedupeRawProducts(products: SparNoRawProduct[]): SparNoRawProduct[] {
  const seen = new Set<string>();
  return products.filter((product) => {
    const key = text(product.gtin ?? product.gtin13 ?? product.ean ?? product.productId ?? product.id ?? product.title ?? product.name);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildSparNoProductUrl(value: string): string {
  if (!value) return '';
  try {
    return new URL(value, SPAR_NO_BASE_URL).toString();
  } catch {
    return '';
  }
}

function buildSparNoImageUrl(value: string, code: string): string {
  if (value) return buildSparNoProductUrl(value);
  return code ? `https://bilder.ngdata.no/${code}/spar/medium.jpg` : '';
}

function numberFromUnknown(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const normalized = text(value).replace(/\s/g, '').replace(',', '.').match(/\d+(?:\.\d+)?/)?.[0];
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function text(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join(' > ');
  return '';
}

function htmlDecode(value: string): string {
  return value.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#x27;/g, "'");
}
