export type Rema1000FlyerOffer = {
  id: string;
  title: string;
  price: number;
  observedAt: string;
  validFrom?: string;
  validTo?: string;
  sourceUrl: string;
  imageUrl?: string;
  subtitle?: string;
  memberOnly?: boolean;
  multiBuyQuantity?: number;
  multiBuyPrice?: number;
};

export type Rema1000PromotionRow = {
  chain_id: 'rema-1000-no';
  country: 'NO';
  currency: 'NOK';
  row_type: 'promotion';
  raw_record_id: string;
  title: string;
  price: number;
  observed_at: string;
  source_url: string;
  channel: 'flyer';
  price_program: 'ae-app' | 'public';
  is_member_price?: true;
  valid_from?: string;
  valid_to?: string;
  image_url?: string;
  subtitle?: string;
  multi_buy?: { quantity: number; price: number };
};

export const REMA_1000_NO_FLYER_SOURCES = {
  offers: 'https://www.rema.no/tilbud/',
  aeApp: 'https://www.rema.no/ae/',
  sourceNotes: 'Rema 1000 Norway publishes weekly offers and æ-app member discounts on rema.no.',
} as const;

export function parseRema1000FlyerNoOffers(offers: Rema1000FlyerOffer[]): Rema1000PromotionRow[] {
  return offers.map((offer) => ({
    chain_id: 'rema-1000-no',
    country: 'NO',
    currency: 'NOK',
    row_type: 'promotion',
    raw_record_id: offer.id,
    title: offer.title,
    price: offer.price,
    observed_at: offer.observedAt,
    source_url: offer.sourceUrl,
    channel: 'flyer',
    price_program: offer.memberOnly ? 'ae-app' : 'public',
    ...(offer.memberOnly ? { is_member_price: true } : {}),
    ...(offer.validFrom ? { valid_from: offer.validFrom } : {}),
    ...(offer.validTo ? { valid_to: offer.validTo } : {}),
    ...(offer.imageUrl ? { image_url: offer.imageUrl } : {}),
    ...(offer.subtitle ? { subtitle: offer.subtitle } : {}),
    ...(offer.multiBuyQuantity && offer.multiBuyPrice ? { multi_buy: { quantity: offer.multiBuyQuantity, price: offer.multiBuyPrice } } : {}),
  }));
}
