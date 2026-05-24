export type LifeSeSourceProduct = {
  id: string;
  name: string;
  price: number;
  observedAt: string;
  sourceUrl: string;
  brand?: string;
  category?: string;
  comparePriceText?: string;
  imageUrl?: string;
  memberPrice?: number;
};

export type LifeSeProductRow = {
  chain_id: 'life-se';
  country: 'SE';
  vertical: 'health_food';
  raw_record_id: string;
  product_name: string;
  price: number;
  currency: 'SEK';
  observed_at: string;
  source_url: string;
  channel: 'online';
  brand?: string;
  category?: string;
  compare_price_text?: string;
  image_url?: string;
  is_member_price?: true;
};

export const LIFE_SE_SOURCES = {
  products: 'https://www.lifebutiken.se/',
  stores: 'https://www.lifebutiken.se/butiker',
  sourceNotes: 'Life describes its Sweden/Norway store network and publishes online health-food product catalogue pages on lifebutiken.se.',
} as const;

function baseRow(product: LifeSeSourceProduct): LifeSeProductRow {
  return {
    chain_id: 'life-se',
    country: 'SE',
    vertical: 'health_food',
    raw_record_id: product.id,
    product_name: product.name,
    price: product.price,
    currency: 'SEK',
    observed_at: product.observedAt,
    source_url: product.sourceUrl,
    channel: 'online',
    ...(product.brand ? { brand: product.brand } : {}),
    ...(product.category ? { category: product.category } : {}),
    ...(product.comparePriceText ? { compare_price_text: product.comparePriceText } : {}),
    ...(product.imageUrl ? { image_url: product.imageUrl } : {}),
  };
}

export function parseLifeSeProducts(products: LifeSeSourceProduct[]): LifeSeProductRow[] {
  return products.flatMap((product) => {
    const row = baseRow(product);
    if (typeof product.memberPrice === 'number' && Number.isFinite(product.memberPrice)) {
      return [row, { ...row, price: product.memberPrice, is_member_price: true }];
    }
    return [row];
  });
}
