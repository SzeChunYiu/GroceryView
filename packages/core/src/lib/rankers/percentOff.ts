export type PercentOffRankerPromo = {
  promoId: string;
  productId: string;
  productName: string;
  listPrice: number;
  effectiveUnitPrice: number;
};

export type RankedPercentOffPromo<TPromo extends PercentOffRankerPromo> = TPromo & {
  rank: number;
  percentOff: number;
};

export type RankPercentOffPromosInput<TPromo extends PercentOffRankerPromo> = {
  promos: readonly TPromo[];
  topN?: number;
};

type ScoredPercentOffPromo<TPromo extends PercentOffRankerPromo> = {
  promo: TPromo;
  discountRate: number;
  percentOff: number;
};

const roundPercent = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

function assertNonBlank(value: string, fieldName: string): void {
  if (!value.trim()) throw new Error(`${fieldName} is required.`);
}

function validatePromo(promo: PercentOffRankerPromo): void {
  assertNonBlank(promo.promoId, 'promoId');
  assertNonBlank(promo.productId, 'productId');
  assertNonBlank(promo.productName, 'productName');
  if (!Number.isFinite(promo.listPrice) || promo.listPrice <= 0) throw new Error('listPrice must be a positive finite number.');
  if (!Number.isFinite(promo.effectiveUnitPrice) || promo.effectiveUnitPrice < 0) {
    throw new Error('effectiveUnitPrice must be a non-negative finite number.');
  }
}

function scoredPromoFor<TPromo extends PercentOffRankerPromo>(promo: TPromo): ScoredPercentOffPromo<TPromo> {
  const discountRate = (promo.listPrice - promo.effectiveUnitPrice) / promo.listPrice;

  return {
    promo,
    discountRate,
    percentOff: roundPercent(discountRate * 100)
  };
}

export function rankPercentOffPromos<TPromo extends PercentOffRankerPromo>(
  input: RankPercentOffPromosInput<TPromo>
): RankedPercentOffPromo<TPromo>[] {
  const topN = input.topN ?? 10;
  if (!Number.isInteger(topN) || topN <= 0) throw new Error('topN must be a positive integer.');

  return input.promos
    .map((promo) => {
      validatePromo(promo);
      return scoredPromoFor(promo);
    })
    .filter((promo) => promo.discountRate > 0)
    .sort((left, right) => {
      if (right.discountRate !== left.discountRate) return right.discountRate - left.discountRate;
      if (left.promo.effectiveUnitPrice !== right.promo.effectiveUnitPrice) return left.promo.effectiveUnitPrice - right.promo.effectiveUnitPrice;
      if (left.promo.productName !== right.promo.productName) return left.promo.productName.localeCompare(right.promo.productName);
      return left.promo.promoId.localeCompare(right.promo.promoId);
    })
    .slice(0, topN)
    .map((scored, index) => ({ ...scored.promo, rank: index + 1, percentOff: scored.percentOff }));
}

export const rankPercentOffPromotions = rankPercentOffPromos;
export default rankPercentOffPromos;
