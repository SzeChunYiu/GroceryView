import { normalizeUnitQuantity, type NormalizedQuantity } from './unitNormalizer.js';

export type NettoPriceCurrency = 'SEK';

export type NettoInternalProduct = {
  chainId: 'netto-se';
  retailer: 'Netto Sweden';
  countryCode: 'SE';
  productId: string;
  sku: string;
  ean: string | null;
  name: string;
  brand: string;
  categoryPath: string[];
  price: number;
  currency: NettoPriceCurrency;
  priceText: string;
  unitPrice: number | null;
  unitPriceText: string;
  packageText: string;
  normalizedPackage: NormalizedQuantity | null;
  imageUrl: string;
  productUrl: string;
  sourceUrl: string;
  inStock: boolean | null;
  retrievedAt: string;
};

export type FetchNettoProductsOptions = {
  fetchImpl?: typeof fetch;
  productUrls?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

type JsonRecord = Record<string, unknown>;

export const NETTO_SWEDEN_CHAIN_ID = 'netto-se';
export const NETTO_SWEDEN_BASE_URL = 'https://netto.se';

// netto.se currently redirects to Salling Group. Keep the default scraper safe until
// explicit historical/current product URLs are configured by ops.
export const DEFAULT_NETTO_PRODUCT_URLS: readonly string[] = [];

export async function fetchNettoProducts(options: FetchNettoProductsOptions = {}): Promise<NettoInternalProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const productUrls = options.productUrls ?? DEFAULT_NETTO_PRODUCT_URLS;
  const rows: NettoInternalProduct[] = [];
  const seen = new Set<string>();

  for (const productUrl of productUrls) {
    const response = await fetchImpl(productUrl, htmlHeaders());
    if (!response.ok) throw new Error(`Netto product request failed for ${productUrl}: ${response.status}`);
    const row = parseNettoProductPage(await response.text(), productUrl, retrievedAt);
    if (!row) continue;
    const key = row.ean ?? row.sku ?? row.productUrl;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(row);
    if (options.maxRows && rows.length >= options.maxRows) break;
  }

  return rows;
}

export function parseNettoProductPage(
  html: string,
  sourceUrl: string,
  retrievedAt: string
): NettoInternalProduct | null {
  const product = firstProductCandidate(html);
  const productUrl = absoluteUrl(text(product?.url) || metaContent(html, 'og:url') || sourceUrl, sourceUrl);
  const name = text(product?.name) || cleanTitle(metaContent(html, 'og:title') || titleText(html));
  const offers = firstOffer(product?.offers);
  const price = numberFromText(offers?.price ?? product?.price ?? metaContent(html, 'product:price:amount'));
  if (!name || price === null) return null;

  const sku = text(product?.sku) || text(product?.productID) || slugFromUrl(productUrl) || stableId(name);
  const packageText = packageTextFromProduct(product) || packageTextFromName(name);
  const unitPriceText = unitPriceTextFromProduct(product) || '';

  return {
    chainId: NETTO_SWEDEN_CHAIN_ID,
    retailer: 'Netto Sweden',
    countryCode: 'SE',
    productId: `netto-se:${sku}`,
    sku,
    ean: eanText(product?.gtin13 ?? product?.gtin ?? product?.gtin14 ?? product?.gtin12),
    name,
    brand: brandName(product?.brand),
    categoryPath: categoryPath(product),
    price,
    currency: 'SEK',
    priceText: `${price.toFixed(2)} SEK`,
    unitPrice: numberFromText(unitPriceText),
    unitPriceText,
    packageText,
    normalizedPackage: normalizedPackage(packageText),
    imageUrl: absoluteUrl(firstText(product?.image) || metaContent(html, 'og:image'), sourceUrl),
    productUrl,
    sourceUrl,
    inStock: stockStatus(offers?.availability),
    retrievedAt
  };
}

function firstProductCandidate(html: string): JsonRecord | null {
  for (const node of extractJsonLd(html)) {
    const product = findJsonProduct(node);
    if (product) return product;
  }

  const nextData = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i)?.[1];
  if (nextData) {
    try {
      const product = findJsonProduct(JSON.parse(htmlDecode(nextData)));
      if (product) return product;
    } catch {
      // Fall through to metadata-only parsing.
    }
  }

  return null;
}

function extractJsonLd(html: string): unknown[] {
  const nodes: unknown[] = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      nodes.push(JSON.parse(htmlDecode(match[1].trim())));
    } catch {
      // Ignore malformed vendor analytics snippets.
    }
  }
  return nodes;
}

function findJsonProduct(node: unknown): JsonRecord | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findJsonProduct(child);
      if (found) return found;
    }
    return null;
  }
  if (!isRecord(node)) return null;
  if (jsonTypeMatches(node['@type'], 'Product') && (node.name || node.offers)) return node;
  const graph = node['@graph'];
  if (graph) {
    const found = findJsonProduct(graph);
    if (found) return found;
  }
  for (const value of Object.values(node)) {
    if (typeof value !== 'object' || value === null) continue;
    const found = findJsonProduct(value);
    if (found) return found;
  }
  return null;
}

function firstOffer(value: unknown): JsonRecord | null {
  if (Array.isArray(value)) return value.map(firstOffer).find((offer): offer is JsonRecord => offer !== null) ?? null;
  if (!isRecord(value)) return null;
  if (value.price !== undefined || value.availability !== undefined) return value;
  return null;
}

function categoryPath(product: JsonRecord | null): string[] {
  const category = product?.category;
  if (Array.isArray(category)) return category.map(text).filter(Boolean);
  return text(category)
    .split(/[>/|]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizedPackage(value: string): NormalizedQuantity | null {
  const match = value.match(/(\d+(?:[,.]\d+)?)\s*(kg|g|gram|grams|l|liter|liters|litre|litres|ml|st|pcs|pack)/i);
  if (!match) return null;
  const quantity = Number(match[1].replace(',', '.'));
  const unit = match[2].toLowerCase();
  try {
    if (unit === 'st' || unit === 'pcs') return normalizeUnitQuantity(quantity, 'unit');
    if (unit === 'pack') return normalizeUnitQuantity(quantity, 'unit');
    return normalizeUnitQuantity(quantity, unit);
  } catch {
    return null;
  }
}

function packageTextFromProduct(product: JsonRecord | null): string {
  return text(product?.size)
    || text(product?.weight)
    || text(product?.netWeight)
    || text(product?.description).match(/\b\d+(?:[,.]\d+)?\s*(?:kg|g|gram|l|ml|st)\b/i)?.[0]
    || '';
}

function packageTextFromName(name: string): string {
  return name.match(/\b\d+(?:[,.]\d+)?\s*(?:kg|g|gram|l|ml|st)\b/i)?.[0] ?? '';
}

function unitPriceTextFromProduct(product: JsonRecord | null): string {
  const candidates = [product?.unitPrice, product?.pricePerUnit, product?.unitPricingMeasure, product?.description];
  for (const candidate of candidates) {
    const value = text(candidate);
    const match = value.match(/\d+(?:[,.]\d+)?\s*(?:kr|sek)\s*\/?\s*(?:kg|l|st|unit)/i);
    if (match) return match[0];
  }
  return '';
}

function stockStatus(value: unknown): boolean | null {
  const normalized = text(value).toLowerCase();
  if (!normalized) return null;
  if (normalized.includes('instock') || normalized.includes('in stock') || normalized.includes('i lager')) return true;
  if (normalized.includes('outofstock') || normalized.includes('out of stock') || normalized.includes('slut')) return false;
  return null;
}

function brandName(value: unknown): string {
  if (isRecord(value)) return text(value.name);
  return text(value);
}

function numberFromText(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return roundMoney(value);
  const raw = text(value);
  const match = raw.match(/\d+(?:[\s.]\d{3})*(?:[,.]\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0].replace(/\s/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? roundMoney(parsed) : null;
}

function eanText(value: unknown): string | null {
  const normalized = text(value).replace(/\D/g, '');
  return /^\d{8,14}$/.test(normalized) ? normalized : null;
}

function jsonTypeMatches(value: unknown, expected: string): boolean {
  if (Array.isArray(value)) return value.some((entry) => jsonTypeMatches(entry, expected));
  return text(value).toLowerCase() === expected.toLowerCase();
}

function metaContent(html: string, property: string): string {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`, 'i');
  return htmlDecode(html.match(pattern)?.[1] ?? '');
}

function titleText(html: string): string {
  return htmlDecode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');
}

function cleanTitle(value: string): string {
  return value.replace(/\s+[|–-]\s+Netto.*$/i, '').trim();
}

function slugFromUrl(value: string): string {
  try {
    const pathname = new URL(value).pathname.replace(/\/+$/, '');
    return pathname.split('/').filter(Boolean).pop() ?? '';
  } catch {
    return '';
  }
}

function stableId(value: string): string {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unknown';
}

function absoluteUrl(value: unknown, baseUrl: string): string {
  const raw = text(value);
  if (!raw) return '';
  try {
    return new URL(raw, baseUrl).toString();
  } catch {
    return raw;
  }
}

function firstText(value: unknown): string {
  if (Array.isArray(value)) return text(value[0]);
  return text(value);
}

function text(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\s+/g, ' ').trim();
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function htmlDecode(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&#038;|&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function htmlHeaders(): RequestInit {
  return {
    headers: {
      accept: 'text/html,application/xhtml+xml,application/ld+json',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  };
}
