export type MyBasketUserSignal = Readonly<{
  productId: string;
  quantity?: number;
  lastPurchasedAt?: string;
}>;

export type MyBasketRankerUser = Readonly<{
  watchlist?: readonly string[];
  recentBasketHistory?: readonly (string | MyBasketUserSignal)[];
}>;

export type MyBasketPromo = Readonly<{
  promoId: string;
  productId: string;
  productName?: string;
  savings: number;
}>;

export type RankedMyBasketPromo<TPromo extends MyBasketPromo> = TPromo & {
  rank: number;
  matchReason: 'watchlist' | 'recent_basket_history' | 'watchlist_and_recent_basket_history';
  matchedQuantity: number;
};

export type RankMyBasketPromosInput<TPromo extends MyBasketPromo> = Readonly<{
  user: MyBasketRankerUser;
  promos: readonly TPromo[];
  topN?: number;
}>;

function productIdForHistoryItem(item: string | MyBasketUserSignal) {
  return typeof item === 'string' ? item : item.productId;
}

function quantityForHistoryItem(item: string | MyBasketUserSignal) {
  if (typeof item === 'string') return 1;
  return Number.isFinite(item.quantity) && item.quantity && item.quantity > 0 ? item.quantity : 1;
}

function assertNonBlank(value: string, fieldName: string) {
  if (!value.trim()) throw new Error(`${fieldName} is required.`);
}

function assertPromo(promo: MyBasketPromo) {
  assertNonBlank(promo.promoId, 'promoId');
  assertNonBlank(promo.productId, 'productId');
  if (!Number.isFinite(promo.savings)) throw new Error('savings must be finite.');
}

function matchReason(inWatchlist: boolean, inRecentBasket: boolean): RankedMyBasketPromo<MyBasketPromo>['matchReason'] {
  if (inWatchlist && inRecentBasket) return 'watchlist_and_recent_basket_history';
  if (inWatchlist) return 'watchlist';
  return 'recent_basket_history';
}

export function rankMyBasketPromos<TPromo extends MyBasketPromo>(input: RankMyBasketPromosInput<TPromo>): RankedMyBasketPromo<TPromo>[] {
  const topN = input.topN ?? input.promos.length;
  if (!Number.isInteger(topN) || topN <= 0) throw new Error('topN must be a positive integer.');

  const watchlist = new Set((input.user.watchlist ?? []).filter((productId) => productId.trim()));
  const basketQuantityByProduct = new Map<string, number>();

  for (const item of input.user.recentBasketHistory ?? []) {
    const productId = productIdForHistoryItem(item).trim();
    if (!productId) continue;
    basketQuantityByProduct.set(productId, (basketQuantityByProduct.get(productId) ?? 0) + quantityForHistoryItem(item));
  }

  return input.promos
    .map((promo) => {
      assertPromo(promo);
      return promo;
    })
    .flatMap((promo): RankedMyBasketPromo<TPromo>[] => {
      const inWatchlist = watchlist.has(promo.productId);
      const matchedQuantity = basketQuantityByProduct.get(promo.productId) ?? 0;
      const inRecentBasket = matchedQuantity > 0;
      if (!inWatchlist && !inRecentBasket) return [];
      if (promo.savings <= 0) return [];

      return [{
        ...promo,
        rank: 0,
        matchReason: matchReason(inWatchlist, inRecentBasket),
        matchedQuantity: inRecentBasket ? matchedQuantity : 0
      }];
    })
    .sort((left, right) => {
      if (right.savings !== left.savings) return right.savings - left.savings;
      if (right.matchedQuantity !== left.matchedQuantity) return right.matchedQuantity - left.matchedQuantity;
      return left.productId.localeCompare(right.productId);
    })
    .slice(0, topN)
    .map((promo, index) => ({ ...promo, rank: index + 1 }));
}

export const rankMyBasketPromotions = rankMyBasketPromos;
export default rankMyBasketPromos;
