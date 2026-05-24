export type BrandPreferences = {
  userId: string;
  preferredBrands: string[];
  excludedManufacturers: string[];
};

export const signedInUserBrandPreferences: BrandPreferences = {
  userId: 'signed-in-user',
  preferredBrands: ['Garant', 'ICA'],
  excludedManufacturers: ['Eldorado']
};

function normalizeBrandName(value: string | undefined) {
  return value?.trim().toLocaleLowerCase('sv-SE') ?? '';
}

function brandIndex(brand: string | undefined, brands: string[]) {
  const normalizedBrand = normalizeBrandName(brand);
  return brands.findIndex((candidate) => normalizeBrandName(candidate) === normalizedBrand);
}

export function isPreferredBrand(brand: string | undefined, preferences = signedInUserBrandPreferences) {
  return brandIndex(brand, preferences.preferredBrands) >= 0;
}

export function isExcludedManufacturer(brand: string | undefined, preferences = signedInUserBrandPreferences) {
  return brandIndex(brand, preferences.excludedManufacturers) >= 0;
}

export function personalizeProductResults<T extends { brand?: string }>(products: T[], preferences = signedInUserBrandPreferences) {
  return [...products]
    .filter((product) => !isExcludedManufacturer(product.brand, preferences))
    .sort((left, right) => {
      const leftIndex = brandIndex(left.brand, preferences.preferredBrands);
      const rightIndex = brandIndex(right.brand, preferences.preferredBrands);
      const leftRank = leftIndex >= 0 ? leftIndex : Number.POSITIVE_INFINITY;
      const rightRank = rightIndex >= 0 ? rightIndex : Number.POSITIVE_INFINITY;
      if (leftRank === rightRank) return 0;
      return leftRank - rightRank;
    });
}

export function brandPersonalizationSummary(totalCount: number, visibleCount: number, preferences = signedInUserBrandPreferences) {
  const hiddenCount = Math.max(0, totalCount - visibleCount);
  return {
    hiddenCount,
    preferredLabel: preferences.preferredBrands.join(', '),
    excludedLabel: preferences.excludedManufacturers.join(', ')
  };
}
