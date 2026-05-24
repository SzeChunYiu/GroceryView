export type WeightVariantInput = {
  productId: string;
  name: string;
  price: number;
};

export type WeightVariantNormalisation = {
  productId: string;
  base_product: string;
  weight_g: number;
  price_per_100g: number;
};

const weightPattern = /\b(\d+(?:[,.]\d+)?)\s*(kg|g)\b/i;

export const productVariantsUpsertSql = `
  insert into product_variants (product_id, base_product, weight_g, price_per_100g, updated_at)
  values ($1, $2, $3, $4, now())
  on conflict (product_id) do update set
    base_product = excluded.base_product,
    weight_g = excluded.weight_g,
    price_per_100g = excluded.price_per_100g,
    updated_at = now()
`;

export function normaliseWeightVariant(input: WeightVariantInput): WeightVariantNormalisation | null {
  const match = input.name.match(weightPattern);
  if (!match) return null;

  const numericWeight = Number(match[1].replace(',', '.'));
  if (!Number.isFinite(numericWeight) || numericWeight <= 0) return null;

  const unit = match[2].toLowerCase();
  const weight_g = unit === 'kg' ? numericWeight * 1000 : numericWeight;
  const base_product = input.name
    .replace(weightPattern, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/[-–—,]\s*$/, '')
    .trim();

  return {
    productId: input.productId,
    base_product,
    weight_g,
    price_per_100g: Number(((input.price / weight_g) * 100).toFixed(2))
  };
}

export async function runWeightVariantPostIngestStep(
  products: WeightVariantInput[],
  query: (sql: string, params: unknown[]) => Promise<unknown>
) {
  const variants = products
    .map((product) => normaliseWeightVariant(product))
    .filter((variant): variant is WeightVariantNormalisation => variant !== null);

  for (const variant of variants) {
    await query(productVariantsUpsertSql, [variant.productId, variant.base_product, variant.weight_g, variant.price_per_100g]);
  }

  return { processed: products.length, stored: variants.length };
}
