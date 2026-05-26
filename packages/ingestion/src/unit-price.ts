export type NormalisedUnitPrice = {
  unitPrice: number;
  comparableUnit: 'kg' | 'l' | 'piece';
};

type ParsedQuantity = {
  size: number;
  unit: NormalisedUnitPrice['comparableUnit'];
};

export type DiaperSizeClass = 'diaper-size-1' | 'diaper-size-2' | 'diaper-size-3' | 'diaper-size-4' | 'diaper-size-5' | 'diaper-size-6';

export type ParsedDiaperPackageClass = {
  diaperCount: number;
  declaredSize: number | null;
  diaperSizeClass: DiaperSizeClass | null;
};

const supportedDiaperSizeClasses = new Set([1, 2, 3, 4, 5, 6]);

const round4 = (value: number): number => Math.round((value + Number.EPSILON) * 10000) / 10000;

export function normaliseUnitPrice(price: number, quantityStr: string): NormalisedUnitPrice {
  if (!Number.isFinite(price) || price < 0) throw new Error('price must be a non-negative finite number.');
  const quantity = parseQuantityString(quantityStr);
  return {
    unitPrice: round4(price / quantity.size),
    comparableUnit: quantity.unit
  };
}

function parseQuantityString(quantityStr: string): ParsedQuantity {
  const normalized = normalizeDiaperPackageText(quantityStr);
  if (!normalized) throw new Error('quantityStr must not be empty.');
  if (/(^|[\sx×])-+\s*\d/u.test(normalized)) throw new Error('quantity must be positive.');

  const diaperPackage = /\b(?:blojor|diapers?|strl|storlek|size|comfort)\b/u.test(normalized)
    ? parseDiaperPackageClass(normalized)
    : null;
  if (diaperPackage) {
    return quantityFromUnit(diaperPackage.diaperCount, 'piece');
  }

  const multiplierMatch = normalized.match(/^(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*([a-zåäö]+)\b/u);
  if (multiplierMatch) {
    return quantityFromUnit(
      parseDecimal(multiplierMatch[1]!) * parseDecimal(multiplierMatch[2]!),
      multiplierMatch[3]!
    );
  }

  const packMatch = normalized.match(/^(\d+(?:[.,]\d+)?)\s*(?:-|\s)?(?:pack|pk|st|styck|pcs|pieces?|rullar?|blöjor?)\b/u);
  if (packMatch) {
    return quantityFromUnit(parseDecimal(packMatch[1]!), 'piece');
  }

  const quantityMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*([a-zåäö]+)\b/u);
  if (!quantityMatch) throw new Error(`Unsupported quantity string: ${quantityStr}`);
  return quantityFromUnit(parseDecimal(quantityMatch[1]!), quantityMatch[2]!);
}

function normalizeDiaperPackageText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function diaperSizeClassFor(size: number | null): DiaperSizeClass | null {
  if (size === null || !supportedDiaperSizeClasses.has(size)) return null;
  return `diaper-size-${size}` as DiaperSizeClass;
}

export function extractDiaperPackageCount(packageText: string): number | null {
  const normalized = normalizeDiaperPackageText(packageText);
  if (!normalized) return null;
  return parseDiaperCount(normalized);
}

function parseDiaperCount(normalized: string): number | null {
  const multiPackMatch = normalized.match(/\b(\d+)\s*[x×]\s*(\d+)\s*(?:p|st|pcs|pieces?|blojor|diapers?)\b/u);
  if (multiPackMatch) return Number(multiPackMatch[1]!) * Number(multiPackMatch[2]!);

  const perPackageMatch = normalized.match(/\b(\d+)\s*(?:per|\/)\s*(?:frp|forp|forpackning|pack|paket)\b/u);
  if (perPackageMatch) return Number(perPackageMatch[1]!);

  const pieceCountMatch = normalized.match(/\b(\d+)\s*(?:p|st|pcs|pieces?|blojor|diapers?)\b/u);
  if (pieceCountMatch) return Number(pieceCountMatch[1]!);

  return null;
}

export function extractDiaperDeclaredSize(packageText: string): number | null {
  const normalized = normalizeDiaperPackageText(packageText);
  if (!normalized) return null;
  return parseDiaperDeclaredSize(normalized);
}

function parseDiaperDeclaredSize(normalized: string): number | null {
  const explicitSizeMatch = normalized.match(/\b(?:strl|storlek|size)\s*([1-8])\b/u);
  if (explicitSizeMatch) return Number(explicitSizeMatch[1]!);

  const comfortSizeMatch = normalized.match(/\bcomfort\s*([1-8])\b/u);
  if (comfortSizeMatch) return Number(comfortSizeMatch[1]!);

  return null;
}

export function parseDiaperPackageClass(packageText: string): ParsedDiaperPackageClass | null {
  const normalized = normalizeDiaperPackageText(packageText);
  if (!normalized) return null;

  const diaperCount = parseDiaperCount(normalized);
  if (diaperCount === null || !Number.isFinite(diaperCount) || diaperCount <= 0) return null;

  const declaredSize = parseDiaperDeclaredSize(normalized);
  return {
    diaperCount,
    declaredSize,
    diaperSizeClass: diaperSizeClassFor(declaredSize)
  };
}

function quantityFromUnit(value: number, rawUnit: string): ParsedQuantity {
  if (!Number.isFinite(value) || value <= 0) throw new Error('quantity must be positive.');
  const unit = rawUnit.toLowerCase();
  if (unit === 'g' || unit === 'gram' || unit === 'grams') return { size: value / 1000, unit: 'kg' };
  if (unit === 'kg' || unit === 'kilo' || unit === 'kilogram' || unit === 'kilograms') return { size: value, unit: 'kg' };
  if (unit === 'ml' || unit === 'milliliter' || unit === 'millilitre') return { size: value / 1000, unit: 'l' };
  if (unit === 'cl') return { size: value / 100, unit: 'l' };
  if (unit === 'dl') return { size: value / 10, unit: 'l' };
  if (unit === 'l' || unit === 'liter' || unit === 'litre' || unit === 'liters' || unit === 'litres') return { size: value, unit: 'l' };
  if (unit === 'piece' || unit === 'pack' || unit === 'pk' || unit === 'st' || unit === 'styck' || unit === 'pcs') {
    return { size: value, unit: 'piece' };
  }
  throw new Error(`Unsupported quantity unit: ${rawUnit}`);
}

function parseDecimal(value: string): number {
  return Number(value.replace(',', '.'));
}
