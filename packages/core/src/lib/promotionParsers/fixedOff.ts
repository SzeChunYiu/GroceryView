export type FixedOffPromotion = {
  kind: 'fixed_off';
  amount: number;
  currency: 'SEK';
  matchedText: string;
};

const FIXED_OFF_PATTERNS: RegExp[] = [
  /\bspara\s+(\d+(?:[,.]\d{1,2})?)\s*(?::\-|kr|sek)?\b/iu,
  /\b(\d+(?:[,.]\d{1,2})?)\s*(?:kr|sek)\s+rabatt\b/iu,
  /\brabatt\s+(\d+(?:[,.]\d{1,2})?)\s*(?:kr|sek)\b/iu
];

function parseAmount(raw: string) {
  const amount = Number(raw.replace(',', '.'));
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) / 100 : null;
}

export function parseFixedOffPromotion(text: string): FixedOffPromotion | null {
  for (const pattern of FIXED_OFF_PATTERNS) {
    const match = text.match(pattern);
    const amount = match?.[1] ? parseAmount(match[1]) : null;
    if (match?.[0] && amount !== null) {
      return {
        kind: 'fixed_off',
        amount,
        currency: 'SEK',
        matchedText: match[0].trim()
      };
    }
  }
  return null;
}
