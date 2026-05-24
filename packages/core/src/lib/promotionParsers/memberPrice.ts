export type MemberPricePromotion = {
  kind: 'member';
  list_price: number;
  member_price: number;
};

const memberPriceKeywordPattern = /\b(?:medlemspris|stammis(?:pris)?|plus[-\s]?pris|klubbpris)\b/i;
const pricePattern = /(?<!\d)(\d{1,5})(?:[,.](\d{1,2}))?\s*(?::\-|kr|sek)?(?!\d)/gi;

function parsePrice(whole: string, fraction: string | undefined): number {
  const decimals = fraction ? fraction.padEnd(2, '0').slice(0, 2) : '00';
  return Number(`${whole}.${decimals}`);
}

export function parseMemberPricePromotion(text: string): MemberPricePromotion | null {
  if (!memberPriceKeywordPattern.test(text)) return null;

  const prices = [...text.matchAll(pricePattern)]
    .map((match) => parsePrice(match[1]!, match[2]))
    .filter((price) => Number.isFinite(price) && price > 0);

  const uniquePrices = [...new Set(prices)];
  if (uniquePrices.length < 2) return null;

  const memberPrice = Math.min(...uniquePrices);
  const listPrice = Math.max(...uniquePrices);
  if (memberPrice >= listPrice) return null;

  return {
    kind: 'member',
    list_price: listPrice,
    member_price: memberPrice
  };
}
