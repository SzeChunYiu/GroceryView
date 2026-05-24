export type XForYPromotion = {
  kind: 'x_for_y';
  n: number;
  price: number | null;
  currency: 'SEK';
  pay_for?: number;
};

const UNIT_AFTER_AMOUNT = /^(g|gram|kg|kilo|l|liter|ml|cl|st|styck|pack)\b/i;

function parseNumber(value: string): number {
  return Number.parseFloat(value.replace(',', '.'));
}

function validQuantity(value: number): boolean {
  return Number.isInteger(value) && value >= 2 && value <= 99;
}

function validPrice(value: number): boolean {
  return Number.isFinite(value) && value > 0 && value <= 10000;
}

export function parseXForYPromotion(input: string): XForYPromotion | null {
  const text = input
    .normalize('NFKC')
    .replace(/\u00a0/g, ' ')
    .replace(/:-/g, ' :-')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return null;

  const payForMatch = text.match(/(?:^|\b)k[öo]p\s+(\d{1,2})\s*(?:st\s*)?(?:,?\s*)betala\s+(?:f[öo]r\s+)?(\d{1,2})(?:\s*st)?(?:\b|$)/i);
  if (payForMatch) {
    const n = Number.parseInt(payForMatch[1], 10);
    const payFor = Number.parseInt(payForMatch[2], 10);
    if (validQuantity(n) && Number.isInteger(payFor) && payFor > 0 && payFor < n) {
      return { kind: 'x_for_y', n, price: null, pay_for: payFor, currency: 'SEK' };
    }
  }

  const priceMatch = text.match(/(?:^|[^\d])([2-9]\d?)\s*(?:f[öo]r|for|på)\s*(\d+(?:[,.]\d{1,2})?)\s*(kr|sek|:-)?(?=$|[\s,.;)!])/i);
  if (!priceMatch) return null;

  const n = Number.parseInt(priceMatch[1], 10);
  const price = parseNumber(priceMatch[2]);
  const explicitCurrency = Boolean(priceMatch[3]);
  const tail = text.slice((priceMatch.index ?? 0) + priceMatch[0].length).trimStart();

  if (!validQuantity(n) || !validPrice(price)) return null;
  if (!explicitCurrency && price < 10) return null;
  if (UNIT_AFTER_AMOUNT.test(tail)) return null;

  return { kind: 'x_for_y', n, price, currency: 'SEK' };
}
