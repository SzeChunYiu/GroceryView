export type ComparableUnitKey = 'kg' | 'l' | 'st';

export type NormalizedPackageAmount = {
  amount: number;
  unit: ComparableUnitKey;
  packageLabel: string;
};

export type NormalizedComparableUnitPrice = {
  packageLabel: string;
  unitKey: ComparableUnitKey;
  unitLabel: `kr/${ComparableUnitKey}`;
  unitPrice: number;
  unitSortPrice: number;
};

export type UnitSortEntry = {
  name: string;
  unitSortPrice: number | null;
  unitCompareKey?: ComparableUnitKey | null;
};

const unitAliases: Record<string, ComparableUnitKey> = {
  kg: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  kilo: 'kg',
  g: 'kg',
  gram: 'kg',
  grams: 'kg',
  l: 'l',
  liter: 'l',
  litre: 'l',
  liters: 'l',
  litres: 'l',
  cl: 'l',
  dl: 'l',
  ml: 'l',
  st: 'st',
  styck: 'st',
  pc: 'st',
  pcs: 'st',
  piece: 'st',
  pieces: 'st'
};

const unitDivisors: Record<string, number> = {
  kg: 1,
  kilogram: 1,
  kilograms: 1,
  kilo: 1,
  g: 1000,
  gram: 1000,
  grams: 1000,
  l: 1,
  liter: 1,
  litre: 1,
  liters: 1,
  litres: 1,
  cl: 100,
  dl: 10,
  ml: 1000,
  st: 1,
  styck: 1,
  pc: 1,
  pcs: 1,
  piece: 1,
  pieces: 1
};

const unitPattern = '(kg|kilograms?|kilo|g|grams?|l|liters?|litres?|cl|dl|ml|st|styck|pcs?|pieces?)';
const numberPattern = '(\\d+(?:[\\s.,]\\d+)?)';
const multipliedAmountPattern = new RegExp(`(\\d+)\\s*(?:x|×)\\s*${numberPattern}\\s*${unitPattern}\\b`, 'i');
const amountPattern = new RegExp(`${numberPattern}\\s*${unitPattern}\\b`, 'gi');

function normalizedNumber(value: string): number {
  return Number(value.replace(/\s/g, '').replace(',', '.'));
}

function normalizeUnit(unit: string): { key: ComparableUnitKey; divisor: number } | null {
  const alias = unit.toLowerCase();
  const key = unitAliases[alias];
  const divisor = unitDivisors[alias];
  return key && divisor ? { key, divisor } : null;
}

export function normalizePackageAmount(packageText: string): NormalizedPackageAmount | null {
  const normalized = packageText.trim();
  if (!normalized) return null;

  const multiplied = normalized.match(multipliedAmountPattern);
  if (multiplied) {
    const count = Number(multiplied[1]);
    const each = normalizedNumber(multiplied[2]);
    const unit = normalizeUnit(multiplied[3]);
    if (unit && Number.isFinite(count) && Number.isFinite(each) && count > 0 && each > 0) {
      return {
        amount: (count * each) / unit.divisor,
        unit: unit.key,
        packageLabel: multiplied[0]
      };
    }
  }

  const matches = [...normalized.matchAll(amountPattern)];
  const match = matches.at(-1);
  if (!match) return null;

  const value = normalizedNumber(match[1]);
  const unit = normalizeUnit(match[2]);
  if (!unit || !Number.isFinite(value) || value <= 0) return null;

  return {
    amount: value / unit.divisor,
    unit: unit.key,
    packageLabel: match[0]
  };
}

export function normalizeComparableUnitPrice(totalPrice: number, packageText: string): NormalizedComparableUnitPrice | null {
  const packageAmount = normalizePackageAmount(packageText);
  if (!packageAmount || !Number.isFinite(totalPrice) || totalPrice <= 0 || packageAmount.amount <= 0) return null;

  const unitPrice = totalPrice / packageAmount.amount;
  return {
    packageLabel: packageAmount.packageLabel,
    unitKey: packageAmount.unit,
    unitLabel: `kr/${packageAmount.unit}`,
    unitPrice,
    unitSortPrice: unitPrice
  };
}

export function compareNormalizedUnitEntries(left: UnitSortEntry, right: UnitSortEntry): number {
  const leftUnitPrice = left.unitSortPrice;
  const rightUnitPrice = right.unitSortPrice;
  const leftUnitKey = left.unitCompareKey;
  const rightUnitKey = right.unitCompareKey;
  const leftHasComparableUnit = leftUnitPrice !== null && leftUnitPrice !== undefined && leftUnitKey !== null && leftUnitKey !== undefined;
  const rightHasComparableUnit = rightUnitPrice !== null && rightUnitPrice !== undefined && rightUnitKey !== null && rightUnitKey !== undefined;

  if (!leftHasComparableUnit || !rightHasComparableUnit) {
    if (leftHasComparableUnit === rightHasComparableUnit) return left.name.localeCompare(right.name, 'sv');
    return leftHasComparableUnit ? -1 : 1;
  }

  if (leftUnitKey !== rightUnitKey) {
    return leftUnitKey.localeCompare(rightUnitKey, 'sv');
  }

  const delta = leftUnitPrice - rightUnitPrice;
  return delta === 0 ? left.name.localeCompare(right.name, 'sv') : delta;
}
