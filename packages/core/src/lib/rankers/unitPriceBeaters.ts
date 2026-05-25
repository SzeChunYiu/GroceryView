export type UnitPriceBeaterPromoInput = {
  promoId: string;
  canonicalProductId: string;
  productName: string;
  effectiveKrPerKg: number;
  storeId?: string;
  storeName?: string;
  currency?: string;
  startsAt?: string | null;
  endsAt?: string | null;
  active?: boolean;
  sourceConfidence?: number;
};

export type UnitPriceHistoryPoint = {
  canonicalProductId: string;
  observedAt: string;
  krPerKg: number;
  sourceConfidence?: number;
};

export type RankedUnitPriceBeaterPromo = UnitPriceBeaterPromoInput & {
  rank: number;
  medianKrPerKg: number;
  beatKrPerKg: number;
  beatPercent: number;
  historyObservationCount: number;
  explanation: string;
};

export type RankUnitPriceBeatersInput = {
  promos: UnitPriceBeaterPromoInput[];
  priceHistory: UnitPriceHistoryPoint[];
  asOf?: string | Date;
  topN?: number;
  medianWindowDays?: number;
  minimumBeatPercent?: number;
  minimumSourceConfidence?: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

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

function requireNonBlank(value: string, fieldName: string): void {
  if (!value.trim()) throw new Error(`${fieldName} is required.`);
}

function validateConfidence(value: number | undefined, fieldName: string): void {
  if (value !== undefined && (!Number.isFinite(value) || value < 0 || value > 1)) {
    throw new Error(`${fieldName} must be between 0 and 1 when provided.`);
  }
}

function validatePromo(promo: UnitPriceBeaterPromoInput): void {
  requireNonBlank(promo.promoId, 'promoId');
  requireNonBlank(promo.canonicalProductId, 'canonicalProductId');
  requireNonBlank(promo.productName, 'productName');
  if (!Number.isFinite(promo.effectiveKrPerKg) || promo.effectiveKrPerKg <= 0) {
    throw new Error('effectiveKrPerKg must be a positive finite number.');
  }
  validateConfidence(promo.sourceConfidence, 'sourceConfidence');
}

function validateHistoryPoint(point: UnitPriceHistoryPoint): void {
  requireNonBlank(point.canonicalProductId, 'history canonicalProductId');
  if (!Number.isFinite(point.krPerKg) || point.krPerKg <= 0) {
    throw new Error('history krPerKg must be a positive finite number.');
  }
  validateConfidence(point.sourceConfidence, 'history sourceConfidence');
  const observedAt = Date.parse(point.observedAt);
  if (!Number.isFinite(observedAt)) throw new Error('history observedAt must be a valid date.');
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle];
  return (sorted[middle - 1] + sorted[middle]) / 2;
}

function isActivePromo(promo: UnitPriceBeaterPromoInput, asOfTime: number): boolean {
  if (promo.active === false) return false;
  const startsAt = optionalTimeFor(promo.startsAt, 'startsAt');
  const endsAt = optionalTimeFor(promo.endsAt, 'endsAt');
  if (startsAt !== null && asOfTime < startsAt) return false;
  if (endsAt !== null && asOfTime > endsAt) return false;
  return true;
}

function rankedPromoFor(
  promo: UnitPriceBeaterPromoInput,
  medianKrPerKg: number,
  historyObservationCount: number
): RankedUnitPriceBeaterPromo {
  const beatKrPerKg = roundMoney(medianKrPerKg - promo.effectiveKrPerKg);
  const beatPercent = roundPercent((beatKrPerKg / medianKrPerKg) * 100);
  const currency = promo.currency ?? 'SEK';
  const storeSuffix = promo.storeName ? ` at ${promo.storeName}` : '';

  return {
    ...promo,
    rank: 0,
    medianKrPerKg: roundMoney(medianKrPerKg),
    beatKrPerKg,
    beatPercent,
    historyObservationCount,
    explanation: `${promo.productName}${storeSuffix} beats its 30-day median by ${beatPercent.toFixed(2)}% (${beatKrPerKg.toFixed(2)} ${currency}/kg).`
  };
}

export function rankUnitPriceBeaters(input: RankUnitPriceBeatersInput): RankedUnitPriceBeaterPromo[] {
  const topN = input.topN ?? 10;
  if (!Number.isInteger(topN) || topN <= 0) throw new Error('topN must be a positive integer.');
  const medianWindowDays = input.medianWindowDays ?? 30;
  if (!Number.isFinite(medianWindowDays) || medianWindowDays <= 0) {
    throw new Error('medianWindowDays must be a positive finite number.');
  }
  const minimumBeatPercent = input.minimumBeatPercent ?? 0;
  if (!Number.isFinite(minimumBeatPercent) || minimumBeatPercent < 0) {
    throw new Error('minimumBeatPercent must be a non-negative finite number.');
  }
  const minimumSourceConfidence = input.minimumSourceConfidence ?? 0;
  if (!Number.isFinite(minimumSourceConfidence) || minimumSourceConfidence < 0 || minimumSourceConfidence > 1) {
    throw new Error('minimumSourceConfidence must be between 0 and 1.');
  }

  const asOfTime = timeFor(input.asOf);
  const windowStart = asOfTime - medianWindowDays * DAY_MS;
  const historyByCanonicalProduct = new Map<string, number[]>();

  for (const point of input.priceHistory) {
    validateHistoryPoint(point);
    if ((point.sourceConfidence ?? 1) < minimumSourceConfidence) continue;
    const observedAt = Date.parse(point.observedAt);
    if (observedAt > asOfTime || observedAt < windowStart) continue;
    const prices = historyByCanonicalProduct.get(point.canonicalProductId) ?? [];
    prices.push(point.krPerKg);
    historyByCanonicalProduct.set(point.canonicalProductId, prices);
  }

  const medianByCanonicalProduct = new Map<string, { medianKrPerKg: number; observationCount: number }>();
  for (const [canonicalProductId, prices] of historyByCanonicalProduct.entries()) {
    medianByCanonicalProduct.set(canonicalProductId, {
      medianKrPerKg: median(prices),
      observationCount: prices.length
    });
  }

  return input.promos
    .map((promo) => {
      validatePromo(promo);
      return promo;
    })
    .filter((promo) => isActivePromo(promo, asOfTime))
    .filter((promo) => (promo.sourceConfidence ?? 1) >= minimumSourceConfidence)
    .flatMap((promo): RankedUnitPriceBeaterPromo[] => {
      const history = medianByCanonicalProduct.get(promo.canonicalProductId);
      if (!history) return [];
      if (promo.effectiveKrPerKg >= history.medianKrPerKg) return [];

      const rankedPromo = rankedPromoFor(promo, history.medianKrPerKg, history.observationCount);
      if (rankedPromo.beatPercent < minimumBeatPercent) return [];
      return [rankedPromo];
    })
    .sort((left, right) => {
      if (right.beatPercent !== left.beatPercent) return right.beatPercent - left.beatPercent;
      if (right.beatKrPerKg !== left.beatKrPerKg) return right.beatKrPerKg - left.beatKrPerKg;
      if (left.effectiveKrPerKg !== right.effectiveKrPerKg) return left.effectiveKrPerKg - right.effectiveKrPerKg;
      return left.productName.localeCompare(right.productName);
    })
    .slice(0, topN)
    .map((promo, index) => ({ ...promo, rank: index + 1 }));
}

export const rankUnitPriceBeaterPromos = rankUnitPriceBeaters;
export default rankUnitPriceBeaters;
