export const COOP_MEDLEM_OFFERS_BASE_URL = 'https://www.coop.se/medlem/erbjudanden/';
export const DEFAULT_COOP_MEDLEM_REGIONS = ['stockholm', 'goteborg', 'malmo'] as const;
export const DEFAULT_COOP_MEDLEM_FORMATS = ['app', 'web'] as const;

export type CoopMedlemRegion = (typeof DEFAULT_COOP_MEDLEM_REGIONS)[number] | string;
export type CoopMedlemFormat = (typeof DEFAULT_COOP_MEDLEM_FORMATS)[number] | string;

export type StructuredCoopMedlemPromotion = {
  router: 'promotionRouter';
  priceType: 'promotion';
  promotionKind: 'member_offer' | 'multi_buy' | 'discount';
  memberRequired: boolean;
  price: number | null;
  priceText: string;
  mechanicText: string;
  validFrom: string;
  validTo: string;
};

export type CoopMedlemOfferRow = {
  offerId: string;
  chainId: 'coop';
  countryCode: 'SE';
  region: string;
  format: string;
  productName: string;
  brand: string;
  packageText: string;
  category: string;
  sourceUrl: string;
  imageUrl: string;
  retrievedAt: string;
  structuredPromotion: StructuredCoopMedlemPromotion;
};

type CoopMedlemApiOffer = {
  id?: unknown;
  offerId?: unknown;
  name?: unknown;
  productName?: unknown;
  brand?: unknown;
  packageText?: unknown;
  category?: unknown;
  priceText?: unknown;
  mechanicText?: unknown;
  validFrom?: unknown;
  validTo?: unknown;
  memberRequired?: unknown;
  imageUrl?: unknown;
};

type CoopMedlemPayload = {
  offers?: CoopMedlemApiOffer[];
};

export function buildCoopMedlemOffersUrl(region: CoopMedlemRegion, format: CoopMedlemFormat): string {
  const url = new URL(COOP_MEDLEM_OFFERS_BASE_URL);
  url.searchParams.set('region', region);
  url.searchParams.set('format', format);
  return url.toString();
}

export async function fetchCoopMedlemOffersSe(options: {
  fetchImpl?: typeof fetch;
  regions?: readonly CoopMedlemRegion[];
  formats?: readonly CoopMedlemFormat[];
  retrievedAt?: string;
} = {}): Promise<CoopMedlemOfferRow[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const regions = options.regions ?? DEFAULT_COOP_MEDLEM_REGIONS;
  const formats = options.formats ?? DEFAULT_COOP_MEDLEM_FORMATS;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: CoopMedlemOfferRow[] = [];
  const seen = new Set<string>();

  for (const region of regions) {
    for (const format of formats) {
      const sourceUrl = buildCoopMedlemOffersUrl(region, format);
      const response = await fetchImpl(sourceUrl, {
        headers: {
          accept: 'application/json,text/html',
          'user-agent': 'GroceryView/0.1 coop-medlem-offers-se (+https://github.com/SzeChunYiu/GroceryView)'
        }
      });
      if (!response.ok) throw new Error(`Coop Medlem offers request failed for ${region}/${format}: ${response.status}`);
      const parsedRows = parseCoopMedlemOffersPayload(await response.text(), { region, format, sourceUrl, retrievedAt });
      for (const row of parsedRows) {
        const key = `${row.region}:${row.format}:${row.offerId}`;
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push(row);
      }
    }
  }

  return rows;
}

export function parseCoopMedlemOffersPayload(
  body: string,
  context: { region: string; format: string; sourceUrl: string; retrievedAt: string }
): CoopMedlemOfferRow[] {
  const payload = parsePayload(body);
  return (payload.offers ?? [])
    .map((offer) => normalizeCoopMedlemOffer(offer, context))
    .filter((row): row is CoopMedlemOfferRow => row !== null);
}

function normalizeCoopMedlemOffer(
  offer: CoopMedlemApiOffer,
  context: { region: string; format: string; sourceUrl: string; retrievedAt: string }
): CoopMedlemOfferRow | null {
  const offerId = text(offer.offerId) || text(offer.id);
  const productName = text(offer.productName) || text(offer.name);
  const priceText = text(offer.priceText);
  const validFrom = text(offer.validFrom);
  const validTo = text(offer.validTo);
  if (!offerId || !productName || !priceText || !validFrom || !validTo) return null;

  return {
    offerId,
    chainId: 'coop',
    countryCode: 'SE',
    region: context.region,
    format: context.format,
    productName,
    brand: text(offer.brand),
    packageText: text(offer.packageText),
    category: text(offer.category) || 'coop-medlem',
    sourceUrl: context.sourceUrl,
    imageUrl: text(offer.imageUrl),
    retrievedAt: context.retrievedAt,
    structuredPromotion: promotionRouter({
      priceText,
      mechanicText: text(offer.mechanicText) || priceText,
      memberRequired: offer.memberRequired !== false,
      validFrom,
      validTo
    })
  };
}

export function promotionRouter(input: {
  priceText: string;
  mechanicText: string;
  memberRequired: boolean;
  validFrom: string;
  validTo: string;
}): StructuredCoopMedlemPromotion {
  const price = parsePrice(input.priceText);
  return {
    router: 'promotionRouter',
    priceType: 'promotion',
    promotionKind: input.memberRequired ? 'member_offer' : (/(\d+)\s*för/i.test(input.mechanicText) ? 'multi_buy' : 'discount'),
    memberRequired: input.memberRequired,
    price,
    priceText: input.priceText,
    mechanicText: input.mechanicText,
    validFrom: input.validFrom,
    validTo: input.validTo
  };
}

function parsePayload(body: string): CoopMedlemPayload {
  const trimmed = body.trim();
  if (trimmed.startsWith('{')) return JSON.parse(trimmed) as CoopMedlemPayload;
  const embedded = body.match(/<script[^>]+id=["']__COOP_MEDLEM_OFFERS__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!embedded) throw new Error('Coop Medlem offers payload missing.');
  return JSON.parse(embedded[1]) as CoopMedlemPayload;
}

function parsePrice(value: string): number | null {
  const matches = [...value.matchAll(/([0-9]+(?:[,.][0-9]{1,2})?)/g)];
  const match = matches[matches.length - 1];
  if (!match) return null;
  const parsed = Number.parseFloat(match[1].replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
