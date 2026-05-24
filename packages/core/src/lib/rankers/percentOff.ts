export type PercentOffPromotionInput = {
  offerId?: string;
  id?: string;
  productId: string;
  productName?: string;
  listPrice: number;
  effectiveUnitPrice?: number;
  effectivePrice?: number;
  eligibleQuantity?: number;
  active?: boolean;
  validFrom?: string;
  validThrough?: string;
  validUntil?: string;
};

export type PercentOffRankedPromotion<T extends PercentOffPromotionInput = PercentOffPromotionInput> = T & {
  rank: number;
  percentOff: number;
  savingsPerUnit: number;
  savingsForEligibleQuantity: number;
  explanation: string;
};

export type RankPercentOffOptions = {
  limit?: number;
  now?: string | Date;
};

function effectivePriceFor(promotion: PercentOffPromotionInput): number {
  return promotion.effectiveUnitPrice ?? promotion.effectivePrice ?? Number.NaN;
}

function isFiniteMoney(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function isWithinActiveWindow(promotion: PercentOffPromotionInput, now?: Date): boolean {
  if (promotion.active === false) return false;
  if (!now) return true;
  if (promotion.validFrom && Date.parse(promotion.validFrom) > now.getTime()) return false;
  const validThrough = promotion.validThrough ?? promotion.validUntil;
  if (validThrough && Date.parse(validThrough) < now.getTime()) return false;
  return true;
}

function formatPercent(value: number): string {
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

function normalizeLimit(limit: number | undefined): number {
  if (limit === undefined) return Number.POSITIVE_INFINITY;
  if (!Number.isInteger(limit) || limit < 0) throw new Error('limit must be a non-negative integer.');
  return limit;
}

function normalizeNow(now: string | Date | undefined): Date | undefined {
  if (now === undefined) return undefined;
  const parsed = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(parsed.getTime())) throw new Error('now must be a valid date.');
  return parsed;
}

/**
 * Ranks active flyer promotions by percentage discount: (list - effective) / list.
 * Invalid, inactive, future, expired, zero-list-price, and non-discount rows are omitted.
 */
export function rankPercentOffPromotions<T extends PercentOffPromotionInput>(
  promotions: readonly T[],
  options: RankPercentOffOptions = {}
): PercentOffRankedPromotion<T>[] {
  const limit = normalizeLimit(options.limit);
  const now = normalizeNow(options.now);

  return promotions
    .filter((promotion) => isWithinActiveWindow(promotion, now))
    .map((promotion, inputIndex) => {
      const effectivePrice = effectivePriceFor(promotion);
      const savingsPerUnit = promotion.listPrice - effectivePrice;
      const percentOff = promotion.listPrice > 0 ? (savingsPerUnit / promotion.listPrice) * 100 : 0;
      return { promotion, inputIndex, effectivePrice, savingsPerUnit, percentOff };
    })
    .filter(({ promotion, effectivePrice, savingsPerUnit }) =>
      isFiniteMoney(promotion.listPrice) &&
      promotion.listPrice > 0 &&
      isFiniteMoney(effectivePrice) &&
      savingsPerUnit > 0
    )
    .sort((left, right) =>
      right.percentOff - left.percentOff ||
      right.savingsPerUnit - left.savingsPerUnit ||
      left.inputIndex - right.inputIndex
    )
    .slice(0, limit)
    .map(({ promotion, savingsPerUnit, percentOff }, index) => {
      const eligibleQuantity = promotion.eligibleQuantity ?? 1;
      const roundedPercentOff = Math.round((percentOff + Number.EPSILON) * 10) / 10;
      const roundedSavingsPerUnit = Math.round((savingsPerUnit + Number.EPSILON) * 100) / 100;
      const savingsForEligibleQuantity = Math.round(((roundedSavingsPerUnit * eligibleQuantity) + Number.EPSILON) * 100) / 100;
      return {
        ...promotion,
        rank: index + 1,
        percentOff: roundedPercentOff,
        savingsPerUnit: roundedSavingsPerUnit,
        savingsForEligibleQuantity,
        explanation: `${formatPercent(roundedPercentOff)} off versus list price (${roundedSavingsPerUnit.toFixed(2)} saved per unit).`
      };
    });
}
