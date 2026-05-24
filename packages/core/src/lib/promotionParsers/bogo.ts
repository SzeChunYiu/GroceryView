export type BogoPromotion = {
  kind: 'bogo';
  buy: number;
  free: number;
};

export function parseBogoPromotion(input: string): BogoPromotion | null {
  const text = input.toLocaleLowerCase('sv-SE').replace(/\s+/g, ' ').trim();

  const buyGet = text.match(/\b(?:köp|kop|køb|kjøp|buy)\s+(\d+)\s+(?:få|fa|get)\s+(\d+)\s+(?:gratis|free)\b/);
  if (buyGet) return toBogo(Number(buyGet[1]), Number(buyGet[2]));

  const forPriceOf = text.match(/\b(\d+)\s+(?:för|for|f(?:ö|o)r)\s+(\d+)\b/);
  if (forPriceOf) return fromTotalForPaid(Number(forPriceOf[1]), Number(forPriceOf[2]));

  const takePay = text.match(/\b(?:tag|ta|take)\s+(\d+)\s+(?:betala\s+(?:för\s+)?|pay\s+(?:for\s+)?)(\d+)\b/);
  if (takePay) return fromTotalForPaid(Number(takePay[1]), Number(takePay[2]));

  return null;
}

function fromTotalForPaid(total: number, paid: number): BogoPromotion | null {
  if (!Number.isInteger(total) || !Number.isInteger(paid) || total <= paid || paid < 1) return null;
  return toBogo(paid, total - paid);
}

function toBogo(buy: number, free: number): BogoPromotion | null {
  if (!Number.isInteger(buy) || !Number.isInteger(free) || buy < 1 || free < 1) return null;
  return { kind: 'bogo', buy, free };
}
