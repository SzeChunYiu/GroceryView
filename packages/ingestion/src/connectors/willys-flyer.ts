export type WillysFlyerPromotion =
  | { kind: 'buy_x_pay_y'; buy_quantity: number; pay_quantity: number; pct_off: number }
  | { kind: 'multibuy'; quantity: number; price: number; unit_price: number }
  | { kind: 'percent_off'; pct_off: number }
  | { kind: 'amount_off'; amount_off: number }
  | { kind: 'campaign_price'; price: number; original_price: number | null; pct_off: number | null }
  | { kind: 'structured_text'; label: string };

export type WillysFlyerOfferRow = {
  id: string;
  chainId: 'willys';
  countryCode: 'SE';
  channel: 'weekly_flyer';
  title: string;
  productName: string;
  brand: string;
  price: number | null;
  originalPrice: number | null;
  promotion: WillysFlyerPromotion;
  validFrom: string | null;
  validTo: string | null;
  sourceUrl: string;
  retrievedAt: string;
};

type RawOffer = Record<string, unknown>;

export type FetchWillysFlyerOffersOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  retrievedAt?: string;
};

export const WILLYS_FLYER_URL = 'https://www.willys.se/erbjudanden';

export async function fetchWillysFlyerOffers(options: FetchWillysFlyerOffersOptions = {}): Promise<WillysFlyerOfferRow[]> {
  const sourceUrl = options.sourceUrl ?? WILLYS_FLYER_URL;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'text/html,application/json;q=0.9',
      'user-agent': 'GroceryView/0.1 willys-flyer (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });

  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Willys flyer source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Willys flyer request failed: ${response.status}`);

  return parseWillysFlyerOffers(await response.text(), { sourceUrl, retrievedAt });
}

export function parseWillysFlyerOffers(body: unknown, context: { sourceUrl?: string; retrievedAt: string }): WillysFlyerOfferRow[] {
  const sourceUrl = context.sourceUrl ?? WILLYS_FLYER_URL;
  const offers = rawOffers(body)
    .map((offer, index) => normalizeWillysFlyerOffer(offer, { sourceUrl, retrievedAt: context.retrievedAt, index }))
    .filter((offer): offer is WillysFlyerOfferRow => offer !== null);

  if (offers.length === 0) throw new Error('Willys flyer response had no structured weekly flyer offers.');
  return offers;
}

export function normalizeWillysFlyerOffer(
  offer: RawOffer,
  context: { sourceUrl: string; retrievedAt: string; index: number }
): WillysFlyerOfferRow | null {
  const title = firstText(offer.title, offer.name, offer.productName, offer.description, offer.cartLabel, offer.rewardLabel);
  const mechanics = [title, offer.description, offer.cartLabel, offer.rewardLabel, offer.conditionLabel].map((value) => firstText(value)).join(' ');
  if (/willys\s*plus|pluspris|endast\s+i\s+app/i.test(mechanics)) return null;

  const productName = firstText(offer.productName, offer.name, offer.title);
  const id = firstText(offer.id, offer.code, offer.productCode, offer.articleNumber, offer.gtin) || `${productName}-${context.index}`;
  if (!title || !productName) return null;

  const price = firstPrice(offer.price, offer.priceValue, offer.campaignPrice, offer.priceNoUnit);
  const originalPrice = firstPrice(offer.originalPrice, offer.ordinaryPrice, offer.regularPrice, offer.comparePrice);

  return {
    id: `willys-flyer-${slugify(id)}`,
    chainId: 'willys',
    countryCode: 'SE',
    channel: 'weekly_flyer',
    title,
    productName,
    brand: firstText(offer.brand, offer.brands, offer.manufacturer),
    price,
    originalPrice,
    promotion: promotionRouter({ ...offer, title, price, originalPrice }),
    validFrom: firstDate(offer.validFrom, offer.startDate, offer.startsAt),
    validTo: firstDate(offer.validTo, offer.endDate, offer.validUntil, offer.expiresAt),
    sourceUrl: context.sourceUrl,
    retrievedAt: context.retrievedAt
  };
}

export function promotionRouter(offer: RawOffer): WillysFlyerPromotion {
  const text = [offer.title, offer.description, offer.cartLabel, offer.rewardLabel, offer.conditionLabel, offer.promotionText]
    .map((value) => firstText(value))
    .filter(Boolean)
    .join(' ');
  const buyPay = text.match(/(?:tag|köp)\s*(\d+)\s*(?:betala\s*(?:för)?|för)\s*(\d+)/i);
  if (buyPay) {
    const buy = Number(buyPay[1]);
    const pay = Number(buyPay[2]);
    return { kind: 'buy_x_pay_y', buy_quantity: buy, pay_quantity: pay, pct_off: Math.round(((buy - pay) / buy) * 100) };
  }

  const multibuy = text.match(/(\d+)\s*(?:för|for)\s*([0-9]+(?:[,.][0-9]{1,2})?)/i);
  if (multibuy) {
    const quantity = Number(multibuy[1]);
    const price = parsePrice(multibuy[2]) ?? 0;
    return { kind: 'multibuy', quantity, price, unit_price: roundMoney(price / quantity) };
  }

  const pct = text.match(/(\d{1,2})\s*%/);
  if (pct) return { kind: 'percent_off', pct_off: Number(pct[1]) };

  const amount = text.match(/(?:spara|rabatt)\s*([0-9]+(?:[,.][0-9]{1,2})?)/i);
  if (amount) return { kind: 'amount_off', amount_off: parsePrice(amount[1]) ?? 0 };

  const price = firstPrice(offer.price, offer.priceValue, offer.campaignPrice, offer.priceNoUnit);
  const originalPrice = firstPrice(offer.originalPrice, offer.ordinaryPrice, offer.regularPrice, offer.comparePrice);
  if (price !== null) {
    return {
      kind: 'campaign_price',
      price,
      original_price: originalPrice,
      pct_off: originalPrice && originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : null
    };
  }

  return { kind: 'structured_text', label: text || 'Willys weekly flyer offer' };
}

function rawOffers(body: unknown): RawOffer[] {
  if (Array.isArray(body)) return body.filter(isRecord);
  if (isRecord(body)) return offersFromObject(body);
  if (typeof body !== 'string') return [];
  const json = parseJson(body);
  if (json) return rawOffers(json);
  const nextData = body.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i)?.[1];
  const nextOffers = rawOffers(parseJson(nextData ?? ''));
  if (nextOffers.length > 0) return nextOffers;
  const embeddedOffers = body.match(/(?:offers|campaigns|products)\s*[:=]\s*(\[[\s\S]*?\]);/i)?.[1];
  return rawOffers(parseJson(embeddedOffers ?? ''));
}

function offersFromObject(record: RawOffer): RawOffer[] {
  for (const key of ['items', 'offers', 'campaigns', 'products', 'results', 'data']) {
    const value = record[key];
    if (Array.isArray(value)) return value.filter(isRecord);
    if (isRecord(value)) {
      const nested = offersFromObject(value);
      if (nested.length > 0) return nested;
    }
  }
  return [record];
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is RawOffer {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    if (Array.isArray(value)) return value.map((item) => firstText(item)).filter(Boolean).join(', ');
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
