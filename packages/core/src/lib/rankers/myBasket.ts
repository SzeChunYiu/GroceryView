export type MyBasketUserListing = {
  listingId: string;
};

export type MyBasketHistoryListing = MyBasketUserListing & {
  purchasedAt?: string | Date;
};

export type MyBasketRankerUser = {
  watchlist?: readonly MyBasketUserListing[];
  recentBasketHistory?: readonly MyBasketHistoryListing[];
};

export type MyBasketRankerPromo = {
  promoId: string;
  savings: number;
  listingId?: string;
  coveredListingIds?: readonly string[];
};

export type MyBasketMatchReason = 'watchlist' | 'recent_basket';

export type RankedMyBasketPromo<TPromo extends MyBasketRankerPromo> = TPromo & {
  rank: number;
  matchedListingIds: string[];
  matchReasons: MyBasketMatchReason[];
};

export type RankMyBasketPromosInput<TPromo extends MyBasketRankerPromo> = {
  user: MyBasketRankerUser;
  promos: readonly TPromo[];
  topN?: number;
  asOf?: string | Date;
  recentDays?: number;
};

const DEFAULT_RECENT_DAYS = 30;

function assertNonBlank(value: string, fieldName: string): void {
  if (!value.trim()) throw new Error(`${fieldName} is required.`);
}

function timestampFor(value: string | Date | undefined, fieldName: string): number {
  if (value === undefined) return Date.now();
  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
  if (!Number.isFinite(timestamp)) throw new Error(`${fieldName} must be a valid date.`);
  return timestamp;
}

function isRecentHistoryListing(listing: MyBasketHistoryListing, asOfTime: number, recentDays: number): boolean {
  if (listing.purchasedAt === undefined) return true;
  const purchasedAt = timestampFor(listing.purchasedAt, 'recentBasketHistory.purchasedAt');
  const recentWindowMs = recentDays * 24 * 60 * 60 * 1000;
  return purchasedAt <= asOfTime && asOfTime - purchasedAt <= recentWindowMs;
}

function listingIdsForPromo(promo: MyBasketRankerPromo): string[] {
  const listingIds = new Set<string>();
  if (promo.listingId !== undefined) {
    assertNonBlank(promo.listingId, 'listingId');
    listingIds.add(promo.listingId);
  }

  for (const listingId of promo.coveredListingIds ?? []) {
    assertNonBlank(listingId, 'coveredListingIds');
    listingIds.add(listingId);
  }

  return [...listingIds];
}

export function rankMyBasketPromos<TPromo extends MyBasketRankerPromo>(
  input: RankMyBasketPromosInput<TPromo>
): RankedMyBasketPromo<TPromo>[] {
  const topN = input.topN ?? 10;
  if (!Number.isInteger(topN) || topN <= 0) throw new Error('topN must be a positive integer.');

  const recentDays = input.recentDays ?? DEFAULT_RECENT_DAYS;
  if (!Number.isFinite(recentDays) || recentDays < 0) throw new Error('recentDays must be a non-negative finite number.');

  const asOfTime = timestampFor(input.asOf, 'asOf');
  const watchlistIds = new Set<string>();
  for (const listing of input.user.watchlist ?? []) {
    assertNonBlank(listing.listingId, 'watchlist.listingId');
    watchlistIds.add(listing.listingId);
  }

  const recentBasketIds = new Set<string>();
  for (const listing of input.user.recentBasketHistory ?? []) {
    assertNonBlank(listing.listingId, 'recentBasketHistory.listingId');
    if (isRecentHistoryListing(listing, asOfTime, recentDays)) recentBasketIds.add(listing.listingId);
  }

  return input.promos
    .map((promo) => {
      assertNonBlank(promo.promoId, 'promoId');
      if (!Number.isFinite(promo.savings)) throw new Error('savings must be a finite number.');

      const matchedListingIds = new Set<string>();
      const matchReasons = new Set<MyBasketMatchReason>();
      for (const listingId of listingIdsForPromo(promo)) {
        if (watchlistIds.has(listingId)) {
          matchedListingIds.add(listingId);
          matchReasons.add('watchlist');
        }

        if (recentBasketIds.has(listingId)) {
          matchedListingIds.add(listingId);
          matchReasons.add('recent_basket');
        }
      }

      return {
        promo,
        matchedListingIds: [...matchedListingIds].sort(),
        matchReasons: [...matchReasons].sort()
      };
    })
    .filter((candidate) => candidate.matchedListingIds.length > 0)
    .sort((left, right) => {
      if (right.promo.savings !== left.promo.savings) return right.promo.savings - left.promo.savings;
      return left.promo.promoId.localeCompare(right.promo.promoId);
    })
    .slice(0, topN)
    .map((candidate, index) => ({
      ...candidate.promo,
      rank: index + 1,
      matchedListingIds: candidate.matchedListingIds,
      matchReasons: candidate.matchReasons
    }));
}

export const rankMyBasketPromotions = rankMyBasketPromos;
export default rankMyBasketPromos;
