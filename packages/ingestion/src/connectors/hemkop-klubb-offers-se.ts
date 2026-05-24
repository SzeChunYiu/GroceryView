export const HEMKOP_KLUBB_OFFERS_SE_URL = 'https://www.hemkop.se/axfood/rest/klubb/offers';

export type HemkopKlubbOfferRow = {
  offerId: string;
  productCode: string;
  title: string;
  brand: string;
  memberOnly: true;
  promotionType: 'hemkop_klubb_app_offer';
  promoPrice: number;
  regularPrice: number | null;
  promoText: string;
  mechanic: string;
  validFrom: string;
  validTo: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
  structuredPromotion: {
    router: 'promotionRouter';
    retailer: 'hemkop';
    market: 'SE';
    channel: 'klubb_app';
    priceType: 'member';
  };
};

type HemkopKlubbRawOffer = Record<string, unknown>;

type HemkopKlubbOffersPayload = {
  offers?: HemkopKlubbRawOffer[];
  results?: HemkopKlubbRawOffer[];
  data?: { offers?: HemkopKlubbRawOffer[] };
};

type FetchHemkopKlubbOffersOptions = {
  sourceUrl?: string;
  fetchImpl?: typeof fetch;
  retrievedAt?: string;
};

export const hemkopKlubbOffersSeFixture: HemkopKlubbOffersPayload = {
  offers: [{
    id: 'klubb-001',
    productCode: '7310865004703',
    title: 'Hemköp Klubb kaffe',
    brand: 'Hemköp',
    price: 39.9,
    ordinaryPrice: 52.9,
    label: 'Klubbpris 39:90/st',
    mechanic: 'member_price',
    validFrom: '2026-05-18',
    validTo: '2026-05-24',
    imageUrl: 'https://www.hemkop.se/images/7310865004703.png'
  }]
};

export async function fetchHemkopKlubbOffersSe(options: FetchHemkopKlubbOffersOptions = {}): Promise<HemkopKlubbOfferRow[]> {
  const sourceUrl = options.sourceUrl ?? process.env.HEMKOP_KLUBB_OFFERS_SE_URL ?? HEMKOP_KLUBB_OFFERS_SE_URL;
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(sourceUrl, { headers: { accept: 'application/json' } });

  if (!response.ok) {
    throw new Error(`Hemköp Klubb offers request failed: ${response.status}`);
  }

  return parseHemkopKlubbOffersSe(await response.json(), {
    retrievedAt: options.retrievedAt ?? new Date().toISOString(),
    sourceUrl
  });
}

export function parseHemkopKlubbOffersSe(payload: unknown, context: { sourceUrl: string; retrievedAt: string }): HemkopKlubbOfferRow[] {
  return rawOffers(payload)
    .map((offer) => promotionRouter(offer, context))
    .filter((row): row is HemkopKlubbOfferRow => row !== null);
}

export function promotionRouter(raw: HemkopKlubbRawOffer, context: { sourceUrl: string; retrievedAt: string }): HemkopKlubbOfferRow | null {
  const offerId = text(raw.id) || text(raw.offerId) || text(raw.code);
  const productCode = text(raw.productCode) || text(raw.gtin) || text(raw.ean);
  const title = text(raw.title) || text(raw.name) || text(raw.productName);
  const promoPrice = numberOrNull(raw.price) ?? numberOrNull(raw.promoPrice) ?? numberOrNull(raw.memberPrice);
  const nestedImageUrl = isRecord(raw.image) ? text(raw.image.url) : '';

  if (!offerId || !title || promoPrice === null) return null;

  return {
    offerId,
    productCode,
    title,
    brand: text(raw.brand) || text(raw.manufacturer),
    memberOnly: true,
    promotionType: 'hemkop_klubb_app_offer',
    promoPrice,
    regularPrice: numberOrNull(raw.regularPrice) ?? numberOrNull(raw.ordinaryPrice),
    promoText: text(raw.label) || text(raw.promoText) || text(raw.description),
    mechanic: text(raw.mechanic) || text(raw.promotionMechanic) || 'member_price',
    validFrom: text(raw.validFrom) || text(raw.startDate),
    validTo: text(raw.validTo) || text(raw.endDate),
    imageUrl: text(raw.imageUrl) || nestedImageUrl,
    sourceUrl: context.sourceUrl,
    retrievedAt: context.retrievedAt,
    structuredPromotion: {
      router: 'promotionRouter',
      retailer: 'hemkop',
      market: 'SE',
      channel: 'klubb_app',
      priceType: 'member'
    }
  };
}

function rawOffers(payload: unknown): HemkopKlubbRawOffer[] {
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (!isRecord(payload)) return [];

  const shaped = payload as HemkopKlubbOffersPayload;
  if (Array.isArray(shaped.offers)) return shaped.offers.filter(isRecord);
  if (Array.isArray(shaped.results)) return shaped.results.filter(isRecord);
  if (Array.isArray(shaped.data?.offers)) return shaped.data.offers.filter(isRecord);
  return [];
}

function isRecord(value: unknown): value is HemkopKlubbRawOffer {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const normalized = value.replace(',', '.').replace(/[^0-9.]/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
