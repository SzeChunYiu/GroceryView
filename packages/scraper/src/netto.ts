import { normalizeUnitQuantity, type NormalizedUnit } from './unitNormalizer.js';

const NETTO_CHAIN = 'netto';
const NETTO_COUNTRY = 'SE';
const NETTO_CURRENCY = 'SEK';
const NETTO_SOURCE_URL = 'https://www.netto.se/';
const PARSER_VERSION = 'netto-se-product-page-v1';

type NettoFetch = (url: string, init?: RequestInit) => Promise<Pick<Response, 'ok' | 'status' | 'text'>>;
type JsonRecord = Record<string, unknown>;

export type NettoProductListing = {
  chain: typeof NETTO_CHAIN;
  chainSkuId: string;
  name: string;
  brand?: string;
  weightGrams?: number;
  volumeMl?: number;
  unitCount?: number;
  imageUrl?: string;
  sourceUrl: string;
  lastSeenAt: string;
};

export type NettoPriceObservation = {
  chain: typeof NETTO_CHAIN;
  chainSkuId: string;
  priceAmount: number;
  currency: typeof NETTO_CURRENCY;
  country: typeof NETTO_COUNTRY;
  unit: NormalizedUnit;
  isListPrice: boolean;
  observedAt: string;
  sourceUrl: string;
};

export type NettoScrapedProduct = {
  listing: NettoProductListing;
  priceObservation: NettoPriceObservation;
  parserVersion: typeof PARSER_VERSION;
  rawSnapshotRef: string;
};

export async function scrapeNettoProductPages(
  productUrls: readonly string[],
  options: { fetcher?: NettoFetch; observedAt?: Date } = {}
): Promise<NettoScrapedProduct[]> {
  const fetcher: NettoFetch = options.fetcher ?? ((url, init) => fetch(url, init));
  const observedAt = options.observedAt ?? new Date();
  const rows: NettoScrapedProduct[] = [];

  for (const productUrl of productUrls) {
    const response = await fetcher(productUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryViewBot/1.0 (+https://groceryview.se)'
      }
    });
    if (!response.ok) throw new Error(`Netto product page ${productUrl} returned HTTP ${response.status}`);
    rows.push(parseNettoProductPage(await response.text(), productUrl, observedAt));
  }

  return rows;
}

export function parseNettoProductPage(html: string, sourceUrl = NETTO_SOURCE_URL, observedAt: Date = new Date()): NettoScrapedProduct {
  const product = firstProductJsonLd(html) ?? {};
  const offer = firstOffer(product);
  const name = stringValue(product.name) ?? metaContent(html, 'og:title') ?? titleText(html);
  const price = numberValue(offer?.price) ?? numberFromText(metaContent(html, 'product:price:amount') ?? textNearPrice(html));

  if (!name) throw new Error(`Netto product page ${sourceUrl} is missing a product name`);
  if (price === undefined) throw new Error(`Netto product page ${sourceUrl} is missing a product price`);

  const imageUrl = imageValue(product.image) ?? metaContent(html, 'og:image');
  const brand = brandValue(product.brand);
  const packageInfo = packageInfoFromText(`${name} ${stringValue(product.description) ?? ''}`);
  const chainSkuId = stringValue(product.sku) ?? stringValue(product.productID) ?? skuFromUrl(sourceUrl) ?? stableSkuFromName(name);
  const observedAtIso = observedAt.toISOString();
  const unit = packageInfo ? normalizeUnitQuantity(packageInfo.quantity, packageInfo.unit).unit : 'unit';

  return {
    listing: {
      chain: NETTO_CHAIN,
      chainSkuId,
      name: cleanText(name),
      ...(brand ? { brand: cleanText(brand) } : {}),
      ...(packageInfo?.weightGrams ? { weightGrams: packageInfo.weightGrams } : {}),
      ...(packageInfo?.volumeMl ? { volumeMl: packageInfo.volumeMl } : {}),
      ...(packageInfo?.unitCount ? { unitCount: packageInfo.unitCount } : {}),
      ...(imageUrl ? { imageUrl } : {}),
      sourceUrl,
      lastSeenAt: observedAtIso
    },
    priceObservation: {
      chain: NETTO_CHAIN,
      chainSkuId,
      priceAmount: price,
      currency: NETTO_CURRENCY,
      country: NETTO_COUNTRY,
      unit,
      isListPrice: true,
      observedAt: observedAtIso,
      sourceUrl
    },
    parserVersion: PARSER_VERSION,
    rawSnapshotRef: sourceUrl
  };
}

function firstProductJsonLd(html: string): JsonRecord | undefined {
  return jsonLdBlocks(html)
    .flatMap((block) => Array.isArray(block) ? block : [block])
    .flatMap((block) => Array.isArray((block as JsonRecord)['@graph']) ? (block as JsonRecord)['@graph'] as unknown[] : [block])
    .find((block): block is JsonRecord => isRecord(block) && stringValue(block['@type'])?.toLowerCase() === 'product');
}

function jsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];
  const pattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(pattern)) {
    try {
      blocks.push(JSON.parse(decodeHtml(match[1] ?? '').trim()));
    } catch {
      // Ignore malformed third-party JSON-LD blocks and fall back to meta tags.
    }
  }
  return blocks;
}

function firstOffer(product: JsonRecord): JsonRecord | undefined {
  const offers = product.offers;
  if (Array.isArray(offers)) return offers.find(isRecord);
  return isRecord(offers) ? offers : undefined;
}

function metaContent(html: string, property: string): string | undefined {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i');
  return decodeHtml(html.match(pattern)?.[1] ?? '').trim() || undefined;
}

function titleText(html: string): string | undefined {
  return decodeHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').replace(/\s+\|\s+Netto.*$/i, '').trim() || undefined;
}

function textNearPrice(html: string): string | undefined {
  return decodeHtml(html.replace(/<[^>]+>/g, ' ')).match(/\b\d{1,4}(?:[,.]\d{1,2})?\s*(?:kr|sek)\b/i)?.[0];
}

function numberFromText(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value.replace(/[^\d,.-]/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return typeof value === 'string' ? numberFromText(value) : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function imageValue(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.find((item): item is string => typeof item === 'string');
  return undefined;
}

function brandValue(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  return isRecord(value) ? stringValue(value.name) : undefined;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null;
}

function packageInfoFromText(text: string) {
  const match = text.toLowerCase().match(/(\d+(?:[,.]\d+)?)\s*(kg|g|l|cl|ml|st|pack)\b/);
  if (!match) return undefined;
  const quantity = Number(match[1]!.replace(',', '.'));
  const unit = match[2]!;
  if (!Number.isFinite(quantity) || quantity <= 0) return undefined;
  if (unit === 'kg') return { quantity, unit, weightGrams: quantity * 1000 };
  if (unit === 'g') return { quantity, unit, weightGrams: quantity };
  if (unit === 'l') return { quantity, unit, volumeMl: quantity * 1000 };
  if (unit === 'cl') return { quantity: quantity * 10, unit: 'ml', volumeMl: quantity * 10 };
  if (unit === 'ml') return { quantity, unit, volumeMl: quantity };
  return { quantity, unit: 'unit', unitCount: Math.round(quantity) };
}

function skuFromUrl(sourceUrl: string): string | undefined {
  try {
    const url = new URL(sourceUrl);
    return url.pathname.split('/').filter(Boolean).at(-1)?.replace(/\.[a-z0-9]+$/i, '');
  } catch {
    return undefined;
  }
}

function stableSkuFromName(name: string): string {
  return cleanText(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function decodeHtml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'");
}
