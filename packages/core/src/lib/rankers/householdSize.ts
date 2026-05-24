export type HouseholdSizeRankerInput = {
  householdSize: number;
  promotionText?: string;
  packageSize?: string;
  quantityThreshold?: number;
  baseScore?: number;
};

export type HouseholdSizeRankerResult = {
  score: number;
  adjustment: number;
  reason: 'family_suited' | 'single_household_penalty' | 'neutral';
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const MULTI_BUY_PATTERN = /(?:\b\d+\s*(?:for|för|x|st)\b|\b(?:multi[- ]?buy|storpack|family pack|familjepack|bulk|quantity tier|quantity discount)\b)/i;

export function rankHouseholdSizePromotion(input: HouseholdSizeRankerInput): HouseholdSizeRankerResult {
  const householdSize = Math.max(1, Math.floor(input.householdSize));
  const baseScore = clamp(input.baseScore ?? 0, 0, 100);
  const quantityThreshold = Math.max(1, Math.floor(input.quantityThreshold ?? 1));
  const promotionText = `${input.promotionText ?? ''} ${input.packageSize ?? ''}`;
  const isQuantityTier = quantityThreshold >= 2 || MULTI_BUY_PATTERN.test(promotionText);

  if (!isQuantityTier) {
    return { score: baseScore, adjustment: 0, reason: 'neutral' };
  }

  if (householdSize >= 3) {
    const adjustment = quantityThreshold >= 3 ? 12 : 8;
    return { score: clamp(baseScore + adjustment, 0, 100), adjustment, reason: 'family_suited' };
  }

  if (householdSize === 1) {
    const adjustment = quantityThreshold >= 3 ? -14 : -10;
    return { score: clamp(baseScore + adjustment, 0, 100), adjustment, reason: 'single_household_penalty' };
  }

  return { score: baseScore, adjustment: 0, reason: 'neutral' };
}
