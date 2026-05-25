export type BogoPromotion = {
  kind: 'bogo';
  buy: number;
  free: number;
};

function normalizeText(value: string) {
  return value.trim().toLocaleLowerCase('sv-SE').replace(/\s+/g, ' ');
}

function toPositiveInt(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function makeBogo(paid: number, total: number): BogoPromotion | null {
  const free = total - paid;
  if (paid <= 0 || free <= 0) return null;
  return { kind: 'bogo', buy: paid, free };
}

export function parseBogoPromotion(text: string): BogoPromotion | null {
  const normalized = normalizeText(text);

  const buyGetMatch = normalized.match(/\b(?:k[öo]p|köper|handla|tag|ta)\s+(\d+)\s+(?:och\s+)?(?:f[åa]|får)\s+(\d+)\s+(?:gratis|p[åa]\s+k[öo]pet)\b/i);
  if (buyGetMatch) {
    const buy = toPositiveInt(buyGetMatch[1]);
    const free = toPositiveInt(buyGetMatch[2]);
    return buy && free ? { kind: 'bogo', buy, free } : null;
  }

  const forPriceMatch = normalized.match(/\b(\d+)\s*(?:f[öo]r|/|-)\s*(\d+)\b/i);
  if (forPriceMatch) {
    const total = toPositiveInt(forPriceMatch[1]);
    const paid = toPositiveInt(forPriceMatch[2]);
    return total && paid ? makeBogo(paid, total) : null;
  }

  const takePayMatch = normalized.match(/\b(?:tag|ta|k[öo]p)\s+(\d+)\s+(?:betala|betalar|betala\s+bara)\s+(?:f[öo]r\s+)?(\d+)\b/i);
  if (takePayMatch) {
    const total = toPositiveInt(takePayMatch[1]);
    const paid = toPositiveInt(takePayMatch[2]);
    return total && paid ? makeBogo(paid, total) : null;
  }

  return null;
}
