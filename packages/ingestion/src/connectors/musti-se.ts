export type MustiSeSourceProduct = {
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
  campaignPrice?: number;
};

export type MustiSeProductRow = {
  chain_id: 'musti-se';
  country: 'SE';
  vertical: 'pet_supplies';
  raw_record_id: string;
  product_name: string;
  price: number;
  currency: 'SEK';
  observed_at: string;
  source_url: string;
  channel: 'online';
  brand?: string;
  category?: string;
  image_url?: string;
  compare_price_text?: string;
  is_member_price?: true;
  is_campaign_price?: true;
};

export const MUSTI_SE_SOURCES = {
  products: 'https://www.mustijamirri.se/',
  stores: 'https://www.mustijamirri.se/hitta-butik',
  sourceNotes: 'Musti & Mirri is a Swedish pet-supplies retailer with online catalogue and store locator surfaces.',
} as const;

function baseRow(product: MustiSeSourceProduct): MustiSeProductRow {
  return {
    chain_id: 'musti-se',
    country: 'SE',
    vertical: 'pet_supplies',
    raw_record_id: product.id,
    product_name: product.name,
    price: product.price,
    currency: 'SEK',
    observed_at: product.observedAt,
    source_url: product.sourceUrl,
    channel: 'online',
    ...(product.brand ? { brand: product.brand } : {}),
    ...(product.category ? { category: product.category } : {}),
    ...(product.imageUrl ? { image_url: product.imageUrl } : {}),
    ...(product.comparePriceText ? { compare_price_text: product.comparePriceText } : {}),
  };
}

export function parseMustiSeProducts(products: MustiSeSourceProduct[]): MustiSeProductRow[] {
  return products.flatMap((product) => {
    const row = baseRow(product);
    const rows = [row];
    if (typeof product.campaignPrice === 'number' && Number.isFinite(product.campaignPrice)) rows.push({ ...row, price: product.campaignPrice, is_campaign_price: true });
    if (typeof product.memberPrice === 'number' && Number.isFinite(product.memberPrice)) rows.push({ ...row, price: product.memberPrice, is_member_price: true });
    return rows;
  });
}
