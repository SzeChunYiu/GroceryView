export type PromotionTerms = Record<string, unknown> | string | null | undefined;

export type MultiBuyPromotion = {
  quantity: number;
  totalPrice: number;
};

export type PromotionStackInput = {
  memberUnitPrice?: number | null;
  multiBuy?: MultiBuyPromotion | null;
  regularUnitPrice: number;
  terms?: PromotionTerms;
};

export type PromotionStackCandidate = {
  effectiveUnitPrice: number;
  kind: 'regular' | 'member' | 'multi_buy' | 'member_multi_buy_stack';
  legal: boolean;
  reason: string;
};

export type PromotionStackResult = {
  best: PromotionStackCandidate;
  candidates: PromotionStackCandidate[];
  nonStackable: boolean;
};

export function computeBestPromotionStack(input: PromotionStackInput): PromotionStackResult {
  assertNonNegative(input.regularUnitPrice, 'regularUnitPrice');
  const nonStackable = hasNonStackableTerms(input.terms);
  const candidates: PromotionStackCandidate[] = [{
    effectiveUnitPrice: roundMoney(input.regularUnitPrice),
    kind: 'regular',
    legal: true,
    reason: 'Regular unit price baseline.'
  }];

  if (input.memberUnitPrice !== null && input.memberUnitPrice !== undefined) {
    assertNonNegative(input.memberUnitPrice, 'memberUnitPrice');
    candidates.push({
      effectiveUnitPrice: roundMoney(input.memberUnitPrice),
      kind: 'member',
      legal: true,
      reason: 'Member unit price applies on its own.'
    });
  }

  const multiBuyUnitPrice = input.multiBuy ? effectiveMultiBuyUnitPrice(input.multiBuy) : null;
  if (multiBuyUnitPrice !== null) {
    candidates.push({
      effectiveUnitPrice: multiBuyUnitPrice,
      kind: 'multi_buy',
      legal: true,
      reason: `Multi-buy ${input.multiBuy!.quantity} for ${roundMoney(input.multiBuy!.totalPrice)}.`
    });
  }

  if (input.memberUnitPrice !== null && input.memberUnitPrice !== undefined && input.multiBuy && multiBuyUnitPrice !== null) {
    const stackedUnitPrice = roundMoney(Math.min(input.memberUnitPrice, input.regularUnitPrice) * input.multiBuy.quantity > input.multiBuy.totalPrice
      ? input.multiBuy.totalPrice / input.multiBuy.quantity
      : input.memberUnitPrice);
    candidates.push({
      effectiveUnitPrice: stackedUnitPrice,
      kind: 'member_multi_buy_stack',
      legal: !nonStackable,
      reason: nonStackable
        ? 'Promotion terms mark member and multi-buy offers as non-stackable.'
        : 'Member price and multi-buy can be legally stacked; best effective unit price selected.'
    });
  }

  const legalCandidates = candidates.filter((candidate) => candidate.legal);
  const best = legalCandidates.reduce((lowest, candidate) => (
    candidate.effectiveUnitPrice < lowest.effectiveUnitPrice ? candidate : lowest
  ));

  return { best, candidates, nonStackable };
}

export function bestEffectiveUnitPrice(input: PromotionStackInput): number {
  return computeBestPromotionStack(input).best.effectiveUnitPrice;
}

export function hasNonStackableTerms(terms: PromotionTerms): boolean {
  if (!terms) return false;
  if (typeof terms === 'string') return nonStackableText(terms);

  const flags = [terms.stackable, terms.isStackable, terms.canStack, terms.combinable];
  if (flags.some((flag) => flag === false)) return true;
  if ([terms.nonStackable, terms.notStackable, terms.memberExcluded].some((flag) => flag === true)) return true;

  const excludes = terms.excludes ?? terms.exclude ?? terms.cannotCombineWith;
  if (Array.isArray(excludes) && excludes.some((value) => /member|multi|multibuy|loyalty|medlem/i.test(String(value)))) return true;

  return nonStackableText(JSON.stringify(terms));
}

function effectiveMultiBuyUnitPrice(multiBuy: MultiBuyPromotion): number {
  if (!Number.isInteger(multiBuy.quantity) || multiBuy.quantity <= 0) throw new Error('multiBuy.quantity must be a positive integer.');
  assertNonNegative(multiBuy.totalPrice, 'multiBuy.totalPrice');
  return roundMoney(multiBuy.totalPrice / multiBuy.quantity);
}

function nonStackableText(value: string): boolean {
  return /cannot be combined|not combinable|non[-\s]?stackable|kan inte kombineras|kan ikke kombineres|gjelder ikke sammen|ekki hægt að sameina/i.test(value);
}

function assertNonNegative(value: number, field: string) {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${field} must be a non-negative finite number.`);
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
