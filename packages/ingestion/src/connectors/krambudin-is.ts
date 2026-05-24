export type KrambudinPriceChannel = 'store' | 'online' | 'counter' | 'packaged';

export type KrambudinPricingRow = {
  id: string;
  product_name: string;
  category: string;
  price_isk: number | null;
  channel: KrambudinPriceChannel;
  source_url: string;
  evidence: string;
  is_member_price?: true;
  is_coupon_price?: true;
  is_subscription_price?: true;
  is_clearance?: true;
  multi_buy?: { minimum_quantity: number; unit_price_isk: number };
  format?: string;
  store_id?: string;
};

export const KRAMBUDIN_SOURCE_URLS = {
  app: 'https://www.krambudin.is/app/',
  deliveryEnded: 'https://www.krambudin.is/category/frettir-is/',
  offers: 'https://www.krambudin.is/frettir/tilkynning-krambud/',
  stores: 'https://www.krambudin.is/um-okkur/'
} as const;

export const krambudinPricingRows: KrambudinPricingRow[] = [
  {
    id: 'krambudin-samkaupa-app-weekly-offer-credit',
    product_name: 'Vikuleg apptilboð / selected offer products',
    category: 'selected_offer_products',
    price_isk: null,
    channel: 'store',
    is_member_price: true,
    is_coupon_price: true,
    source_url: KRAMBUDIN_SOURCE_URLS.app,
    evidence: 'Krambúðin app page says Samkaupa app users can use weekly app offers with up to 50% app discount as credit.'
  }
];

export function buildKrambudinPricingRows(): KrambudinPricingRow[] {
  return krambudinPricingRows.map((row) => ({ ...row }));
}
