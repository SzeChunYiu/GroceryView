export type KiwiNoPromotionRow = {
  brand: string;
  category: 'fruit_veg_daily_low' | 'weekly_flyer' | 'grocery_promotion';
  chain: 'kiwi-no';
  code: string;
  country: 'NO';
  currency: 'NOK';
  imageUrl: string;
  name: string;
  price: number;
  priceText: string;
  productUrl: string;
  promotionText: string;
  promotionType: 'daily_low' | 'weekly_flyer';
  retrievedAt: string;
  sourceUrl: string;
  unitPriceText: string;
  validFrom: string;
  validTo: string;
};

type KiwiJsonProduct = {
  brand?: unknown;
  category?: unknown;
  description?: unknown;
  id?: unknown;
  image?: unknown;
  imageUrl?: unknown;
  name?: unknown;
  offerText?: unknown;
  price?: unknown;
  priceText?: unknown;
  productUrl?: unknown;
  title?: unknown;
  unitPrice?: unknown;
  unitPriceText?: unknown;
  url?: unknown;
  validFrom?: unknown;
  validTo?: unknown;
};

export type FetchKiwiNoPromotionsOptions = {
  fetchImpl?: typeof fetch;
  maxRows?: number;
  retrievedAt?: string;
  sourceUrls?: readonly string[];
};

export const KIWI_NO_BASE_URL = 'https://kiwi.no';
export const DEFAULT_KIWI_NO_PROMOTION_URLS = [
  'https://kiwi.no/erbjudanden',
  'https://kiwi.no/tilbud',
  'https://kiwi.no/frukt-og-gront'
] as const;

export async function fetchKiwiNoPromotions(options: FetchKiwiNoPromotionsOptions = {}): Promise<KiwiNoPromotionRow[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: KiwiNoPromotionRow[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of options.sourceUrls ?? DEFAULT_KIWI_NO_PROMOTION_URLS) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 flyer-connector (+https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (!response.ok) throw new Error(`KIWI flyer request failed for ${sourceUrl}: ${response.status}`);

    for (const row of parseKiwiNoPromotions(await response.text(), sourceUrl, retrievedAt)) {
      const key = `${row.code}:${row.sourceUrl}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(row);
      if (options.maxRows && rows.length >= options.maxRows) return rows;
    }
  }

  return rows;
}

export function parseKiwiNoPromotions(html: string, sourceUrl: string, retrievedAt: string): KiwiNoPromotionRow[] {
  const products: KiwiJsonProduct[] = [];
  collectProducts(extractNextData(html), products);
  for (const json of extractJsonLd(html)) collectProducts(json, products);
  collectProductsFromHtml(html, products);

  return products
    .map((product) => normalizeKiwiNoPromotion(product, sourceUrl, retrievedAt))
    .filter((row): row is KiwiNoPromotionRow => row !== null);
}

export function normalizeKiwiNoPromotion(product: KiwiJsonProduct, sourceUrl: string, retrievedAt: string): KiwiNoPromotionRow | null {
  const name = text(product.name ?? product.title);
  const priceText = text(product.priceText ?? product.price);
  const price = numberFromText(product.price ?? product.priceText);
  if (!name || price === null) return null;

  const productUrl = absoluteUrl(product.productUrl ?? product.url, KIWI_NO_BASE_URL) || sourceUrl;
  const categoryText = `${text(product.category)} ${text(product.description)} ${sourceUrl}`.toLowerCase();
  const promotionType = /frukt|gr[øo]nt|frukt-og-gront|daily|fast lavpris/.test(categoryText) ? 'daily_low' : 'weekly_flyer';

  return {
    brand: text(product.brand),
    category: promotionType === 'daily_low' ? 'fruit_veg_daily_low' : /tilbud|erbjudanden|avis|flyer/.test(categoryText) ? 'weekly_flyer' : 'grocery_promotion',
    chain: 'kiwi-no',
    code: text(product.id) || slugify(`${name}-${priceText || price}`),
    country: 'NO',
    currency: 'NOK',
    imageUrl: absoluteUrl(product.imageUrl ?? product.image, KIWI_NO_BASE_URL),
    name,
    price,
    priceText: priceText || `${price.toFixed(2)} NOK`,
    productUrl,
    promotionText: text(product.offerText ?? product.description) || (promotionType === 'daily_low' ? 'KIWI daily-low fruit/veg' : 'KIWI weekly flyer'),
    promotionType,
    retrievedAt,
    sourceUrl,
    unitPriceText: text(product.unitPriceText ?? product.unitPrice),
    validFrom: isoDate(product.validFrom) || retrievedAt,
    validTo: isoDate(product.validTo) || '',
  };
}

function extractNextData(html: string): unknown {
  const match = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  return match ? parseJson(match[1] ?? '') : null;
}

function extractJsonLd(html: string): unknown[] {
  return [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => parseJson(match[1] ?? ''));
}

function collectProducts(value: unknown, products: KiwiJsonProduct[]) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((entry) => collectProducts(entry, products));
    return;
  }
  const record = value as Record<string, unknown>;
  if ((record.name || record.title) && (record.price || record.priceText || record.offerText)) {
    products.push(record as KiwiJsonProduct);
  }
  Object.values(record).forEach((entry) => collectProducts(entry, products));
}

function collectProductsFromHtml(html: string, products: KiwiJsonProduct[]) {
  const text = decodeHtmlText(html);
  const pattern = /([A-ZÆØÅa-zæøå0-9][^.;:]{2,80}?)\s+(\d{1,4}[,.]\d{0,2})\s*(?:kr|,-)/g;
  for (const match of text.matchAll(pattern)) {
    products.push({ name: match[1]?.trim(), priceText: match[2], offerText: 'KIWI visible flyer price' });
  }
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value.replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
  } catch {
    return null;
  }
}

function decodeHtmlText(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|\u00a0/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

function text(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function numberFromText(value: unknown): number | null {
  const parsed = Number.parseFloat(text(value).replace(/\s/g, '').replace(',', '.').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
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

function isoDate(value: unknown): string {
  const raw = text(value);
  if (!raw) return '';
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function slugify(value: string): string {
  return value.toLowerCase().normalize('NFKD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64) || 'kiwi-offer';
}
