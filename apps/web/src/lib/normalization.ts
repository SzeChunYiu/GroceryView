export type UnitHarmonizedPrice = {
  value: number;
  unit: 'kg' | 'l' | 'st';
  label: string;
  source: 'unit-price' | 'package-size';
};

type NormalizeComparisonCellInput = {
  priceText: string | null | undefined;
  unitLabel?: string | null;
  packageLabel?: string | null;
};

const UNIT_PRICE_PATTERN = /([-+]?\d[\d\s]*(?:[,.]\d+)?)\s*(?:kr|sek)\s*\/\s*(kg|kilo|kilogram|l|liter|litre|st|styck|piece|pcs)/i;
const AMOUNT_PATTERN = /([-+]?\d[\d\s]*(?:[,.]\d+)?)\s*(kg|kilo|kilogram|g|gram|l|liter|litre|cl|ml|st|styck|piece|pcs)\b/i;

function parseLocalizedNumber(value: string | null | undefined) {
  if (!value) return null;
  const match = value.match(/[-+]?\d[\d\s]*(?:[,.]\d+)?/);
  if (!match) return null;
  const normalized = match[0].replace(/\s/g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeUnit(unit: string): UnitHarmonizedPrice['unit'] | null {
  const lowered = unit.toLowerCase();
  if (['kg', 'kilo', 'kilogram', 'g', 'gram'].includes(lowered)) return 'kg';
  if (['l', 'liter', 'litre', 'cl', 'ml'].includes(lowered)) return 'l';
  if (['st', 'styck', 'piece', 'pcs'].includes(lowered)) return 'st';
  return null;
}

function amountInComparableUnits(amount: number, unit: string) {
  const lowered = unit.toLowerCase();
  if (['kg', 'kilo', 'kilogram', 'l', 'liter', 'litre', 'st', 'styck', 'piece', 'pcs'].includes(lowered)) return amount;
  if (['g', 'gram'].includes(lowered)) return amount / 1000;
  if (lowered === 'cl') return amount / 100;
  if (lowered === 'ml') return amount / 1000;
  return null;
}

function formatUnitPrice(value: number, unit: UnitHarmonizedPrice['unit']) {
  return `${new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 2, minimumFractionDigits: value < 10 ? 2 : 0 }).format(value)} kr/${unit}`;
}

function parseUnitPrice(value: string | null | undefined): UnitHarmonizedPrice | null {
  const match = value?.match(UNIT_PRICE_PATTERN);
  if (!match) return null;
  const parsedValue = parseLocalizedNumber(match[1]);
  const unit = normalizeUnit(match[2]);
  if (parsedValue === null || unit === null) return null;
  return {
    value: parsedValue,
    unit,
    label: formatUnitPrice(parsedValue, unit),
    source: 'unit-price'
  };
}

function parsePackageAmount(...labels: Array<string | null | undefined>) {
  for (const label of labels) {
    const match = label?.match(AMOUNT_PATTERN);
    if (!match) continue;
    const amount = parseLocalizedNumber(match[1]);
    const unit = normalizeUnit(match[2]);
    const comparableAmount = amount === null ? null : amountInComparableUnits(amount, match[2]);
    if (amount !== null && unit !== null && comparableAmount !== null && comparableAmount > 0) {
      return { amount: comparableAmount, unit };
    }
  }
  return null;
}

export function normalizeComparisonCell({ priceText, unitLabel, packageLabel }: NormalizeComparisonCellInput): UnitHarmonizedPrice | null {
  const explicitUnitPrice = parseUnitPrice(`${priceText ?? ''} ${unitLabel ?? ''}`);
  if (explicitUnitPrice) return explicitUnitPrice;

  const packagePrice = parseLocalizedNumber(priceText);
  const packageAmount = parsePackageAmount(unitLabel, packageLabel);
  if (packagePrice === null || packageAmount === null) return null;

  const value = packagePrice / packageAmount.amount;
  return {
    value,
    unit: packageAmount.unit,
    label: formatUnitPrice(value, packageAmount.unit),
    source: 'package-size'
  };
}

export function compareUnitHarmonizedPrices(a: UnitHarmonizedPrice | null, b: UnitHarmonizedPrice | null) {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  if (a.unit !== b.unit) return a.unit.localeCompare(b.unit);
  return a.value - b.value;
}
