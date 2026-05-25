export type PremiumBrandRankerBrand = {
  canonical_id: string;
  premium?: boolean;
};

export type PremiumBrandRankerPromo = {
  promoId: string;
  productId: string;
  productName: string;
  brand_canonical_id: string;
  savings: number;
};

export type RankedPremiumBrandPromo<TPromo extends PremiumBrandRankerPromo> = TPromo & {
  rank: number;
};

export type RankPremiumBrandPromosInput<TPromo extends PremiumBrandRankerPromo> = {
  promos: readonly TPromo[];
  brands: readonly PremiumBrandRankerBrand[];
  topN?: number;
};

function assertNonBlank(value: string, fieldName: string): void {
  if (!value.trim()) throw new Error(`${fieldName} is required.`);
}

function premiumBrandCanonicalIds(brands: readonly PremiumBrandRankerBrand[]): Set<string> {
  const ids = new Set<string>();
  for (const brand of brands) {
    assertNonBlank(brand.canonical_id, 'brand.canonical_id');
    if (brand.premium === true) ids.add(brand.canonical_id);
  }

  return ids;
}

function validatePromo(promo: PremiumBrandRankerPromo): void {
  assertNonBlank(promo.promoId, 'promoId');
  assertNonBlank(promo.productId, 'productId');
  assertNonBlank(promo.productName, 'productName');
  assertNonBlank(promo.brand_canonical_id, 'brand_canonical_id');
  if (!Number.isFinite(promo.savings)) throw new Error('savings must be a finite number.');
}

export function rankPremiumBrandPromos<TPromo extends PremiumBrandRankerPromo>(
  input: RankPremiumBrandPromosInput<TPromo>
): RankedPremiumBrandPromo<TPromo>[] {
  const topN = input.topN ?? 10;
  if (!Number.isInteger(topN) || topN <= 0) throw new Error('topN must be a positive integer.');

  const premiumIds = premiumBrandCanonicalIds(input.brands);

  return input.promos
    .map((promo) => {
      validatePromo(promo);
      return promo;
    })
    .filter((promo) => premiumIds.has(promo.brand_canonical_id))
    .sort((left, right) => {
      if (right.savings !== left.savings) return right.savings - left.savings;
      if (left.productName !== right.productName) return left.productName.localeCompare(right.productName);
      return left.promoId.localeCompare(right.promoId);
    })
    .slice(0, topN)
    .map((promo, index) => ({ ...promo, rank: index + 1 }));
}

export const rankPremiumBrandPromotions = rankPremiumBrandPromos;
export default rankPremiumBrandPromos;
