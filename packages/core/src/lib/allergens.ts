export const supportedAllergenFilters = ['gluten', 'lactose', 'peanut', 'soy', 'sesame', 'egg', 'fish', 'shellfish', 'milk', 'sulfites'] as const;
export type AllergenFilter = (typeof supportedAllergenFilters)[number];

const allergenAliases: Record<AllergenFilter, RegExp[]> = {
  gluten: [/gluten/i, /wheat/i, /barley/i, /rye/i, /havre/i],
  lactose: [/lactose/i, /laktos/i],
  peanut: [/peanut/i, /jordn[oö]t/i],
  soy: [/soy/i, /soja/i],
  sesame: [/sesame/i, /sesam/i],
  egg: [/egg/i, /[äa]gg/i],
  fish: [/fish/i, /fisk/i],
  shellfish: [/shellfish/i, /crustacean/i, /mollusc/i, /skaldjur/i],
  milk: [/milk/i, /mj[oö]lk/i, /dairy/i],
  sulfites: [/sulfi/i, /sulfit/i, /svaveldioxid/i]
};

export type AllergenTaggedProduct = {
  allergens?: readonly string[] | string | null;
  allergenTags?: readonly string[] | string | null;
  labels?: readonly string[] | string | null;
};

export function normalizeAllergenFilters(values: readonly string[]): AllergenFilter[] {
  return [...new Set(values.filter((value): value is AllergenFilter => supportedAllergenFilters.includes(value as AllergenFilter)))];
}

export function allergensForOpenFoodFactsTags(tags: readonly string[] | string | null | undefined): AllergenFilter[] {
  const values = Array.isArray(tags) ? tags : tags ? tags.split(',') : [];
  return supportedAllergenFilters.filter((filter) => values.some((value) => allergenAliases[filter].some((pattern) => pattern.test(value))));
}

export function productMatchesAllergenExclusions(product: AllergenTaggedProduct, excluded: readonly AllergenFilter[]): boolean {
  if (excluded.length === 0) return true;
  const tags = [product.allergens, product.allergenTags, product.labels]
    .flatMap((value) => Array.isArray(value) ? value : value ? value.split(',') : []);
  const productAllergens = allergensForOpenFoodFactsTags(tags);
  return excluded.every((filter) => !productAllergens.includes(filter));
}
