export type PromotionKind = 'multi_buy' | 'percent_off' | 'member' | 'price';

export type StructuredPromotion = {
  kind: PromotionKind;
  mechanicText: string;
  quantity?: number;
  bundlePrice?: number;
  percentOff?: number;
  requiresMembership?: boolean;
};

export function parsePromotionMechanic(mechanicText: string): StructuredPromotion {
  const text = mechanicText.trim();
  const multiBuy = text.match(/(\d+)\s*(?:för|for)\s*(\d+(?:[,:.]\d+)?)/i);
  if (multiBuy) {
    return {
      kind: 'multi_buy',
      mechanicText: text,
      quantity: Number(multiBuy[1]),
      bundlePrice: Number(multiBuy[2]!.replace(',', '.').replace(':', '.'))
    };
  }

  const percentOff = text.match(/(\d+)\s*%\s*(?:rabatt|off)/i);
  if (percentOff) {
    return {
      kind: 'percent_off',
      mechanicText: text,
      percentOff: Number(percentOff[1])
    };
  }

  if (/stammis|medlem|member/i.test(text)) {
    return {
      kind: 'member',
      mechanicText: text,
      requiresMembership: true
    };
  }

  return { kind: 'price', mechanicText: text };
}
