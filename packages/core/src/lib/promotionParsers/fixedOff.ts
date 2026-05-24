export type FixedOffPromotion = {
  kind: 'fixed_off';
  amount: number;
  currency: 'SEK';
};

function parseAmount(value: string): number {
  return Number.parseFloat(value.replace(',', '.'));
}

function validAmount(value: number): boolean {
  return Number.isFinite(value) && value > 0 && value <= 10000;
}

export function parseFixedOffPromotion(input: string): FixedOffPromotion | null {
  const text = input
    .normalize('NFKC')
    .replace(/\u00a0/g, ' ')
    .replace(/:-/g, ' :-')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return null;

  const saveMatch = text.match(/(?:^|\b)spara\s+(\d+(?:[,.]\d{1,2})?)\s*(?:kr|sek|:-)\b?/i);
  const rebateMatch = text.match(/(?:^|\b)(\d+(?:[,.]\d{1,2})?)\s*(?:kr|sek|:-)\s+rabatt\b/i);
  const match = saveMatch ?? rebateMatch;
  if (!match) return null;

  const amount = parseAmount(match[1]);
  if (!validAmount(amount)) return null;
  return { kind: 'fixed_off', amount, currency: 'SEK' };
}
