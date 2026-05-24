export type SurplusPromotion = {
  kind: 'surplus';
  original_price: number;
  bag_price: number;
  pct_off: number;
  expires_at: string;
};

type SurplusListing = Record<string, unknown>;

const ORIGINAL_PRICE_KEYS = ['original_price', 'originalPrice', 'originalValue', 'value', 'retail_price', 'retailPrice'];
const BAG_PRICE_KEYS = ['bag_price', 'bagPrice', 'price', 'discounted_price', 'discountedPrice', 'current_price', 'currentPrice'];
const EXPIRES_AT_KEYS = ['expires_at', 'expiresAt', 'pickup_window_end', 'pickupWindowEnd', 'available_until', 'availableUntil', 'endTime', 'best_before'];

export function parseSurplusPromotion(input: unknown): SurplusPromotion | null {
  const listing = typeof input === 'string' ? listingFromText(input) : objectOrNull(input);
  if (!listing) return null;

  const originalPrice = firstPrice(listing, ORIGINAL_PRICE_KEYS);
  const bagPrice = firstPrice(listing, BAG_PRICE_KEYS);
  const expiresAt = firstDate(listing, EXPIRES_AT_KEYS);

  if (originalPrice === null || bagPrice === null || !expiresAt || originalPrice <= 0 || bagPrice < 0 || bagPrice > originalPrice) {
    return null;
  }

  return {
    kind: 'surplus',
    original_price: roundMoney(originalPrice),
    bag_price: roundMoney(bagPrice),
    pct_off: Math.round(((originalPrice - bagPrice) / originalPrice) * 100),
    expires_at: expiresAt
  };
}

export const parseSurplusListing = parseSurplusPromotion;
export const parseTooGoodToGoKarmaListing = parseSurplusPromotion;

function objectOrNull(input: unknown): SurplusListing | null {
  return input && typeof input === 'object' && !Array.isArray(input) ? input as SurplusListing : null;
}

function listingFromText(text: string): SurplusListing {
  return {
    original_price: labelledPrice(text, ['original price', 'originalpris', 'value', 'värde']),
    bag_price: labelledPrice(text, ['bag price', 'påse', 'surprise bag', 'karma price', 'price', 'pris']),
    expires_at: labelledDate(text) ?? undefined
  };
}

function firstPrice(listing: SurplusListing, keys: string[]): number | null {
  for (const key of keys) {
    const price = parsePrice(deepValue(listing, key));
    if (price !== null) return price;
  }
  return null;
}

function firstDate(listing: SurplusListing, keys: string[]): string | null {
  for (const key of keys) {
    const date = parseDate(deepValue(listing, key));
    if (date) return date;
  }
  return null;
}

function deepValue(record: SurplusListing, key: string): unknown {
  if (key in record) return record[key];
  for (const value of Object.values(record)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = value as SurplusListing;
      if (key in nested) return nested[key];
    }
  }
  return undefined;
}

function labelledPrice(text: string, labels: string[]): number | undefined {
  for (const label of labels) {
    const match = text.match(new RegExp(`${escapeRegExp(label)}[^0-9]{0,24}([0-9]+(?:[,.][0-9]{1,2})?)`, 'i'));
    if (match) return parsePrice(match[1]) ?? undefined;
  }
  return undefined;
}

function labelledDate(text: string): string | null {
  const match = text.match(/(?:expires|expires at|pickup until|available until|best before|síðasti|rennur út)[^0-9]{0,24}([0-9]{4}-[0-9]{2}-[0-9]{2}(?:[T ][0-9:.-]+Z?)?)/i);
  return match ? parseDate(match[1]) : null;
}

function parsePrice(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const normalized = value.replace(/\s/g, '').replace(',', '.').replace(/(?:kr|sek|isk|eur|€)$/i, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(value: unknown): string | null {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString();
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
