export type SurplusListingInput = {
  availableUntil?: unknown;
  bagPrice?: unknown;
  bag_price?: unknown;
  description?: unknown;
  expiresAt?: unknown;
  expires_at?: unknown;
  originalPrice?: unknown;
  original_price?: unknown;
  pickupEnd?: unknown;
  price?: unknown;
  title?: unknown;
  valuePrice?: unknown;
};

export type SurplusPromotion = {
  bag_price: number;
  expires_at: string | null;
  kind: 'surplus';
  original_price: number;
  pct_off: number;
};

function numberFromUnknown(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const match = value.replace(/\s/g, '').match(/\d+(?:[,.]\d+)?/);
  if (!match) return null;
  const parsed = Number.parseFloat(match[0].replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function textFromUnknown(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function dateFromUnknown(value: unknown): string | null {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString();
  if (typeof value !== 'string') return null;
  const match = value.match(/\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:?\d{2})?)?/);
  const normalized = match?.[0].replace(' ', 'T');
  const hasExplicitZone = normalized ? /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized) : false;
  const parsed = Date.parse(normalized ? `${normalized}${hasExplicitZone ? '' : 'Z'}` : value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

function labelledMoney(text: string, labels: RegExp[]) {
  for (const label of labels) {
    const match = text.match(label);
    const value = numberFromUnknown(match?.[1]);
    if (value !== null) return value;
  }
  return null;
}

function pricesFromText(text: string) {
  return [...text.matchAll(/\d+(?:[,.]\d+)?\s*(?:kr|sek|nok|dkk|€|eur)/gi)]
    .map((match) => numberFromUnknown(match[0]))
    .filter((value): value is number => value !== null);
}

function roundPct(value: number) {
  return Math.round(value * 10) / 10;
}

export function parseSurplusPromotion(input: SurplusListingInput | string): SurplusPromotion | null {
  const listing: SurplusListingInput = typeof input === 'string' ? { description: input } : input;
  const combinedText = `${textFromUnknown(listing.title)} ${textFromUnknown(listing.description)}`;
  const textPrices = pricesFromText(combinedText);
  const originalPrice = numberFromUnknown(listing.original_price)
    ?? numberFromUnknown(listing.originalPrice)
    ?? numberFromUnknown(listing.valuePrice)
    ?? labelledMoney(combinedText, [
      /(?:original|ordinary|regular|ordinarie|värde|value)[^\d]{0,32}(\d+(?:[,.]\d+)?)/i,
    ])
    ?? (textPrices.length >= 2 ? Math.max(...textPrices) : null);
  const bagPrice = numberFromUnknown(listing.bag_price)
    ?? numberFromUnknown(listing.bagPrice)
    ?? numberFromUnknown(listing.price)
    ?? labelledMoney(combinedText, [
      /(?:bag|påse|surprise|karma|nu|now)[^\d]{0,32}(\d+(?:[,.]\d+)?)/i,
    ])
    ?? (textPrices.length >= 2 ? Math.min(...textPrices) : null);

  if (originalPrice === null || bagPrice === null || originalPrice <= 0 || bagPrice <= 0 || bagPrice >= originalPrice) {
    return null;
  }

  const expiresAt = dateFromUnknown(listing.expires_at)
    ?? dateFromUnknown(listing.expiresAt)
    ?? dateFromUnknown(listing.availableUntil)
    ?? dateFromUnknown(listing.pickupEnd)
    ?? dateFromUnknown(combinedText);

  return {
    bag_price: bagPrice,
    expires_at: expiresAt,
    kind: 'surplus',
    original_price: originalPrice,
    pct_off: roundPct(((originalPrice - bagPrice) / originalPrice) * 100),
  };
}
