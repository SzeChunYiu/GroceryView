export type HouseholdSizePromo = {
  promoId: string;
  title?: string;
  quantityTier?: number;
  packageSizeLabel?: string;
  baseScore?: number;
};

export type HouseholdSizeRankedPromo<TPromo extends HouseholdSizePromo> = TPromo & {
  householdSizeScore: number;
  householdSizeReason: 'family_pack_boost' | 'single_household_demotion' | 'neutral';
};

function isFamilySized(promo: HouseholdSizePromo): boolean {
  const label = `${promo.title ?? ''} ${promo.packageSizeLabel ?? ''}`.toLowerCase();
  return (promo.quantityTier ?? 1) >= 3 || /multi-buy|multibuy|family|storpack|flerpack|\d+\s*(for|för)/i.test(label);
}

export function rankPromosByHouseholdSize<TPromo extends HouseholdSizePromo>(promos: readonly TPromo[], householdSize: number): HouseholdSizeRankedPromo<TPromo>[] {
  const size = Number.isFinite(householdSize) ? Math.max(1, Math.round(householdSize)) : 1;
  return promos
    .map((promo) => {
      const familySized = isFamilySized(promo);
      const adjustment = familySized && size >= 3 ? 15 : familySized && size === 1 ? -15 : 0;
      const householdSizeReason = adjustment > 0 ? 'family_pack_boost' : adjustment < 0 ? 'single_household_demotion' : 'neutral';
      return { ...promo, householdSizeScore: (promo.baseScore ?? 0) + adjustment, householdSizeReason };
    })
    .sort((left, right) => right.householdSizeScore - left.householdSizeScore || left.promoId.localeCompare(right.promoId));
}
