export type LoyaltyPointsPromotion = {
  kind: 'loyalty_points';
  multiplier: number;
};

function normalizeText(value: string) {
  return value.trim().toLocaleLowerCase('sv-SE').replace(',', '.');
}

function roundMultiplier(value: number) {
  return Math.round(value * 100) / 100;
}

export function parseLoyaltyPointsPromotion(text: string): LoyaltyPointsPromotion | null {
  const normalized = normalizeText(text);
  const multiplierMatch = normalized.match(/(?:^|\b)(\d+(?:\.\d+)?)\s*(?:x|×)\s*(?:bonus)?po[aä]ng\b/i)
    ?? normalized.match(/(?:^|\b)(\d+(?:\.\d+)?)\s*(?:ggr|gånger)\s*(?:bonus)?po[aä]ng\b/i);
  if (multiplierMatch) {
    const multiplier = Number.parseFloat(multiplierMatch[1]);
    return Number.isFinite(multiplier) && multiplier > 0 ? { kind: 'loyalty_points', multiplier: roundMultiplier(multiplier) } : null;
  }

  const percentMatch = normalized.match(/(?:^|\b)(\d+(?:\.\d+)?)\s*%\s*bonuspo[aä]ng\b/i);
  if (!percentMatch) return null;
  const percent = Number.parseFloat(percentMatch[1]);
  if (!Number.isFinite(percent) || percent <= 0) return null;

  return { kind: 'loyalty_points', multiplier: roundMultiplier(1 + percent / 100) };
}
