export type PromotionParserContext = {
  country?: string;
  currency?: string;
};

export type PromotionMatch = {
  type: string;
  text: string;
  value?: number;
};

export type PromotionParser = (
  text: string,
  context: PromotionParserContext
) => PromotionMatch | null;

function parsePercentOff(text: string): PromotionMatch | null {
  const match = text.match(/(\d+(?:[.,]\d+)?)\s*%\s*(?:off|rabatt|avslag)/i);
  if (!match) return null;
  return { type: 'percent_off', text, value: Number(match[1].replace(',', '.')) };
}

function parseMultiBuy(text: string): PromotionMatch | null {
  const match = text.match(/(\d+)\s*(?:for|för)\s*(\d+(?:[.,]\d+)?)/i);
  if (!match) return null;
  return { type: 'multi_buy', text, value: Number(match[2].replace(',', '.')) };
}

export const promotionParsers: PromotionParser[] = [parsePercentOff, parseMultiBuy];

export function parsePromotion(text: string, context: PromotionParserContext = {}) {
  for (const parser of promotionParsers) {
    const match = parser(text, context);
    if (match) return match;
  }

  return null;
}
