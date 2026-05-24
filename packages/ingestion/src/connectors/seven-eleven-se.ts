export type SevenElevenSeChannel = 'store' | 'online';
export type SevenElevenSeFormat = 'standard' | 'airport';

export type SevenElevenSeRawProduct = {
  category: string;
  currency?: string;
  format?: SevenElevenSeFormat;
  isAppCoupon?: boolean;
  isClearance?: boolean;
  isMemberOffer?: boolean;
  isSubscriptionOffer?: boolean;
  name: string;
  onlinePrice?: number;
  regionTag?: string;
  sourceUrl: string;
  storeId?: string;
  storePrice?: number;
};

export type SevenElevenSePriceRow = {
  category: string;
  channel: SevenElevenSeChannel;
  currency: string;
  format: SevenElevenSeFormat;
  is_clearance: boolean;
  is_coupon_price: boolean;
  is_member_price: boolean;
  is_subscription_price: boolean;
  name: string;
  price: number;
  region_tag?: string;
  source_url: string;
  store_id?: string;
};

export const SEVEN_ELEVEN_SE_ASSORTMENT_URL = 'https://7-eleven.se/vart-sortiment/';
export const SEVEN_ELEVEN_SE_CLICK_AND_COLLECT_TERMS_URL = 'https://7-eleven.se/anvandarvillkor/click-and-collect-tos/';
export const SEVEN_ELEVEN_SE_APP_TERMS_URL = 'https://7-eleven.se/kontakt/behandling-av-personuppgifter/appar/';

export function normalizeSevenElevenSeRows(product: SevenElevenSeRawProduct): SevenElevenSePriceRow[] {
  const rows: SevenElevenSePriceRow[] = [];
  const shared: Omit<SevenElevenSePriceRow, 'channel' | 'price'> = {
    category: product.category,
    currency: product.currency ?? 'SEK',
    format: product.format ?? 'standard',
    is_clearance: product.isClearance === true,
    is_coupon_price: product.isAppCoupon === true,
    is_member_price: product.isMemberOffer === true || product.isAppCoupon === true,
    is_subscription_price: product.isSubscriptionOffer === true,
    name: product.name,
    source_url: product.sourceUrl
  };

  if (product.regionTag) shared.region_tag = product.regionTag;
  if (product.storeId) shared.store_id = product.storeId;

  if (typeof product.storePrice === 'number') {
    rows.push({
      ...shared,
      channel: 'store',
      price: product.storePrice
    });
  }

  if (typeof product.onlinePrice === 'number') {
    rows.push({
      ...shared,
      channel: 'online',
      price: product.onlinePrice
    });
  }

  return rows;
}
