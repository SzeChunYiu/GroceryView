export type NormalisedUnitPrice = {
  unitPrice: number;
  comparableUnit: 'kg' | 'l' | 'piece';
};

type ParsedQuantity = {
  size: number;
  unit: NormalisedUnitPrice['comparableUnit'];
};

export type DiaperPackageDetails = {
  diaperSize: number | null;
  diaperCount: number;
  diaperSizeClassId: string | null;
};

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
  const normalized = quantityStr.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!normalized) throw new Error('quantityStr must not be empty.');

  const diaperPackage = extractDiaperPackageDetails(normalized);
  if (diaperPackage) {
    return { size: diaperPackage.diaperCount, unit: 'piece' };
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

export function extractDiaperPackageDetails(value: string): DiaperPackageDetails | null {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!normalized) return null;

  const diaperCount = extractDiaperCount(normalized);
  if (diaperCount === null) return null;

  const diaperSize = extractDiaperSize(normalized);
  return {
    diaperSize,
    diaperCount,
    diaperSizeClassId: diaperSize !== null && diaperSize >= 1 && diaperSize <= 6 ? `diapers-size-${diaperSize}` : null
  };
}

function extractDiaperCount(normalized: string): number | null {
  const multiPackMatch = normalized.match(/(?:^|\b)(\d+)\s*[x×]\s*(\d+)\s*p(?:\b|$)/u);
  if (multiPackMatch) {
    return parseInt(multiPackMatch[1]!, 10) * parseInt(multiPackMatch[2]!, 10);
  }

  const perPackageMatch = normalized.match(/(?:^|\b)(\d+)\s*per\s*frp(?:\b|$)/u);
  if (perPackageMatch) return parseInt(perPackageMatch[1]!, 10);

  const pieceMatches = Array.from(normalized.matchAll(/(?:^|[^\d])(\d+)\s*p(?:\b|$)/gu));
  const lastPieceMatch = pieceMatches.at(-1);
  return lastPieceMatch ? parseInt(lastPieceMatch[1]!, 10) : null;
}

function extractDiaperSize(normalized: string): number | null {
  const explicitSizeMatch = normalized.match(/\b(?:strl|storlek|size)\.?\s*([1-8])\b/u);
  if (explicitSizeMatch) return parseInt(explicitSizeMatch[1]!, 10);

  const sizeBeforeWeightMatch = normalized.match(/\b[a-zåäö&]+\s*([1-8])\s+\d+\s*(?:-|–)\s*\d+\s*kg\b/u);
  return sizeBeforeWeightMatch ? parseInt(sizeBeforeWeightMatch[1]!, 10) : null;
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
