export type TankaSeFuelCategory = 'bensin_95' | 'bensin_98' | 'diesel' | 'e85' | 'el' | 'gas' | 'adblue' | 'hvo100';

export type TankaSePriceRow = {
  channel: 'store';
  chain: 'Tanka';
  country: 'SE';
  evidence: string;
  is_clearance: false;
  is_coupon_price: false;
  is_member_price: boolean;
  is_subscription_price: false;
  member_program?: 'CarPay';
  price: null;
  price_unavailable_reason: 'local_station_sign_only';
  product_category: TankaSeFuelCategory;
  source_url: string;
  store_id: string;
  store_region_tag?: string;
};

export const tankaSeFuelCategories: TankaSeFuelCategory[] = ['bensin_95', 'bensin_98', 'diesel', 'e85', 'el', 'gas', 'adblue', 'hvo100'];

const tankaHomeSource = 'https://tanka.se/';
const tankaStationsSource = 'https://www.tanka.se/bensinstationer';

export function buildTankaSeStoreRows(input: { storeId: string; storeRegionTag?: string; categories?: TankaSeFuelCategory[] }): TankaSePriceRow[] {
  const storeId = input.storeId.trim();
  if (!storeId) throw new Error('storeId is required for Tanka local-station price rows.');
  const categories = input.categories ?? tankaSeFuelCategories;

  return categories.flatMap((productCategory) => {
    const baseRow: TankaSePriceRow = {
      channel: 'store',
      chain: 'Tanka',
      country: 'SE',
      evidence: 'Tanka states current fuel price is shown on the local station price sign, not as a national online price.',
      is_clearance: false,
      is_coupon_price: false,
      is_member_price: false,
      is_subscription_price: false,
      price: null,
      price_unavailable_reason: 'local_station_sign_only',
      product_category: productCategory,
      source_url: tankaStationsSource,
      store_id: storeId,
      ...(input.storeRegionTag ? { store_region_tag: input.storeRegionTag } : {})
    };

    return [
      baseRow,
      {
        ...baseRow,
        evidence: 'Tanka states customers get bonus and discount when paying fuel with CarPay at Tanka stations; no percent is published on the listed source.',
        is_member_price: true,
        member_program: 'CarPay',
        source_url: tankaHomeSource
      }
    ];
  });
}
