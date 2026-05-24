export type CityGrossKlubbenPromotion =
  | { kind: 'member_price'; price: number; original_price: number | null; pct_off: number | null }
  | { kind: 'multibuy'; quantity: number; price: number; unit_price: number }
  | { kind: 'percent_off'; pct_off: number }
  | { kind: 'amount_off'; amount_off: number }
  | { kind: 'structured_text'; label: string };

export type CityGrossKlubbenOfferRow = {
  id: string;
  chainId: 'citygross';
  countryCode: 'SE';
  club: 'City Gross Klubben';
  title: string;
  productName: string;
  brand: string;
  price: number | null;
  originalPrice: number | null;
  promotion: CityGrossKlubbenPromotion;
  validFrom: string | null;
  validTo: string | null;
  sourceUrl: string;
  retrievedAt: string;
};

export type FetchCityGrossKlubbenOffersOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  retrievedAt?: string;
  siteId?: string;
};

type RawOffer = Record<string, unknown>;

export const CITY_GROSS_KLUBBEN_OFFERS_URL = 'https://www.citygross.se/api/v1/Offers/Klubben';

export async function fetchCityGrossKlubbenOffers(options: FetchCityGrossKlubbenOffersOptions = {}): Promise<CityGrossKlubbenOfferRow[]> {
  const sourceUrl = buildCityGrossKlubbenOffersUrl(options.sourceUrl, options.siteId);
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'application/json',
      'user-agent': 'GroceryView/0.1 citygross-klubben-offers (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });

  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`City Gross Klubben offers source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`City Gross Klubben offers request failed: ${response.status}`);

  return parseCityGrossKlubbenOffers(await response.json(), { sourceUrl, retrievedAt });
}

export function parseCityGrossKlubbenOffers(
  payload: unknown,
  context: { sourceUrl?: string; retrievedAt: string }
): CityGrossKlubbenOfferRow[] {
  const sourceUrl = context.sourceUrl ?? CITY_GROSS_KLUBBEN_OFFERS_URL;
  const offers = rawOffers(payload)
    .map((offer, index) => normalizeCityGrossKlubbenOffer(offer, { sourceUrl, retrievedAt: context.retrievedAt, index }))
    .filter((offer): offer is CityGrossKlubbenOfferRow => offer !== null);

  if (offers.length === 0) throw new Error('City Gross Klubben response had no structured offers.');
  return offers;
}

export function normalizeCityGrossKlubbenOffer(
  offer: RawOffer,
  context: { sourceUrl: string; retrievedAt: string; index: number }
): CityGrossKlubbenOfferRow | null {
  const title = firstText(offer.title, offer.name, offer.productName, offer.description);
  const productName = firstText(offer.productName, offer.name, offer.title);
  const id = firstText(offer.id, offer.offerId, offer.articleNumber, offer.gtin) || `${productName}-${context.index}`;
  if (!title || !productName) return null;

  const price = firstPrice(offer.price, offer.currentPrice, offer.campaignPrice, offer.memberPrice, nested(offer, 'price', 'price'));
  const originalPrice = firstPrice(offer.originalPrice, offer.ordinaryPrice, offer.regularPrice, nested(offer, 'ordinaryPrice', 'price'));

  return {
    id: `citygross-klubben-${slugify(id)}`,
    chainId: 'citygross',
    countryCode: 'SE',
    club: 'City Gross Klubben',
    title,
    productName,
    brand: firstText(offer.brand, offer.manufacturer),
    price,
    originalPrice,
    promotion: promotionRouter({ ...offer, title, price, originalPrice }),
    validFrom: firstDate(offer.validFrom, offer.startDate, offer.startsAt),
    validTo: firstDate(offer.validTo, offer.endDate, offer.expiresAt, offer.validUntil),
    sourceUrl: context.sourceUrl,
    retrievedAt: context.retrievedAt
  };
}

export function promotionRouter(offer: RawOffer): CityGrossKlubbenPromotion {
  const text = [offer.title, offer.description, offer.promotionText, offer.mechanics].map((value) => firstText(value)).filter(Boolean).join(' ');
  const price = firstPrice(offer.price, offer.currentPrice, offer.campaignPrice, offer.memberPrice);
  const originalPrice = firstPrice(offer.originalPrice, offer.ordinaryPrice, offer.regularPrice);
  const multibuy = text.match(/(\d+)\s*(?:för|for)\s*([0-9]+(?:[,.][0-9]{1,2})?)/i);
  if (multibuy) {
    const quantity = Number(multibuy[1]);
    const multibuyPrice = parsePrice(multibuy[2]) ?? 0;
    return { kind: 'multibuy', quantity, price: multibuyPrice, unit_price: roundMoney(multibuyPrice / quantity) };
  }

  const pct = text.match(/(\d{1,2})\s*%/);
  if (pct) return { kind: 'percent_off', pct_off: Number(pct[1]) };

  const amount = text.match(/(?:spara|rabatt)\s*([0-9]+(?:[,.][0-9]{1,2})?)/i);
  if (amount) return { kind: 'amount_off', amount_off: parsePrice(amount[1]) ?? 0 };

  if (price !== null) {
    return {
      kind: 'member_price',
      price,
      original_price: originalPrice,
      pct_off: originalPrice && originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : null
    };
  }

  return { kind: 'structured_text', label: text || 'City Gross Klubben offer' };
}

function buildCityGrossKlubbenOffersUrl(sourceUrl = CITY_GROSS_KLUBBEN_OFFERS_URL, siteId?: string): string {
  const url = new URL(sourceUrl);
  if (siteId) url.searchParams.set('siteId', siteId);
  return url.toString();
}

function rawOffers(payload: unknown): RawOffer[] {
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (!isRecord(payload)) return [];
  for (const key of ['items', 'offers', 'campaigns', 'data', 'results']) {
    const value = payload[key];
    if (Array.isArray(value)) return value.filter(isRecord);
  }
  return [payload];
}

function isRecord(value: unknown): value is RawOffer {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function nested(record: RawOffer, key: string, childKey: string): unknown {
  const value = record[key];
  return isRecord(value) ? value[childKey] : undefined;
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function firstPrice(...values: unknown[]): number | null {
  for (const value of values) {
    const price = parsePrice(value);
    if (price !== null) return price;
  }
  return null;
}

function parsePrice(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return roundMoney(value);
  if (typeof value !== 'string') return null;
  const parsed = Number.parseFloat(value.replace(/\s/g, '').replace(',', '.').replace(/(?:kr|sek)$/i, ''));
  return Number.isFinite(parsed) ? roundMoney(parsed) : null;
}

function firstDate(...values: unknown[]): string | null {
  for (const value of values) {
    const date = parseDate(value);
    if (date) return date;
  }
  return null;
}

function parseDate(value: unknown): string | null {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString();
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'offer';
}
