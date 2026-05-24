export type XForYPromotion = Readonly<{
  currency: 'SEK';
  kind: 'x_for_y';
  n: number;
  payFor?: number;
  price?: number;
}>;

const pricePatterns = [
  /\b(\d{1,2})\s*(?:st\s*)?(?:för|for|på)\s*(\d{1,5}(?:[,.]\d{1,2})?)\s*(?:kr|sek|:-)?\b/i,
  /\b(?:köp|ta)\s*(\d{1,2})\s*(?:st\s*)?(?:för|for|på)\s*(\d{1,5}(?:[,.]\d{1,2})?)\s*(?:kr|sek|:-)?\b/i
];

const payForPattern = /\b(?:köp|ta)\s*(\d{1,2})\s*(?:st\s*)?betala\s*(?:för\s*)?(\d{1,2})\b/i;

function validCount(value: number) {
  return Number.isInteger(value) && value >= 2 && value <= 12;
}

function validPrice(value: number) {
  return Number.isFinite(value) && value > 0 && value < 10000;
}

export function parseXForYPromotion(value: string): XForYPromotion | null {
  const input = value.trim();
  if (!input) return null;

  for (const pattern of pricePatterns) {
    const match = input.match(pattern);
    if (!match) continue;

    const n = Number(match[1]);
    const price = Number(match[2].replace(',', '.'));
    if (!validCount(n) || !validPrice(price)) return null;

    return { currency: 'SEK', kind: 'x_for_y', n, price };
  }

  const payForMatch = input.match(payForPattern);
  if (payForMatch) {
    const n = Number(payForMatch[1]);
    const payFor = Number(payForMatch[2]);
    if (!validCount(n) || !Number.isInteger(payFor) || payFor < 1 || payFor >= n) return null;

    return { currency: 'SEK', kind: 'x_for_y', n, payFor };
  }

  return null;
}

export const xForYParserTestCases: ReadonlyArray<Readonly<{ expected: XForYPromotion | null; input: string }>> = [
  { input: '2 för 20 kr', expected: { currency: 'SEK', kind: 'x_for_y', n: 2, price: 20 } },
  { input: '3 för 100', expected: { currency: 'SEK', kind: 'x_for_y', n: 3, price: 100 } },
  { input: '2 på 25:-', expected: { currency: 'SEK', kind: 'x_for_y', n: 2, price: 25 } },
  { input: 'Köp 2 betala för 1', expected: { currency: 'SEK', kind: 'x_for_y', n: 2, payFor: 1 } },
  { input: 'Köp 3 betala 2', expected: { currency: 'SEK', kind: 'x_for_y', n: 3, payFor: 2 } },
  { input: 'Ta 4 betala för 3', expected: { currency: 'SEK', kind: 'x_for_y', n: 4, payFor: 3 } },
  { input: '2 st för 35 kr', expected: { currency: 'SEK', kind: 'x_for_y', n: 2, price: 35 } },
  { input: 'Köp 2 för 30', expected: { currency: 'SEK', kind: 'x_for_y', n: 2, price: 30 } },
  { input: 'Ta 3 för 45 kr', expected: { currency: 'SEK', kind: 'x_for_y', n: 3, price: 45 } },
  { input: '4 for 99', expected: { currency: 'SEK', kind: 'x_for_y', n: 4, price: 99 } },
  { input: '5 för 100 SEK', expected: { currency: 'SEK', kind: 'x_for_y', n: 5, price: 100 } },
  { input: '2 för 19,90 kr', expected: { currency: 'SEK', kind: 'x_for_y', n: 2, price: 19.9 } },
  { input: '3 på 50:-', expected: { currency: 'SEK', kind: 'x_for_y', n: 3, price: 50 } },
  { input: 'Köp 4 för 120 kr', expected: { currency: 'SEK', kind: 'x_for_y', n: 4, price: 120 } },
  { input: 'Ta 2 för 25', expected: { currency: 'SEK', kind: 'x_for_y', n: 2, price: 25 } },
  { input: '6 st för 150 kr', expected: { currency: 'SEK', kind: 'x_for_y', n: 6, price: 150 } },
  { input: '2 for 20 kr', expected: { currency: 'SEK', kind: 'x_for_y', n: 2, price: 20 } },
  { input: '7 för 200', expected: { currency: 'SEK', kind: 'x_for_y', n: 7, price: 200 } },
  { input: '8 på 249:-', expected: { currency: 'SEK', kind: 'x_for_y', n: 8, price: 249 } },
  { input: 'Köp 5 betala för 4', expected: { currency: 'SEK', kind: 'x_for_y', n: 5, payFor: 4 } },
  { input: 'Ta 2 betala 1', expected: { currency: 'SEK', kind: 'x_for_y', n: 2, payFor: 1 } },
  { input: 'medlemspris 3 för 69 kr', expected: { currency: 'SEK', kind: 'x_for_y', n: 3, price: 69 } },
  { input: 'ICA 2 för 40', expected: { currency: 'SEK', kind: 'x_for_y', n: 2, price: 40 } },
  { input: 'Willys köp 3 för 90 kr', expected: { currency: 'SEK', kind: 'x_for_y', n: 3, price: 90 } },
  { input: 'Coop ta 4 för 100', expected: { currency: 'SEK', kind: 'x_for_y', n: 4, price: 100 } },
  { input: 'Max 2 köp per kund', expected: null },
  { input: 'Jämförpris 25 kr/kg', expected: null },
  { input: 'Spara 10 kr', expected: null },
  { input: '1 för 10 kr', expected: null }
];
