export type IcelandFlyerIsChain = 'iceland' | 'samkaup' | 'netto-is' | 'kronan-is' | 'krambudin';

export type IcelandFlyerIsRawOffer = {
  id: string;
  title: string;
  price?: number | string | null;
  regularPrice?: number | string | null;
  chain?: IcelandFlyerIsChain;
  flyerId?: string;
  validFrom?: string | null;
  validTo?: string | null;
  imageUrl?: string | null;
  url?: string | null;
};

export type IcelandFlyerIsOffer = {
  country: 'IS';
  currency: 'ISK';
  chain: IcelandFlyerIsChain;
  id: string;
  name: string;
  price: number | null;
  regular_price: number | null;
  flyer_id: string | null;
  valid_from: string | null;
  valid_to: string | null;
  image_url: string | null;
  source_url: string | null;
};

export const icelandFlyerIsConnector = {
  country: 'IS',
  currency: 'ISK',
  family: 'samkaup',
  source: 'direct-flyer-feed'
} as const;

function parseIsk(value: number | string | null | undefined) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (!value) return null;
  const parsed = Number(value.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeIcelandFlyerIsOffer(raw: IcelandFlyerIsRawOffer): IcelandFlyerIsOffer {
  if (!raw.id || !raw.title.trim()) {
    throw new Error('Iceland flyer offer requires id and title');
  }

  return {
    country: 'IS',
    currency: 'ISK',
    chain: raw.chain ?? 'iceland',
    id: raw.id,
    name: raw.title.trim(),
    price: parseIsk(raw.price),
    regular_price: parseIsk(raw.regularPrice),
    flyer_id: raw.flyerId ?? null,
    valid_from: raw.validFrom ?? null,
    valid_to: raw.validTo ?? null,
    image_url: raw.imageUrl ?? null,
    source_url: raw.url ?? null
  };
}

export const icelandFlyerIsConnectorUnitCases = [
  {
    name: 'normalizes Iceland flyer feed rows as IS/ISK',
    input: { id: 'offer-1', title: 'Mjólk', price: '399 kr.', flyerId: 'samkaup-vika-1' },
    expected: { country: 'IS', currency: 'ISK', chain: 'iceland', price: 399 }
  }
];
