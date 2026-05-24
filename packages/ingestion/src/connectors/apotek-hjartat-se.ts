export type ApotekHjartatChannel = 'online' | 'store';

export type ApotekHjartatInput = {
  sku: string;
  name: string;
  sourceUrl: string;
  onlinePrice: number;
  storePrice?: number | null;
  campaignText?: string;
  category?: string;
  observedAt: string;
};

export type ApotekHjartatPriceRow = {
  sku: string;
  name: string;
  sourceUrl: string;
  price: number;
  currency: 'SEK';
  channel: ApotekHjartatChannel;
  category?: string;
  is_member_price: boolean;
  is_coupon_price: boolean;
  observedAt: string;
  multi_buy?: {
    quantity: number;
    mechanic: string;
  };
};

const MEMBER_MARKERS = ['klubb', 'medlem', 'student', 'senior', 'stammis'];
const COUPON_CODE_PATTERN = /\b[A-ZÅÄÖ]{2,}\d+[A-ZÅÄÖ0-9]*\b/u;
const MULTI_BUY_PATTERN = /\b(\d+)\s*f[oö]r\s*([\d.,]+\s*%|\d+\s*kr|\d+)\b/i;

function normalizedCampaign(text: string | undefined) {
  return text?.trim().toLocaleLowerCase('sv-SE') ?? '';
}

export function apotekHjartatMultiBuy(campaignText: string | undefined) {
  const match = campaignText?.match(MULTI_BUY_PATTERN);
  if (!match) return undefined;
  return {
    quantity: Number(match[1]),
    mechanic: match[0]
  };
}

export function isApotekHjartatMemberCampaign(campaignText: string | undefined) {
  const normalized = normalizedCampaign(campaignText);
  return MEMBER_MARKERS.some((marker) => normalized.includes(marker));
}

export function isApotekHjartatCouponCampaign(campaignText: string | undefined) {
  return COUPON_CODE_PATTERN.test(campaignText ?? '');
}

export function normalizeApotekHjartatPriceRows(input: ApotekHjartatInput): ApotekHjartatPriceRow[] {
  const isMemberPrice = isApotekHjartatMemberCampaign(input.campaignText);
  const isCouponPrice = isApotekHjartatCouponCampaign(input.campaignText);
  const multiBuy = apotekHjartatMultiBuy(input.campaignText);
  const base = {
    sku: input.sku,
    name: input.name,
    sourceUrl: input.sourceUrl,
    currency: 'SEK' as const,
    category: input.category,
    is_member_price: isMemberPrice,
    is_coupon_price: isCouponPrice,
    observedAt: input.observedAt,
    ...(multiBuy ? { multi_buy: multiBuy } : {})
  };

  const rows: ApotekHjartatPriceRow[] = [{
    ...base,
    price: input.onlinePrice,
    channel: 'online'
  }];

  if (typeof input.storePrice === 'number' && Number.isFinite(input.storePrice)) {
    rows.push({
      ...base,
      price: input.storePrice,
      channel: 'store',
      is_member_price: false,
      is_coupon_price: false
    });
  }

  return rows;
}
