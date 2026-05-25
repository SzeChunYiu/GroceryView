export type UnitKind = "mass" | "volume" | "count";

export type CanonicalUnit = "kg" | "l" | "st";

export type UnitAlias = {
  readonly canonicalUnit: CanonicalUnit;
  readonly kind: UnitKind;
  readonly multiplierToCanonical: number;
  readonly displayUnit: string;
};

export type NormalizedUnit = UnitAlias & {
  readonly input: string;
  readonly alias: string;
};

export type UnitNormalizationQaIssueKind =
  | "missing_unit"
  | "suspicious_pack_size"
  | "inconsistent_unit_price";

export type UnitNormalizationQaSeverity = "warning" | "review" | "blocker";

export function unitNormalizationQaSeverity(kind: UnitNormalizationQaIssueKind): UnitNormalizationQaSeverity {
  if (kind === "missing_unit") return "blocker";
  if (kind === "inconsistent_unit_price") return "review";
  return "warning";
}

const MASS_KG: UnitAlias = {
  canonicalUnit: "kg",
  kind: "mass",
  multiplierToCanonical: 1,
  displayUnit: "kg",
};

const MASS_G: UnitAlias = {
  canonicalUnit: "kg",
  kind: "mass",
  multiplierToCanonical: 0.001,
  displayUnit: "g",
};

const VOLUME_L: UnitAlias = {
  canonicalUnit: "l",
  kind: "volume",
  multiplierToCanonical: 1,
  displayUnit: "l",
};

const VOLUME_DL: UnitAlias = {
  canonicalUnit: "l",
  kind: "volume",
  multiplierToCanonical: 0.1,
  displayUnit: "dl",
};

const VOLUME_CL: UnitAlias = {
  canonicalUnit: "l",
  kind: "volume",
  multiplierToCanonical: 0.01,
  displayUnit: "cl",
};

const VOLUME_ML: UnitAlias = {
  canonicalUnit: "l",
  kind: "volume",
  multiplierToCanonical: 0.001,
  displayUnit: "ml",
};

const COUNT_ST: UnitAlias = {
  canonicalUnit: "st",
  kind: "count",
  multiplierToCanonical: 1,
  displayUnit: "st",
};

export const CANONICAL_UNIT_DICTIONARY: Readonly<Record<string, UnitAlias>> = Object.freeze({
  kg: MASS_KG,
  kilo: MASS_KG,
  kilos: MASS_KG,
  kilogram: MASS_KG,
  kilograms: MASS_KG,
  kilogramme: MASS_KG,
  kilogrammes: MASS_KG,
  g: MASS_G,
  gr: MASS_G,
  gram: MASS_G,
  grams: MASS_G,
  gramme: MASS_G,
  grammes: MASS_G,

  l: VOLUME_L,
  liter: VOLUME_L,
  liters: VOLUME_L,
  lit: VOLUME_L,
  litre: VOLUME_L,
  litres: VOLUME_L,
  dl: VOLUME_DL,
  deciliter: VOLUME_DL,
  deciliters: VOLUME_DL,
  decilitre: VOLUME_DL,
  decilitres: VOLUME_DL,
  cl: VOLUME_CL,
  centiliter: VOLUME_CL,
  centiliters: VOLUME_CL,
  centilitre: VOLUME_CL,
  centilitres: VOLUME_CL,
  ml: VOLUME_ML,
  milliliter: VOLUME_ML,
  milliliters: VOLUME_ML,
  millilitre: VOLUME_ML,
  millilitres: VOLUME_ML,

  st: COUNT_ST,
  styck: COUNT_ST,
  stycken: COUNT_ST,
  pc: COUNT_ST,
  pcs: COUNT_ST,
  pce: COUNT_ST,
  stk: COUNT_ST,
  piece: COUNT_ST,
  pieces: COUNT_ST,
  each: COUNT_ST,
  ea: COUNT_ST,
  item: COUNT_ST,
  items: COUNT_ST,
  unit: COUNT_ST,
  units: COUNT_ST,
});

export const canonicalUnitDictionary = CANONICAL_UNIT_DICTIONARY;

export function normalizeUnitKey(unit: string): string {
  const unitParts = unit.trim().toLowerCase().split("/");
  const unitPart = unitParts[unitParts.length - 1] ?? unit;

  return unitPart
    .replace(/å/g, "a")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/^(kr|sek)\s*(per)?\s*/, "")
    .replace(/^per\s+/, "")
    .replace(/[^a-z]+/g, "");
}

export function getCanonicalUnit(unit: string | null | undefined): NormalizedUnit | null {
  if (!unit) {
    return null;
  }

  const alias = normalizeUnitKey(unit);
  const definition = CANONICAL_UNIT_DICTIONARY[alias];

  if (!definition) {
    return null;
  }

  return {
    ...definition,
    input: unit,
    alias,
  };
}

export function normalizeUnit(unit: string | null | undefined): CanonicalUnit | null {
  return getCanonicalUnit(unit)?.canonicalUnit ?? null;
}

export function normalizeQuantity(
  value: number | null | undefined,
  unit: string | null | undefined,
): { value: number; unit: CanonicalUnit } | null {
  const normalizedUnit = getCanonicalUnit(unit);

  if (value == null || !Number.isFinite(value) || !normalizedUnit) {
    return null;
  }

  return {
    value: value * normalizedUnit.multiplierToCanonical,
    unit: normalizedUnit.canonicalUnit,
  };
}

export function normalizeUnitPrice(
  price: number | null | undefined,
  unit: string | null | undefined,
): { price: number; unit: CanonicalUnit } | null {
  const normalizedUnit = getCanonicalUnit(unit);

  if (price == null || !Number.isFinite(price) || !normalizedUnit) {
    return null;
  }

  return {
    price: price / normalizedUnit.multiplierToCanonical,
    unit: normalizedUnit.canonicalUnit,
  };
}

export type ComparableUnitPrice = {
  price: number;
  unit: CanonicalUnit;
  label: string;
};

export function getComparableUnitPrice(
  price: number | null | undefined,
  unit: string | null | undefined,
): ComparableUnitPrice | null {
  const normalized = normalizeUnitPrice(price, unit);

  if (!normalized || normalized.price <= 0) {
    return null;
  }

  return {
    ...normalized,
    label: `kr/${normalized.unit}`,
  };
}

export function areCompatibleUnits(
  left: string | null | undefined,
  right: string | null | undefined,
): boolean {
  const leftUnit = getCanonicalUnit(left);
  const rightUnit = getCanonicalUnit(right);

  return Boolean(leftUnit && rightUnit && leftUnit.canonicalUnit === rightUnit.canonicalUnit);
}

export type ParsedPackageSize = {
  quantity: number;
  unit: CanonicalUnit;
  label: string;
} | null;

export function parsePackageSize(size: string | null | undefined): ParsedPackageSize {
  if (!size) return null;

  const match = size.trim().toLowerCase().replace(",", ".").match(/(\d+(?:\.\d+)?)\s*([a-zåäö]+)/i);
  if (!match) return null;

  const quantity = Number(match[1]);
  const unit = getCanonicalUnit(match[2]);
  if (!Number.isFinite(quantity) || !unit) return null;

  const canonicalQuantity = quantity * unit.multiplierToCanonical;

  return {
    quantity: canonicalQuantity,
    unit: unit.canonicalUnit,
    label: `${canonicalQuantity.toLocaleString("sv-SE", { maximumFractionDigits: 2 })} ${unit.canonicalUnit}`,
  };
}

export const unitNormalizer = Object.freeze({
  normalizeUnitKey,
  getCanonicalUnit,
  normalizeUnit,
  normalizeQuantity,
  normalizeUnitPrice,
  getComparableUnitPrice,
  areCompatibleUnits,
  parsePackageSize,
  unitNormalizationQaSeverity,
});
