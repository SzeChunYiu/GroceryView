export type StoreLike = string | {
  id?: string | null;
  storeId?: string | null;
  store_id?: string | null;
};

export type StoreScopedPromotion = {
  storeId?: string | null;
  store_id?: string | null;
  startsAt?: Date | string | null;
  starts_at?: Date | string | null;
  endsAt?: Date | string | null;
  ends_at?: Date | string | null;
};

export type ListingWithPromotions<TPromotion extends StoreScopedPromotion> = {
  promotions?: TPromotion[] | null;
};

function storeIdFor(store: StoreLike): string | null {
  if (typeof store === 'string') return store;
  return store.id ?? store.storeId ?? store.store_id ?? null;
}

function promotionStoreId(promotion: StoreScopedPromotion): string | null {
  return promotion.storeId ?? promotion.store_id ?? null;
}

function dateValue(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  return Number.isFinite(time) ? time : null;
}

function isActivePromotion(promotion: StoreScopedPromotion, now: Date): boolean {
  const nowTime = now.getTime();
  const startsAt = dateValue(promotion.startsAt ?? promotion.starts_at);
  const endsAt = dateValue(promotion.endsAt ?? promotion.ends_at);

  if (startsAt !== null && startsAt > nowTime) return false;
  if (endsAt !== null && endsAt < nowTime) return false;
  return true;
}

function rankPromotion(promotion: StoreScopedPromotion, storeId: string | null): number {
  return promotionStoreId(promotion) === storeId ? 1 : 0;
}

export function resolvePromotionByStore<TPromotion extends StoreScopedPromotion>(
  listing: ListingWithPromotions<TPromotion>,
  store: StoreLike,
  now = new Date()
): TPromotion | null {
  const storeId = storeIdFor(store);
  const promotions = listing.promotions ?? [];

  return promotions
    .filter((promotion) => {
      const promotionStore = promotionStoreId(promotion);
      return (!promotionStore || promotionStore === storeId) && isActivePromotion(promotion, now);
    })
    .sort((left, right) => {
      const storeRank = rankPromotion(right, storeId) - rankPromotion(left, storeId);
      if (storeRank !== 0) return storeRank;
      return (dateValue(right.startsAt ?? right.starts_at) ?? 0) - (dateValue(left.startsAt ?? left.starts_at) ?? 0);
    })[0] ?? null;
}
