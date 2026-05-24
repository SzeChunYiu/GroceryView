export type AbsoluteSavingsPromoInput = {
  promoId: string;
  productId: string;
  productName: string;
  storeId?: string;
  storeName?: string;
  listPrice: number;
  effectiveUnitPrice: number;
  eligibleQuantity: number;
  currency?: string;
  startsAt?: string | null;
  endsAt?: string | null;
  sourceConfidence?: number;
  active?: boolean;
};

export type AbsoluteSavingsRankedPromo = AbsoluteSavingsPromoInput & {
  rank: number;
  unitSavings: number;
  totalSavings: number;
  savingsPercent: number;
  explanation: string;
};

export type RankAbsoluteSavingsInput = {
  promos: AbsoluteSavingsPromoInput[];
  topN?: number;
  asOf?: string | Date;
  minimumSourceConfidence?: number;
};

const roundMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;
const roundPercent = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

function timeFor(value: string | Date | undefined): number {
  if (value === undefined) return Date.now();
  const time = value instanceof Date ? value.getTime() : Date.parse(value);
  if (!Number.isFinite(time)) throw new Error('asOf must be a valid date.');
  return time;
}

function optionalTimeFor(value: string | null | undefined, fieldName: string): number | null {
  if (value === null || value === undefined) return null;
  const time = Date.parse(value);
  if (!Number.isFinite(time)) throw new Error(`${fieldName} must be a valid date when provided.`);
  return time;
}

function isActivePromo(promo: AbsoluteSavingsPromoInput, asOfTime: number): boolean {
  if (promo.active === false) return false;
  const startsAt = optionalTimeFor(promo.startsAt, 'startsAt');
  const endsAt = optionalTimeFor(promo.endsAt, 'endsAt');
  if (startsAt !== null && asOfTime < startsAt) return false;
  if (endsAt !== null && asOfTime > endsAt) return false;
  return true;
}

function validatePromo(promo: AbsoluteSavingsPromoInput): void {
  if (!promo.promoId.trim()) throw new Error('promoId is required.');
  if (!promo.productId.trim()) throw new Error('productId is required.');
  if (!promo.productName.trim()) throw new Error('productName is required.');
  if (!Number.isFinite(promo.listPrice) || promo.listPrice < 0) throw new Error('listPrice must be a non-negative finite number.');
  if (!Number.isFinite(promo.effectiveUnitPrice) || promo.effectiveUnitPrice < 0) throw new Error('effectiveUnitPrice must be a non-negative finite number.');
  if (!Number.isFinite(promo.eligibleQuantity) || promo.eligibleQuantity <= 0) throw new Error('eligibleQuantity must be a positive finite number.');
  if (promo.sourceConfidence !== undefined && (!Number.isFinite(promo.sourceConfidence) || promo.sourceConfidence < 0 || promo.sourceConfidence > 1)) {
    throw new Error('sourceConfidence must be between 0 and 1 when provided.');
  }
}

function rankedPromoFor(promo: AbsoluteSavingsPromoInput, rank: number): AbsoluteSavingsRankedPromo {
  const unitSavings = roundMoney(Math.max(0, promo.listPrice - promo.effectiveUnitPrice));
  const totalSavings = roundMoney(unitSavings * promo.eligibleQuantity);
  const savingsPercent = promo.listPrice > 0 ? roundPercent((unitSavings / promo.listPrice) * 100) : 0;
  const currency = promo.currency ?? 'SEK';
  const storeSuffix = promo.storeName ? ` at ${promo.storeName}` : '';
  const quantityLabel = promo.eligibleQuantity === 1 ? '1 eligible unit' : `${promo.eligibleQuantity} eligible units`;

  return {
    ...promo,
    rank,
    unitSavings,
    totalSavings,
    savingsPercent,
    explanation: `${promo.productName}${storeSuffix} saves ${totalSavings.toFixed(2)} ${currency} across ${quantityLabel} (${unitSavings.toFixed(2)} ${currency} per unit, ${savingsPercent.toFixed(2)}% off list price).`
  };
}

export function rankAbsoluteSavingsPromos(input: RankAbsoluteSavingsInput): AbsoluteSavingsRankedPromo[] {
  const topN = input.topN ?? 10;
  if (!Number.isInteger(topN) || topN <= 0) throw new Error('topN must be a positive integer.');
  const minimumSourceConfidence = input.minimumSourceConfidence ?? 0;
  if (!Number.isFinite(minimumSourceConfidence) || minimumSourceConfidence < 0 || minimumSourceConfidence > 1) {
    throw new Error('minimumSourceConfidence must be between 0 and 1.');
  }

  const asOfTime = timeFor(input.asOf);
  return input.promos
    .map((promo) => {
      validatePromo(promo);
      return promo;
    })
    .filter((promo) => isActivePromo(promo, asOfTime))
    .filter((promo) => (promo.sourceConfidence ?? 1) >= minimumSourceConfidence)
    .map((promo) => rankedPromoFor(promo, 0))
    .filter((promo) => promo.totalSavings > 0)
    .sort((left, right) => {
      if (right.totalSavings !== left.totalSavings) return right.totalSavings - left.totalSavings;
      if (right.unitSavings !== left.unitSavings) return right.unitSavings - left.unitSavings;
      return left.productName.localeCompare(right.productName);
    })
    .slice(0, topN)
    .map((promo, index) => ({ ...promo, rank: index + 1 }));
}
