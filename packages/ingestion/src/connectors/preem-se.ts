export const PREEM_SE_RETAILER_ID = 'preem-se';
export const PREEM_SE_SOURCE_URL = 'https://www.preem.se';

export type PreemSeFormat = 'staffed_station' | 'automat_station' | 'company_card_list_price' | 'truck_card_list_price' | 'bulk_list_price' | 'ev_charging_list_price';
export type PreemSeCustomerSegment = 'consumer' | 'business';

export type PreemSePriceRow = {
  retailerId: typeof PREEM_SE_RETAILER_ID;
  countryCode: 'SE';
  productName: string;
  price: number | null;
  currency: 'SEK';
  unit: 'liter' | 'kg' | 'kwh' | 'm3' | 'nm3';
  channel: 'store';
  format: PreemSeFormat;
  customer_segment: PreemSeCustomerSegment;
  sourceUrl: string;
  retrievedAt: string;
  store_id?: string;
  store_region_tag?: 'station_local';
  is_member_price?: true;
  membership_program?: 'Preem Mastercard';
  discount_ore_per_liter?: 25 | 10;
  is_b2b_price?: true;
};

function timestamp(value: string | Date | undefined): string {
  const date = value === undefined ? new Date() : value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('retrievedAt must be a valid date.');
  return date.toISOString();
}

export function buildPreemConsumerPumpPriceRow(input: {
  productName: string;
  price: number;
  unit?: 'liter' | 'kg' | 'kwh';
  format: 'staffed_station' | 'automat_station';
  storeId: string;
  retrievedAt?: string | Date;
  sourceUrl?: string;
}): PreemSePriceRow {
  return {
    retailerId: PREEM_SE_RETAILER_ID,
    countryCode: 'SE',
    productName: input.productName,
    price: input.price,
    currency: 'SEK',
    unit: input.unit ?? 'liter',
    channel: 'store',
    format: input.format,
    customer_segment: 'consumer',
    store_id: input.storeId,
    store_region_tag: 'station_local',
    sourceUrl: input.sourceUrl ?? 'https://www.preem.se/pa-stationen/drivmedel/drivmedelspriser/',
    retrievedAt: timestamp(input.retrievedAt)
  };
}

export function buildPreemMastercardDiscountRows(retrievedAt?: string | Date): PreemSePriceRow[] {
  const sourceUrl = 'https://www.preem.se/privat/kort-och-formaner/preem-mastercard/rabatter/';
  return [
    {
      retailerId: PREEM_SE_RETAILER_ID,
      countryCode: 'SE',
      productName: 'Drivmedelsrabatt bemannad station',
      price: null,
      currency: 'SEK',
      unit: 'liter',
      channel: 'store',
      format: 'staffed_station',
      customer_segment: 'consumer',
      is_member_price: true,
      membership_program: 'Preem Mastercard',
      discount_ore_per_liter: 25,
      sourceUrl,
      retrievedAt: timestamp(retrievedAt)
    },
    {
      retailerId: PREEM_SE_RETAILER_ID,
      countryCode: 'SE',
      productName: 'Drivmedelsrabatt automatstation',
      price: null,
      currency: 'SEK',
      unit: 'liter',
      channel: 'store',
      format: 'automat_station',
      customer_segment: 'consumer',
      is_member_price: true,
      membership_program: 'Preem Mastercard',
      discount_ore_per_liter: 10,
      sourceUrl,
      retrievedAt: timestamp(retrievedAt)
    }
  ];
}

export function buildPreemBusinessListPriceRow(input: {
  productName: string;
  price: number;
  unit: 'liter' | 'kg' | 'kwh' | 'm3' | 'nm3';
  format: 'company_card_list_price' | 'truck_card_list_price' | 'bulk_list_price' | 'ev_charging_list_price';
  retrievedAt?: string | Date;
  sourceUrl?: string;
}): PreemSePriceRow {
  return {
    retailerId: PREEM_SE_RETAILER_ID,
    countryCode: 'SE',
    productName: input.productName,
    price: input.price,
    currency: 'SEK',
    unit: input.unit,
    channel: 'store',
    format: input.format,
    customer_segment: 'business',
    is_b2b_price: true,
    sourceUrl: input.sourceUrl ?? 'https://www.preem.se/foretag/listpriser/',
    retrievedAt: timestamp(input.retrievedAt)
  };
}
