export type MemberPricePromotion = {
  kind: 'member';
  list_price: number;
  member_price: number;
};

const memberKeywordPattern = /\b(?:medlemspris|stammis|plus[-\s]?pris|klubbpris)\b/i;
const bundlePattern = /\b\d{1,2}\s*(?:f[öo]r|for|\/)\s*\d{1,4}(?:[,.]\d{1,2})?\b/i;

function normalizeText(value: string) {
  return value.trim().toLocaleLowerCase('sv-SE').replace(/\s+/g, ' ');
}

function parsePrice(value: string) {
  const parsed = Number.parseFloat(value.replace(/\s/g, '').replace(',', '.').replace(/:-$/, ''));
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) / 100 : null;
}

function visiblePrices(text: string) {
  return [...text.matchAll(/\b(\d{1,4}(?:[,.]\d{1,2})?)\s*(?::\s*-|kr|sek)(?=$|[\s,.;)])/gi)]
    .map((match) => parsePrice(match[1] ?? ''))
    .filter((price): price is number => price !== null);
}

export function parseMemberPricePromotion(text: string): MemberPricePromotion | null {
  const normalized = normalizeText(text);
  if (!memberKeywordPattern.test(normalized) || bundlePattern.test(normalized)) return null;

  const prices = [...new Set(visiblePrices(normalized))];
  if (prices.length !== 2) return null;

  const [memberPrice, listPrice] = [...prices].sort((a, b) => a - b);
  if (memberPrice >= listPrice) return null;

  return { kind: 'member', list_price: listPrice, member_price: memberPrice };
}
