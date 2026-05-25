import {
  type CanonicalUnit,
  getCanonicalUnit,
  normalizeQuantity,
  normalizeUnitPrice,
} from "../unit-normalizer";

export type IngestUnitFields = {
  readonly quantity?: number | null;
  readonly unit?: string | null;
  readonly unitPrice?: number | null;
  readonly unitPriceUnit?: string | null;
};

export type NormalizedIngestUnitFields = {
  readonly quantity?: number | null;
  readonly unit?: CanonicalUnit | null;
  readonly unitPrice?: number | null;
  readonly unitPriceUnit?: CanonicalUnit | null;
  readonly sourceUnit?: string | null;
  readonly sourceUnitPriceUnit?: string | null;
};

export type UnitNormalizationAuditConfidence = "high" | "medium" | "low";

export type IngestUnitFieldAudit = {
  readonly confidence: UnitNormalizationAuditConfidence;
  readonly quantityResolved: boolean;
  readonly unitPriceResolved: boolean;
  readonly unresolvedReasons: string[];
};

export function auditIngestedUnitFields(fields: IngestUnitFields): IngestUnitFieldAudit {
  const unitPriceUnit = fields.unitPriceUnit ?? fields.unit;
  const normalizedQuantity = normalizeQuantity(fields.quantity, fields.unit);
  const normalizedUnitPrice = normalizeUnitPrice(fields.unitPrice, unitPriceUnit);
  const unresolvedReasons: string[] = [];

  if (fields.quantity != null && fields.unit && !normalizedQuantity) {
    unresolvedReasons.push(`quantity unit "${fields.unit}" is not canonical`);
  }
  if (fields.unitPrice != null && !unitPriceUnit) {
    unresolvedReasons.push("unit price is missing a unit");
  } else if (fields.unitPrice != null && unitPriceUnit && !normalizedUnitPrice) {
    unresolvedReasons.push(`unit price unit "${unitPriceUnit}" is not canonical`);
  }

  return {
    confidence: unresolvedReasons.length === 0 ? "high" : unresolvedReasons.some((reason) => reason.includes("missing")) ? "low" : "medium",
    quantityResolved: fields.quantity == null || !fields.unit || Boolean(normalizedQuantity),
    unitPriceResolved: fields.unitPrice == null || Boolean(normalizedUnitPrice),
    unresolvedReasons
  };
}

export function transformIngestedUnitFields(fields: IngestUnitFields): NormalizedIngestUnitFields {
  const normalizedQuantity = normalizeQuantity(fields.quantity, fields.unit);
  const normalizedUnitPrice = normalizeUnitPrice(
    fields.unitPrice,
    fields.unitPriceUnit ?? fields.unit,
  );
  const normalizedUnit = getCanonicalUnit(fields.unit);
  const normalizedUnitPriceUnit = getCanonicalUnit(fields.unitPriceUnit ?? fields.unit);

  return {
    quantity: normalizedQuantity?.value ?? fields.quantity ?? null,
    unit: normalizedQuantity?.unit ?? normalizedUnit?.canonicalUnit ?? null,
    unitPrice: normalizedUnitPrice?.price ?? fields.unitPrice ?? null,
    unitPriceUnit:
      normalizedUnitPrice?.unit ?? normalizedUnitPriceUnit?.canonicalUnit ?? null,
    sourceUnit: fields.unit ?? null,
    sourceUnitPriceUnit: fields.unitPriceUnit ?? null,
  };
}

export function transformIngestedProduct<T extends IngestUnitFields>(
  product: T,
): Omit<T, keyof IngestUnitFields> & NormalizedIngestUnitFields {
  return {
    ...product,
    ...transformIngestedUnitFields(product),
  };
}
