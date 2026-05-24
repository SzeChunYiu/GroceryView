export type SunkostNoSourceProduct = {
  id: string;
  name: string;
  price: number;
  observedAt: string;
  sourceUrl: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  comparePriceText?: string;
  memberPrice?: number;
};

export type SunkostNoProductRow = {
  chain_id: 'sunkost-no';
  country: 'NO';
  vertical: 'health_food';
  raw_record_id: string;
  product_name: string;
  price: number;
  currency: 'NOK';
  observed_at: string;
  source_url: string;
  channel: 'online';
  brand?: string;
  category?: string;
  image_url?: string;
  compare_price_text?: string;
  is_member_price?: true;
};

export const SUNKOST_NO_SOURCES = {
  products: 'https://sunkost.no/',
  stores: 'https://sunkost.no/butikker',
  sourceNotes: 'Sunkost is a Norwegian health-food retailer with national online catalogue and store locator surfaces.',
} as const;

function baseRow(product: SunkostNoSourceProduct): SunkostNoProductRow {
  return {
    chain_id: 'sunkost-no',
    country: 'NO',
    vertical: 'health_food',
    raw_record_id: product.id,
    product_name: product.name,
    price: product.price,
    currency: 'NOK',
    observed_at: product.observedAt,
    source_url: product.sourceUrl,
    channel: 'online',
    ...(product.brand ? { brand: product.brand } : {}),
    ...(product.category ? { category: product.category } : {}),
    ...(product.imageUrl ? { image_url: product.imageUrl } : {}),
    ...(product.comparePriceText ? { compare_price_text: product.comparePriceText } : {}),
  };
}

export function parseSunkostNoProducts(products: SunkostNoSourceProduct[]): SunkostNoProductRow[] {
  return products.flatMap((product) => {
    const row = baseRow(product);
    if (typeof product.memberPrice === 'number' && Number.isFinite(product.memberPrice)) return [row, { ...row, price: product.memberPrice, is_member_price: true }];
    return [row];
  });
}
