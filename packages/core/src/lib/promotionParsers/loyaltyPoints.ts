export type LoyaltyPointsPromotion = {
  kind: 'loyalty_points';
  multiplier: number;
  rawText: string;
};

const POINT_MULTIPLIER_PATTERN = /(\d+(?:[,.]\d+)?)\s*x\s*(?:bonus)?poäng/iu;
const BONUS_PERCENT_PATTERN = /(\d+(?:[,.]\d+)?)\s*%\s*bonuspoäng/iu;

export function parseLoyaltyPointsPromotion(text: string): LoyaltyPointsPromotion | null {
  const multiplierMatch = text.match(POINT_MULTIPLIER_PATTERN);
  if (multiplierMatch?.[1]) {
    return {
      kind: 'loyalty_points',
      multiplier: numberFromMatch(multiplierMatch[1]),
      rawText: text
    };
  }

  const bonusPercentMatch = text.match(BONUS_PERCENT_PATTERN);
  if (bonusPercentMatch?.[1]) {
    return {
      kind: 'loyalty_points',
      multiplier: 1 + (numberFromMatch(bonusPercentMatch[1]) / 100),
      rawText: text
    };
  }

  return null;
}

export function parseLoyaltyPointsPromotions(texts: readonly string[]): LoyaltyPointsPromotion[] {
  return texts
    .map(parseLoyaltyPointsPromotion)
    .filter((promotion): promotion is LoyaltyPointsPromotion => promotion !== null);
}

function numberFromMatch(value: string) {
  return Number.parseFloat(value.replace(',', '.'));
}
