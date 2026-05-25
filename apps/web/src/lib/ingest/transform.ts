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

export type IngestionPipelineRun = {
  readonly chain: string;
  readonly dataSource: string;
  readonly failureCount: number;
  readonly lastFinishedAt: string;
  readonly latestStatus: 'succeeded' | 'warning' | 'failed';
  readonly latencyMs: number;
  readonly rowCount: number;
  readonly sourceName: string;
};

export type IngestionPipelineMonitorRow = IngestionPipelineRun & {
  readonly hasFailures: boolean;
  readonly latencySeconds: number;
};

export function buildIngestionPipelineMonitorRows(runs: readonly IngestionPipelineRun[]): IngestionPipelineMonitorRow[] {
  return runs.map((run) => ({
    ...run,
    failureCount: Math.max(0, Math.round(run.failureCount)),
    hasFailures: run.failureCount > 0 || run.latestStatus === 'failed',
    latencyMs: Math.max(0, Math.round(run.latencyMs)),
    latencySeconds: Math.round((Math.max(0, run.latencyMs) / 1000) * 10) / 10,
    rowCount: Math.max(0, Math.round(run.rowCount))
  }));
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
