export type StoreScopedPromotion = {
  promotionId: string;
  listingId: string;
  storeId?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  priority?: number;
  updatedAt?: string | null;
};

export type ResolvePromotionByStoreInput<TPromotion extends StoreScopedPromotion> = {
  promotions: readonly TPromotion[];
  listingId: string;
  storeId: string;
  now: string | Date;
};

export type ResolvePromotionByStoreResult<TPromotion extends StoreScopedPromotion> = {
  promotion: TPromotion | null;
  scope: 'store' | 'chain' | null;
};

function requireNonBlank(value: string, fieldName: string): void {
  if (!value.trim()) throw new Error(`${fieldName} is required.`);
}

function timestamp(value: string | Date, fieldName: string): number {
  const parsed = value instanceof Date ? value.getTime() : Date.parse(value);
  if (Number.isNaN(parsed)) throw new Error(`${fieldName} must be a parseable date.`);
  return parsed;
}

function optionalTimestamp(value: string | null | undefined, fieldName: string): number | null {
  if (value === undefined || value === null || value === '') return null;
  return timestamp(value, fieldName);
}

function isActivePromotion(promotion: StoreScopedPromotion, nowMs: number): boolean {
  const startsAt = optionalTimestamp(promotion.startsAt, 'promotion.startsAt');
  const endsAt = optionalTimestamp(promotion.endsAt, 'promotion.endsAt');
  return (startsAt === null || startsAt <= nowMs) && (endsAt === null || endsAt >= nowMs);
}

function scopeRank(promotion: StoreScopedPromotion, storeId: string): 0 | 1 | -1 {
  if (promotion.storeId === storeId) return 1;
  if (promotion.storeId === undefined || promotion.storeId === null) return 0;
  return -1;
}

export function resolvePromotionByStore<TPromotion extends StoreScopedPromotion>(
  input: ResolvePromotionByStoreInput<TPromotion>
): ResolvePromotionByStoreResult<TPromotion> {
  requireNonBlank(input.listingId, 'listingId');
  requireNonBlank(input.storeId, 'storeId');
  const nowMs = timestamp(input.now, 'now');

  const candidates = input.promotions
    .filter((promotion) => promotion.listingId === input.listingId)
    .map((promotion) => ({
      promotion,
      scope: scopeRank(promotion, input.storeId),
      startsAt: optionalTimestamp(promotion.startsAt, 'promotion.startsAt') ?? Number.NEGATIVE_INFINITY,
      updatedAt: optionalTimestamp(promotion.updatedAt, 'promotion.updatedAt') ?? Number.NEGATIVE_INFINITY
    }))
    .filter((candidate) => candidate.scope >= 0 && isActivePromotion(candidate.promotion, nowMs))
    .sort((left, right) =>
      right.scope - left.scope ||
      (right.promotion.priority ?? 0) - (left.promotion.priority ?? 0) ||
      right.startsAt - left.startsAt ||
      right.updatedAt - left.updatedAt ||
      left.promotion.promotionId.localeCompare(right.promotion.promotionId)
    );

  const winner = candidates[0];
  if (!winner) return { promotion: null, scope: null };
  return {
    promotion: winner.promotion,
    scope: winner.scope === 1 ? 'store' : 'chain'
  };
}
