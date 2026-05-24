export type NettoIsFlyerRow = {
  brand: string;
  category: string;
  chain: 'netto-is';
  code: string;
  country: 'IS';
  currency: 'ISK';
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

type NettoJsonOffer = {
  brand?: unknown;
  category?: unknown;
  description?: unknown;
  id?: unknown;
  image?: unknown;
  imageUrl?: unknown;
  name?: unknown;
  price?: unknown;
  priceText?: unknown;
  title?: unknown;
  unitPrice?: unknown;
  unitPriceText?: unknown;
  url?: unknown;
  validFrom?: unknown;
  validTo?: unknown;
};

export type FetchNettoIsFlyerOptions = {
  fetchImpl?: typeof fetch;
  maxRows?: number;
  retrievedAt?: string;
  sourceUrls?: readonly string[];
};

export const NETTO_IS_BASE_URL = 'https://netto.is';
export const DEFAULT_NETTO_IS_FLYER_URLS = [
  'https://netto.is/tilbod',
  'https://netto.is/baeklingur',
  'https://netto.is'
] as const;

export async function fetchNettoIsFlyerOffers(options: FetchNettoIsFlyerOptions = {}): Promise<NettoIsFlyerRow[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: NettoIsFlyerRow[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of options.sourceUrls ?? DEFAULT_NETTO_IS_FLYER_URLS) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 flyer-connector (+https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (!response.ok) throw new Error(`Nettó flyer request failed for ${sourceUrl}: ${response.status}`);

    for (const row of parseNettoIsFlyerOffers(await response.text(), sourceUrl, retrievedAt)) {
      const key = `${row.code}:${row.sourceUrl}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(row);
      if (options.maxRows && rows.length >= options.maxRows) return rows;
    }
  }

  return rows;
}

export function parseNettoIsFlyerOffers(html: string, sourceUrl: string, retrievedAt: string): NettoIsFlyerRow[] {
  const offers: NettoJsonOffer[] = [];
  collectOffers(extractNextData(html), offers);
  for (const json of extractJsonLd(html)) collectOffers(json, offers);
  collectOffersFromHtml(html, offers);

  return offers
    .map((offer) => normalizeNettoIsFlyerOffer(offer, sourceUrl, retrievedAt))
    .filter((row): row is NettoIsFlyerRow => row !== null);
}

export function normalizeNettoIsFlyerOffer(offer: NettoJsonOffer, sourceUrl: string, retrievedAt: string): NettoIsFlyerRow | null {
  const name = text(offer.name ?? offer.title);
  const price = numberFromText(offer.price ?? offer.priceText);
  const priceText = text(offer.priceText ?? offer.price);
  if (!name || price === null) return null;

  const categoryText = `${text(offer.category)} ${text(offer.description)} ${sourceUrl}`.toLowerCase();

  return {
    brand: text(offer.brand),
    category: categoryText.includes('tilbo') ? 'tilbod' : categoryText.includes('baekling') || categoryText.includes('bækling') ? 'flyer' : 'netto_offer',
    chain: 'netto-is',
    code: text(offer.id) || slugify(`${name}-${priceText || price}`),
    country: 'IS',
    currency: 'ISK',
    imageUrl: absoluteUrl(offer.imageUrl ?? offer.image, NETTO_IS_BASE_URL),
    name,
    price,
    priceText: priceText || `${price.toFixed(0)} ISK`,
    productUrl: absoluteUrl(offer.url, NETTO_IS_BASE_URL) || sourceUrl,
    promotionText: text(offer.description) || 'Nettó flyer / tilboð',
    retrievedAt,
    sourceUrl,
    unitPriceText: text(offer.unitPriceText ?? offer.unitPrice),
    validFrom: isoDate(offer.validFrom) || retrievedAt,
    validTo: isoDate(offer.validTo) || '',
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

function collectOffers(value: unknown, offers: NettoJsonOffer[]) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((entry) => collectOffers(entry, offers));
    return;
  }
  const record = value as Record<string, unknown>;
  if ((record.name || record.title) && (record.price || record.priceText || record.description)) {
    offers.push(record as NettoJsonOffer);
  }
  Object.values(record).forEach((entry) => collectOffers(entry, offers));
}

function collectOffersFromHtml(html: string, offers: NettoJsonOffer[]) {
  const pageText = decodeHtmlText(html);
  const pattern = /([A-ZÁÐÉÍÓÚÝÞÆÖa-záðéíóúýþæö0-9][^.;:]{2,80}?)\s+(\d{2,5}(?:[.,]\d{1,2})?)\s*(?:kr\.?|isk)/gi;
  for (const match of pageText.matchAll(pattern)) {
    offers.push({ name: match[1]?.trim(), priceText: match[2], description: 'Nettó visible flyer price' });
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
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|\u00a0/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
}

function text(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function numberFromText(value: unknown): number | null {
  const parsed = Number.parseFloat(text(value).replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, ''));
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
  return value.toLowerCase().normalize('NFKD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64) || 'netto-offer';
}
