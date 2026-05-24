export type NormalisedUnitPrice = {
  unitPrice: number;
  comparableUnit: 'kg' | 'l' | 'piece';
};

type ParsedQuantity = {
  size: number;
  unit: NormalisedUnitPrice['comparableUnit'];
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
