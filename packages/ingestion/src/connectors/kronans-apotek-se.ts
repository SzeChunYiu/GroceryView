export type KronansApotekPromotion = {
  label: string;
  type: 'percent' | 'multi_buy' | 'coupon' | 'member';
  percentOff?: number;
  price?: number;
  quantity?: number;
};

export type KronansApotekSourceProduct = {
  id: string;
  name: string;
  price: number;
  observedAt: string;
  sourceUrl: string;
  channel?: 'online' | 'store';
  storeId?: string;
  region?: string;
  promotions?: KronansApotekPromotion[];
};

export type KronansApotekPriceRow = {
  raw_record_id: string;
  product_name: string;
  price: number;
  observed_at: string;
  source_url: string;
  channel: 'online' | 'store';
  store_id?: string;
  region?: string;
  is_member_price?: true;
  is_coupon_price?: true;
  is_subscription_price?: true;
  is_clearance?: true;
  multi_buy?: { quantity: number; price: number; label: string };
};

export const KRONANS_APOTEK_SE_SOURCE_QUIRKS = {
  chain_id: 'kronans-apotek-se',
  loyalty_program: 'Kundklubben',
  senior_member_discount: '15% seniorrabatt tisdagar för medlemmar över 65 år, i butik och online',
  online_price_label: 'Pris online / Kampanjpris online',
  coupon_scope: 'rabattkoder online, anges i kassan',
  subscription_program: 'No Kronoval consumer price program verified from kronansapotek.se in this study',
} as const;

export function parseKronansApotekPriceRows(products: KronansApotekSourceProduct[]): KronansApotekPriceRow[] {
  return products.flatMap((product) => {
    const base = {
      raw_record_id: product.id,
      product_name: product.name,
      price: product.price,
      observed_at: product.observedAt,
      source_url: product.sourceUrl,
      channel: product.channel ?? 'online',
      ...(product.storeId ? { store_id: product.storeId } : {}),
      ...(product.region ? { region: product.region } : {}),
    } satisfies KronansApotekPriceRow;

    const promotionRows = (product.promotions ?? []).map((promotion): KronansApotekPriceRow => {
      if (promotion.type === 'member') return { ...base, is_member_price: true };
      if (promotion.type === 'coupon') return { ...base, is_coupon_price: true };
      if (promotion.type === 'multi_buy' && promotion.quantity && promotion.price) {
        return { ...base, multi_buy: { quantity: promotion.quantity, price: promotion.price, label: promotion.label } };
      }
      return base;
    });

    return promotionRows.length > 0 ? promotionRows : [base];
  });
}
