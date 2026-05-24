export type PromotionDateValue = string | Date | null | undefined;

export type PromotionWindow = {
  starts_at?: PromotionDateValue;
  ends_at?: PromotionDateValue;
  startsAt?: PromotionDateValue;
  endsAt?: PromotionDateValue;
};

function toTime(value: Exclude<PromotionDateValue, null | undefined>) {
  const time = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

function hasBoundary(value: PromotionDateValue) {
  return value != null && value !== '';
}

export function isPromotionActive(promotion: PromotionWindow, now: Date | string = new Date()) {
  const nowTime = toTime(now);
  if (nowTime == null) throw new Error('Cannot filter active promotions without a valid now value.');

  const rawStartsAt = promotion.starts_at ?? promotion.startsAt;
  const startsAt = hasBoundary(rawStartsAt) ? toTime(rawStartsAt) : null;
  if (hasBoundary(rawStartsAt) && startsAt == null) return false;
  if (startsAt != null && startsAt > nowTime) return false;

  const rawEndsAt = promotion.ends_at ?? promotion.endsAt;
  const endsAt = hasBoundary(rawEndsAt) ? toTime(rawEndsAt) : null;
  if (hasBoundary(rawEndsAt) && endsAt == null) return false;
  if (endsAt != null && endsAt < nowTime) return false;

  return true;
}

export function filterActivePromotions<T extends PromotionWindow>(promotions: readonly T[], now: Date | string = new Date()): T[] {
  return promotions.filter((promotion) => isPromotionActive(promotion, now));
}

export const activePromotions = filterActivePromotions;
