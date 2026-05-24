export type NormalizedUnit = 'kg' | 'l' | 'unit';

export interface UnitNormalizationOptions {
  unitsPerPack?: number;
}

export interface NormalizedQuantity {
  quantity: number;
  unit: NormalizedUnit;
}

interface UnitRule {
  unit: NormalizedUnit;
  multiplier: number;
  needsPackSize?: boolean;
}

const UNIT_RULES: Record<string, UnitRule> = {
  g: { unit: 'kg', multiplier: 0.001 },
  gram: { unit: 'kg', multiplier: 0.001 },
  grams: { unit: 'kg', multiplier: 0.001 },
  kg: { unit: 'kg', multiplier: 1 },
  kilogram: { unit: 'kg', multiplier: 1 },
  kilograms: { unit: 'kg', multiplier: 1 },
  ml: { unit: 'l', multiplier: 0.001 },
  milliliter: { unit: 'l', multiplier: 0.001 },
  milliliters: { unit: 'l', multiplier: 0.001 },
  millilitre: { unit: 'l', multiplier: 0.001 },
  millilitres: { unit: 'l', multiplier: 0.001 },
  l: { unit: 'l', multiplier: 1 },
  liter: { unit: 'l', multiplier: 1 },
  liters: { unit: 'l', multiplier: 1 },
  litre: { unit: 'l', multiplier: 1 },
  litres: { unit: 'l', multiplier: 1 },
  unit: { unit: 'unit', multiplier: 1 },
  units: { unit: 'unit', multiplier: 1 },
  each: { unit: 'unit', multiplier: 1 },
  ea: { unit: 'unit', multiplier: 1 },
  pack: { unit: 'unit', multiplier: 1, needsPackSize: true },
  packs: { unit: 'unit', multiplier: 1, needsPackSize: true },
  'per-pack': { unit: 'unit', multiplier: 1, needsPackSize: true },
  'per pack': { unit: 'unit', multiplier: 1, needsPackSize: true }
};

export function normalizeUnitQuantity(
  quantity: number,
  unit: string,
  options: UnitNormalizationOptions = {}
): NormalizedQuantity {
  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new Error('quantity must be a finite non-negative number');
  }

  const normalizedUnit = unit.trim().toLowerCase();
  const rule = UNIT_RULES[normalizedUnit];

  if (!rule) {
    throw new Error(`unsupported unit: ${unit}`);
  }

  const multiplier = rule.needsPackSize ? requirePackSize(options.unitsPerPack) : rule.multiplier;

  return {
    quantity: roundQuantity(quantity * multiplier),
    unit: rule.unit
  };
}

function requirePackSize(unitsPerPack: number | undefined): number {
  if (unitsPerPack === undefined || !Number.isFinite(unitsPerPack) || unitsPerPack <= 0) {
    throw new Error('unitsPerPack must be a finite positive number for pack units');
  }

  return unitsPerPack;
}

function roundQuantity(value: number): number {
  return Number(value.toPrecision(12));
}
