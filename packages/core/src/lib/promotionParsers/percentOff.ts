export type PercentOffPromotion = {
  kind: 'percent_off';
  pct: number;
};

const DISCOUNT_CUE_PATTERN = /(?:^|\s)(?:rabatt|spara|spar|save|discount|off|kampanje|tilbud)(?:\s|$)/u;
const PERCENT_PATTERN = /(^|[^\d])([-−–—])?\s*(\d{1,3}(?:[,.]\d+)?)\s*(?:%|procent\b|percent\b)/u;

export function parsePercentOffPromotion(value: string): PercentOffPromotion | null {
  const normalized = value.trim().toLocaleLowerCase('sv-SE').replace(/\s+/g, ' ');
  if (!normalized) return null;

  const match = normalized.match(PERCENT_PATTERN);
  if (!match) return null;

  const hasLeadingMinus = Boolean(match[2]);
  const hasDiscountCue = DISCOUNT_CUE_PATTERN.test(normalized);
  if (!hasLeadingMinus && !hasDiscountCue) return null;

  const pct = Number.parseFloat(match[3].replace(',', '.'));
  if (!Number.isFinite(pct) || pct <= 0 || pct > 100) return null;

  return { kind: 'percent_off', pct };
}
