export type UnitPriceInput = {
  currency?: string;
  unit: string;
  amount: number;
};

const DEFAULT_CURRENCY = 'SEK';
const DECIMALS = 2;

function parseDecimal(value: string): number {
  return Number.parseFloat(value.replace(',', '.'));
}

export function formatPrice(value: number, currency = DEFAULT_CURRENCY): string {
  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: DECIMALS,
    maximumFractionDigits: DECIMALS
  })} ${currency}`;
}

function parseAmountWithUnit(input?: string | null): UnitPriceInput | null {
  if (!input) {
    return null;
  }

  const match = input.trim().match(/^([0-9]+(?:[.,][0-9]+)?)\s*([A-Za-zÅåÄäÖö]+)\s*\/\s*([a-zA-Z]+)\s*$/);
  if (!match) {
    return null;
  }

  const rawAmount = parseDecimal(match[1] ?? '');
  const currency = (match[2] ?? '').toUpperCase();
  const unit = (match[3] ?? '').toLowerCase();

  if (!Number.isFinite(rawAmount)) {
    return null;
  }

  return { amount: rawAmount, currency, unit };
}

export function formatComparableUnitPrice(unitPrice?: string | null): string | null {
  const parsed = parseAmountWithUnit(unitPrice);
  if (!parsed) {
    return null;
  }

  const unit = parsed.unit.toLowerCase();

  if (unit === 'kg') {
    return `${formatPrice(parsed.amount / 10, parsed.currency)}/100g`;
  }

  if (unit === 'g') {
    return `${formatPrice(parsed.amount * 100, parsed.currency)}/100g`;
  }

  if (unit === 'l') {
    return `${formatPrice(parsed.amount, parsed.currency)}/l`;
  }

  if (unit === 'ml') {
    return `${formatPrice(parsed.amount / 1000, parsed.currency)}/l`;
  }

  if (unit === 'cl') {
    return `${formatPrice(parsed.amount * 10, parsed.currency)}/l`;
  }

  return null;
}

function parseQuantityQuantity(value?: string | null): UnitPriceInput | null {
  if (!value) {
    return null;
  }

  const clean = value.trim().replace(/\s+/g, '').toLowerCase();
  const match = clean.match(/^([0-9]+(?:[.,][0-9]+)?)(kg|g|l|ml|cl)$/);
  if (!match) {
    return null;
  }

  const amount = parseDecimal(match[1] ?? '');
  if (!Number.isFinite(amount)) {
    return null;
  }

  return { amount, currency: DEFAULT_CURRENCY, unit: match[2] ?? '' };
}

export function formatComparablePriceFromObservation(price: number, quantity?: string | null): string | null {
  const parsed = parseQuantityQuantity(quantity);
  if (!parsed || !Number.isFinite(price) || price <= 0) {
    return null;
  }

  if (parsed.unit === 'g') {
    return `${formatPrice((price / parsed.amount) * 100)}/100g`;
  }

  if (parsed.unit === 'kg') {
    return `${formatPrice((price / (parsed.amount * 1000)) * 100)}/100g`;
  }

  if (parsed.unit === 'ml') {
    return `${formatPrice(price / (parsed.amount / 1000))}/l`;
  }

  if (parsed.unit === 'cl') {
    return `${formatPrice(price / (parsed.amount / 100))}/l`;
  }

  if (parsed.unit === 'l') {
    return `${formatPrice(price / parsed.amount)}/l`;
  }

  return null;
}
