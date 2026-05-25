export type XForYPromotion = {
  kind: 'x_for_y';
  n: number;
  price: number;
  currency: 'SEK';
};

function parsePrice(value: string) {
  const normalized = value.replace(/\s/g, '').replace(',', '.').replace(/:-$/, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeText(value: string) {
  return value.trim().toLocaleLowerCase('sv-SE');
}

function promotion(n: string, price: string): XForYPromotion | null {
  const parsedN = Number.parseInt(n, 10);
  const parsedPrice = parsePrice(price);
  if (!Number.isInteger(parsedN) || parsedN < 2 || parsedPrice === null) return null;
  return { kind: 'x_for_y', n: parsedN, price: parsedPrice, currency: 'SEK' };
}

export function parseXForYPromotion(text: string): XForYPromotion | null {
  const normalized = normalizeText(text);
  const explicitPrice = normalized.match(/\b(\d{1,2})\s*(?:för|for|på)\s*(\d+(?:[,.]\d{1,2})?)\s*(?::\-|kr|sek)?\b/i);
  if (explicitPrice) return promotion(explicitPrice[1], explicitPrice[2]);

  const payFor = normalized.match(/\bköp\s+(\d{1,2})\s+(?:betala\s+)?för\s+(\d{1,2})\b/i)
    ?? normalized.match(/\bbuy\s+(\d{1,2})\s+(?:pay\s+)?for\s+(\d{1,2})\b/i);
  if (!payFor) return null;

  const n = Number.parseInt(payFor[1], 10);
  const paid = Number.parseInt(payFor[2], 10);
  if (!Number.isInteger(n) || !Number.isInteger(paid) || n < 2 || paid < 1 || paid >= n) return null;
  return { kind: 'x_for_y', n, price: paid, currency: 'SEK' };
}
