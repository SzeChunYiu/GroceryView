export type PremiumBrandMarker = {
  canonical_id?: string;
  canonicalId?: string;
  premium?: boolean;
  is_premium?: boolean;
  isPremium?: boolean;
  markedPremium?: boolean;
  premiumBrand?: boolean;
  brandTier?: string;
  tier?: string;
};

export type PremiumBrandSavingsCandidate = {
  productId: string;
  productName?: string;
  brandCanonicalId?: string;
  brand_canonical_id?: string;
  brand?: {
    canonical_id?: string;
    canonicalId?: string;
  };
  currentPrice?: number;
  regularPrice?: number;
  savings?: number;
  savingsAmount?: number;
};

export type PremiumBrandSavingsRank = PremiumBrandSavingsCandidate & {
  brandCanonicalId: string;
  savings: number;
  savingsPercent: number;
  rank: number;
};

export type RankPremiumBrandSavingsInput = {
  candidates: PremiumBrandSavingsCandidate[];
  premiumBrandCanonicalIds?: Iterable<string>;
  brands?: PremiumBrandMarker[];
  minimumSavings?: number;
};

const roundMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

const isMarkedPremium = (brand: PremiumBrandMarker): boolean =>
  brand.premium === true ||
  brand.is_premium === true ||
  brand.isPremium === true ||
  brand.markedPremium === true ||
  brand.premiumBrand === true ||
  brand.brandTier === 'premium' ||
  brand.tier === 'premium';

export function buildPremiumBrandCanonicalIdSet(input: {
  premiumBrandCanonicalIds?: Iterable<string>;
  brands?: PremiumBrandMarker[];
}): Set<string> {
  const premiumBrandIds = new Set<string>();

  for (const canonicalId of input.premiumBrandCanonicalIds ?? []) {
    const normalized = canonicalId.trim();
    if (normalized) premiumBrandIds.add(normalized);
  }

  for (const brand of input.brands ?? []) {
    const normalized = (brand.canonical_id ?? brand.canonicalId ?? '').trim();
    if (normalized && isMarkedPremium(brand)) premiumBrandIds.add(normalized);
  }

  return premiumBrandIds;
}

function candidateBrandCanonicalId(candidate: PremiumBrandSavingsCandidate): string | undefined {
  return candidate.brandCanonicalId ?? candidate.brand_canonical_id ?? candidate.brand?.canonicalId ?? candidate.brand?.canonical_id;
}

function candidateSavings(candidate: PremiumBrandSavingsCandidate): number | undefined {
  if (candidate.savings !== undefined) return candidate.savings;
  if (candidate.savingsAmount !== undefined) return candidate.savingsAmount;
  if (candidate.currentPrice !== undefined && candidate.regularPrice !== undefined) {
    return roundMoney(candidate.regularPrice - candidate.currentPrice);
  }
  return undefined;
}

export function rankPremiumBrandSavings(input: RankPremiumBrandSavingsInput): PremiumBrandSavingsRank[] {
  const premiumBrandIds = buildPremiumBrandCanonicalIdSet(input);
  const minimumSavings = input.minimumSavings ?? 0;

  return input.candidates
    .map((candidate) => {
      const brandCanonicalId = candidateBrandCanonicalId(candidate)?.trim();
      const savings = candidateSavings(candidate);
      if (!brandCanonicalId || !premiumBrandIds.has(brandCanonicalId)) return undefined;
      if (savings === undefined || !Number.isFinite(savings) || savings < minimumSavings) return undefined;
      const savingsPercent = candidate.regularPrice && candidate.regularPrice > 0
        ? roundMoney((savings / candidate.regularPrice) * 100)
        : 0;

      return {
        ...candidate,
        brandCanonicalId,
        savings: roundMoney(savings),
        savingsPercent,
        rank: 0
      } satisfies PremiumBrandSavingsRank;
    })
    .filter((candidate): candidate is PremiumBrandSavingsRank => candidate !== undefined)
    .sort((left, right) => {
      if (right.savings !== left.savings) return right.savings - left.savings;
      if (right.savingsPercent !== left.savingsPercent) return right.savingsPercent - left.savingsPercent;
      return (left.productName ?? left.productId).localeCompare(right.productName ?? right.productId);
    })
    .map((candidate, index) => ({ ...candidate, rank: index + 1 }));
}

export const rankPremiumBrandDeals = rankPremiumBrandSavings;
export const filterPremiumBrandDeals = rankPremiumBrandSavings;
