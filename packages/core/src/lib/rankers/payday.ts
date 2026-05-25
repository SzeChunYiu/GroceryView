export type PaydayRankableDeal = {
  dealScore: number;
  productCategory?: string;
  category?: string;
};

const PAYDAY_ESSENTIAL_CATEGORIES = new Set(['dairy', 'bread', 'meat', 'produce']);

const PAYDAY_BY_COUNTRY: Record<string, number> = {
  SE: 25,
  SWE: 25,
  SWEDEN: 25
};

type PaydayContext = { active: boolean; boost: number };

export function resolvePaydayContext(countryCode?: string, rankedAt?: string | Date): PaydayContext {
  const normalizedCountry = countryCode?.trim().toUpperCase();
  if (!normalizedCountry) return { active: false, boost: 0 };
  const payday = PAYDAY_BY_COUNTRY[normalizedCountry] ?? PAYDAY_BY_COUNTRY[normalizedCountry.slice(0, 2)];
  if (!payday) return { active: false, boost: 0 };
  const date = rankedAt ? new Date(rankedAt) : new Date();
  if (Number.isNaN(date.getTime())) return { active: false, boost: 0 };

  const dayOfMonth = date.getUTCDate();
  const daysFromPayday = Math.abs(dayOfMonth - payday);
  return {
    active: daysFromPayday <= 2,
    boost: 8
  };
}

export function isPaydayEssentialCategory(category?: string): boolean {
  if (!category) return false;
  return PAYDAY_ESSENTIAL_CATEGORIES.has(category.trim().toLowerCase());
}

export function paydayRankScore(deal: PaydayRankableDeal, paydayContext: PaydayContext): number {
  if (!paydayContext.active || !isPaydayEssentialCategory(deal.productCategory ?? deal.category)) {
    return deal.dealScore;
  }

  return Math.min(100, deal.dealScore + paydayContext.boost);
}
