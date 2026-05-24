export type CoopNoFlyerFormat = 'extra' | 'mega' | 'prix' | 'marked' | 'coop';

export type CoopNoPromotionRow = {
  brand: string;
  chain: 'coop-no';
  code: string;
  country: 'NO';
  currency: 'NOK';
  format: CoopNoFlyerFormat;
  imageUrl: string;
  name: string;
  price: number;
  priceText: string;
  productUrl: string;
  promotionText: string;
  retrievedAt: string;
  sourceUrl: string;
  unitPriceText: string;
  validFrom: string;
  validTo: string;
};

type CoopNoJsonOffer = {
  brand?: unknown;
  chain?: unknown;
  description?: unknown;
  id?: unknown;
  image?: unknown;
  imageUrl?: unknown;
  name?: unknown;
  price?: unknown;
  priceText?: unknown;
  storeFormat?: unknown;
  title?: unknown;
  unitPrice?: unknown;
  unitPriceText?: unknown;
  url?: unknown;
  validFrom?: unknown;
  validTo?: unknown;
};

export type FetchCoopNoFlyerOptions = {
  fetchImpl?: typeof fetch;
  maxRows?: number;
  retrievedAt?: string;
  sourceUrls?: readonly string[];
};

export const COOP_NO_BASE_URL = 'https://coop.no';
export const DEFAULT_COOP_NO_FLYER_URLS = [
  'https://coop.no/erbjudanden',
  'https://coop.no/tilbud',
  'https://coop.no/extra/tilbud',
  'https://coop.no/mega/tilbud'
] as const;

export async function fetchCoopNoFlyerPromotions(options: FetchCoopNoFlyerOptions = {}): Promise<CoopNoPromotionRow[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: CoopNoPromotionRow[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of options.sourceUrls ?? DEFAULT_COOP_NO_FLYER_URLS) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 flyer-connector (+https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (!response.ok) throw new Error(`Coop NO flyer request failed for ${sourceUrl}: ${response.status}`);

    for (const row of parseCoopNoFlyerPromotions(await response.text(), sourceUrl, retrievedAt)) {
      const key = `${row.format}:${row.code}:${row.sourceUrl}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(row);
      if (options.maxRows && rows.length >= options.maxRows) return rows;
    }
  }

  return rows;
}

export function parseCoopNoFlyerPromotions(html: string, sourceUrl: string, retrievedAt: string): CoopNoPromotionRow[] {
  const offers: CoopNoJsonOffer[] = [];
  collectOffers(extractNextData(html), offers);
  for (const json of extractJsonLd(html)) collectOffers(json, offers);
  collectOffersFromHtml(html, offers);

  return offers
    .map((offer) => normalizeCoopNoFlyerPromotion(offer, sourceUrl, retrievedAt))
    .filter((row): row is CoopNoPromotionRow => row !== null);
}

export function normalizeCoopNoFlyerPromotion(offer: CoopNoJsonOffer, sourceUrl: string, retrievedAt: string): CoopNoPromotionRow | null {
  const name = text(offer.name ?? offer.title);
  const price = numberFromText(offer.price ?? offer.priceText);
  const priceText = text(offer.priceText ?? offer.price);
  if (!name || price === null) return null;

  const format = coopFormat(`${text(offer.storeFormat ?? offer.chain)} ${sourceUrl}`);

  return {
    brand: text(offer.brand),
    chain: 'coop-no',
    code: text(offer.id) || slugify(`${format}-${name}-${priceText || price}`),
    country: 'NO',
    currency: 'NOK',
    format,
    imageUrl: absoluteUrl(offer.imageUrl ?? offer.image, COOP_NO_BASE_URL),
    name,
    price,
    priceText: priceText || `${price.toFixed(2)} NOK`,
    productUrl: absoluteUrl(offer.url, COOP_NO_BASE_URL) || sourceUrl,
    promotionText: text(offer.description) || `Coop ${format.toUpperCase()} flyer promotion`,
    retrievedAt,
    sourceUrl,
    unitPriceText: text(offer.unitPriceText ?? offer.unitPrice),
    validFrom: isoDate(offer.validFrom) || retrievedAt,
    validTo: isoDate(offer.validTo) || '',
  };
}

function coopFormat(value: string): CoopNoFlyerFormat {
  const normalized = value.toLowerCase();
  if (normalized.includes('extra')) return 'extra';
  if (normalized.includes('mega')) return 'mega';
  if (normalized.includes('prix')) return 'prix';
  if (normalized.includes('marked')) return 'marked';
  return 'coop';
}

function extractNextData(html: string): unknown {
  const match = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  return match ? parseJson(match[1] ?? '') : null;
}

function extractJsonLd(html: string): unknown[] {
  return [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => parseJson(match[1] ?? ''));
}

function collectOffers(value: unknown, offers: CoopNoJsonOffer[]) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((entry) => collectOffers(entry, offers));
    return;
  }
  const record = value as Record<string, unknown>;
  if ((record.name || record.title) && (record.price || record.priceText || record.description)) offers.push(record as CoopNoJsonOffer);
  Object.values(record).forEach((entry) => collectOffers(entry, offers));
}

function collectOffersFromHtml(html: string, offers: CoopNoJsonOffer[]) {
  const pageText = decodeHtmlText(html);
  const pattern = /([A-ZÆØÅa-zæøå0-9][^.;:]{2,80}?)\s+(\d{1,4}[,.]\d{0,2})\s*(?:kr|,-)/g;
  for (const match of pageText.matchAll(pattern)) {
    offers.push({ name: match[1]?.trim(), priceText: match[2], description: 'Coop NO visible flyer price' });
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
  return value.toLowerCase().normalize('NFKD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 72) || 'coop-no-offer';
}
