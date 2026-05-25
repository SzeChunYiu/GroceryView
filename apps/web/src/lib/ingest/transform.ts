import {
  type CanonicalUnit,
  getCanonicalUnit,
  normalizeQuantity,
  normalizeUnitPrice,
} from "../unit-normalizer";
import { getStoreStockStatus, type StoreStockStatus } from "../freshness";

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

export type IngestStockFields = {
  readonly availability?: string | null;
  readonly inStock?: boolean | null;
  readonly isAvailable?: boolean | null;
  readonly observedAt?: string | number | Date | null;
  readonly retrievedAt?: string | number | Date | null;
  readonly scrapedAt?: string | number | Date | null;
  readonly sourceStockStatus?: string | null;
  readonly stockStatus?: string | null;
};

export type NormalizedIngestStockFields = {
  readonly stockStatus: StoreStockStatus;
  readonly stockStatusLabel: string;
  readonly stockStatusReason: string;
  readonly stockObservedAt: string | number | Date | null;
  readonly stockSourceSignals: string[];
};

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

export function transformIngestedStockFields(fields: IngestStockFields): NormalizedIngestStockFields {
  const sourceSignals = [
    fields.availability,
    fields.sourceStockStatus,
    fields.stockStatus,
    typeof fields.inStock === "boolean" ? (fields.inStock ? "in_stock" : "out_of_stock") : null,
  ].filter((signal): signal is string => typeof signal === "string" && signal.trim().length > 0);
  const stockObservedAt = fields.observedAt ?? fields.scrapedAt ?? fields.retrievedAt ?? null;
  const badge = getStoreStockStatus({
    isAvailable: fields.isAvailable ?? fields.inStock ?? null,
    observedAt: stockObservedAt,
    sourceSignals,
    sourceStockStatus: fields.sourceStockStatus ?? fields.stockStatus ?? fields.availability ?? null,
  });

  return {
    stockStatus: badge.status,
    stockStatusLabel: badge.label,
    stockStatusReason: badge.reason,
    stockObservedAt,
    stockSourceSignals: sourceSignals,
  };
}

export function transformIngestedProduct<T extends IngestUnitFields & IngestStockFields>(
  product: T,
): Omit<T, keyof IngestUnitFields | keyof IngestStockFields> & NormalizedIngestUnitFields & NormalizedIngestStockFields {
  return {
    ...product,
    ...transformIngestedUnitFields(product),
    ...transformIngestedStockFields(product),
  };
}
