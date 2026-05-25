export type SourceDuplicateSample = {
  source: string;
  windowMinutes: number;
  currentDuplicateLikeMatches: number;
  baselineDuplicateLikeMatches: number;
  sampledAt: string;
};

export type SourceDuplicateConflictAlert = SourceDuplicateSample & {
  severity: "watch" | "critical";
  spikeRatio: number;
  message: string;
};

export const duplicateConflictSamples: SourceDuplicateSample[] = [
  {
    source: "Axfood scraper",
    windowMinutes: 15,
    currentDuplicateLikeMatches: 42,
    baselineDuplicateLikeMatches: 10,
    sampledAt: "2026-05-24T09:30:00.000Z",
  },
  {
    source: "Open Food Facts import",
    windowMinutes: 15,
    currentDuplicateLikeMatches: 18,
    baselineDuplicateLikeMatches: 12,
    sampledAt: "2026-05-24T09:30:00.000Z",
  },
  {
    source: "Store catalogue crawler",
    windowMinutes: 15,
    currentDuplicateLikeMatches: 31,
    baselineDuplicateLikeMatches: 9,
    sampledAt: "2026-05-24T09:30:00.000Z",
  },
];

export function getDuplicateConflictAlerts(
  samples: SourceDuplicateSample[] = duplicateConflictSamples,
): SourceDuplicateConflictAlert[] {
  return samples
    .map((sample) => {
      const baseline = Math.max(sample.baselineDuplicateLikeMatches, 1);
      const spikeRatio = sample.currentDuplicateLikeMatches / baseline;

      if (spikeRatio < 2.5 || sample.currentDuplicateLikeMatches < 25) {
        return null;
      }

      const severity = spikeRatio >= 4 ? "critical" : "watch";

      return {
        ...sample,
        severity,
        spikeRatio,
        message: `${sample.source} reported ${sample.currentDuplicateLikeMatches} duplicate-like matches in ${sample.windowMinutes} minutes, ${spikeRatio.toFixed(1)}× its normal volume.`,
      } satisfies SourceDuplicateConflictAlert;
    })
    .filter((alert): alert is SourceDuplicateConflictAlert => alert !== null);
}

export type PartnerOnboardingIntake = {
  intakeEmail: string;
  expectedResponseWindow: string;
  requiredContactFields: string[];
  coverageAreaFields: string[];
  samplePriceFileRequirements: string[];
  acceptedFileTypes: string[];
  routingSteps: string[];
};

export const partnerOnboardingIntake: PartnerOnboardingIntake = {
  intakeEmail: "partners@groceryview.se",
  expectedResponseWindow: "2 business days",
  requiredContactFields: [
    "Retailer or store group name",
    "Primary feed contact name, role, email, and phone",
    "Technical contact for catalog, promotion, and inventory exports",
    "Preferred launch window and any embargo constraints",
  ],
  coverageAreaFields: [
    "Countries, regions, cities, or delivery zones covered by the feed",
    "Store formats included, such as supermarket, convenience, dark store, or online delivery",
    "Store identifiers that can be shared with shoppers and store identifiers that must stay internal",
    "Refresh cadence for prices, promotions, and availability",
  ],
  samplePriceFileRequirements: [
    "At least 50 representative rows with current price, currency, package size, and product identifiers",
    "Promotion examples with valid-from and valid-through dates when available",
    "A field dictionary for product IDs, store IDs, VAT, unit prices, and stock status",
    "A note describing whether the sample is synthetic, redacted, or production data",
  ],
  acceptedFileTypes: ["CSV", "XLSX", "JSON", "Parquet", "OpenAPI link"],
  routingSteps: [
    "Source health review confirms contact ownership and coverage boundaries.",
    "Data operations checks sample files for required price, unit, and freshness fields.",
    "A partner-specific import plan is created before any shopper-facing claim goes live.",
  ],
};

export type IngestionRunStatus = "running" | "succeeded" | "failed" | "partial";

export type IngestionRunRowCounts = {
  total: number;
  product: number;
  store: number;
  price: number;
  promotion: number;
  receipt: number;
  communityReport: number;
};

export type IngestionRunDiagnostic = {
  label: string;
  value: string;
};

export type IngestionRunHistoryItem = {
  sourceRunId: string;
  sourceName: string;
  sourceType: string;
  sourceUrl?: string;
  status: IngestionRunStatus;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  rowCounts: IngestionRunRowCounts;
  warnings: string[];
  diagnostics: IngestionRunDiagnostic[];
};

type IngestionRunHistoryDbRow = {
  id: string;
  source_type: string;
  source_name: string;
  source_url: string | null;
  started_at: string | Date;
  finished_at: string | Date | null;
  status: IngestionRunStatus;
  provenance: Record<string, unknown> | string | null;
  error_message: string | null;
  raw_record_count: string | number | bigint;
  product_record_count: string | number | bigint;
  store_record_count: string | number | bigint;
  price_record_count: string | number | bigint;
  promotion_record_count: string | number | bigint;
  receipt_record_count: string | number | bigint;
  community_report_record_count: string | number | bigint;
  latest_raw_record_at: string | Date | null;
};

type QueryExecutorLike = {
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
};

export type IngestionRunHistoryReadOptions = {
  limit?: number;
  now?: Date;
};

function numberFromDbCount(value: string | number | bigint) {
  return Number(value);
}

function isoFromDbDate(value: string | Date | null | undefined) {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function normalizeProvenance(value: IngestionRunHistoryDbRow["provenance"]) {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }
  return value;
}

function formatDiagnosticValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export function mapIngestionRunHistoryRow(row: IngestionRunHistoryDbRow, now = new Date()): IngestionRunHistoryItem {
  const startedAt = isoFromDbDate(row.started_at) ?? now.toISOString();
  const finishedAt = isoFromDbDate(row.finished_at);
  const latestRawRecordAt = isoFromDbDate(row.latest_raw_record_at);
  const startedMs = new Date(startedAt).getTime();
  const finishedMs = finishedAt ? new Date(finishedAt).getTime() : now.getTime();
  const durationMs = Number.isFinite(startedMs) && Number.isFinite(finishedMs) ? Math.max(0, finishedMs - startedMs) : undefined;
  const rowCounts = {
    total: numberFromDbCount(row.raw_record_count),
    product: numberFromDbCount(row.product_record_count),
    store: numberFromDbCount(row.store_record_count),
    price: numberFromDbCount(row.price_record_count),
    promotion: numberFromDbCount(row.promotion_record_count),
    receipt: numberFromDbCount(row.receipt_record_count),
    communityReport: numberFromDbCount(row.community_report_record_count),
  };
  const warnings: string[] = [];

  if (row.status === "failed") warnings.push(row.error_message ? `Failed: ${row.error_message}` : "Run failed without an error message.");
  if (row.status === "partial") warnings.push(row.error_message ? `Partial run: ${row.error_message}` : "Run completed with partial coverage.");
  if (row.status === "running" && !finishedAt) warnings.push("Run is still open in source_runs.");
  if (rowCounts.total === 0) warnings.push("No raw_records evidence is linked to this run yet.");

  const provenance = normalizeProvenance(row.provenance);
  const provenanceKeys = Object.keys(provenance).sort();

  return {
    sourceRunId: row.id,
    sourceName: row.source_name,
    sourceType: row.source_type,
    ...(row.source_url ? { sourceUrl: row.source_url } : {}),
    status: row.status,
    startedAt,
    ...(finishedAt ? { finishedAt } : {}),
    ...(durationMs !== undefined ? { durationMs } : {}),
    rowCounts,
    warnings,
    diagnostics: [
      { label: "Source run ID", value: row.id },
      { label: "Source URL", value: formatDiagnosticValue(row.source_url) },
      { label: "Latest raw record", value: formatDiagnosticValue(latestRawRecordAt) },
      { label: "Provenance keys", value: provenanceKeys.length > 0 ? provenanceKeys.join(", ") : "—" },
      { label: "Error message", value: formatDiagnosticValue(row.error_message) },
    ],
  };
}

export async function listIngestionRunHistoryFromDatabase(
  executor: QueryExecutorLike,
  options: IngestionRunHistoryReadOptions = {},
): Promise<IngestionRunHistoryItem[]> {
  const limit = Math.min(Math.max(options.limit ?? 25, 1), 100);
  const rows = await executor.query<IngestionRunHistoryDbRow>(
    `select sr.id,
            sr.source_type,
            sr.source_name,
            sr.source_url,
            sr.started_at,
            sr.finished_at,
            sr.status,
            sr.provenance,
            sr.error_message,
            count(rr.id) as raw_record_count,
            count(rr.id) filter (where rr.record_type = 'product') as product_record_count,
            count(rr.id) filter (where rr.record_type = 'store') as store_record_count,
            count(rr.id) filter (where rr.record_type = 'price') as price_record_count,
            count(rr.id) filter (where rr.record_type = 'promotion') as promotion_record_count,
            count(rr.id) filter (where rr.record_type = 'receipt') as receipt_record_count,
            count(rr.id) filter (where rr.record_type = 'community_report') as community_report_record_count,
            max(rr.created_at) as latest_raw_record_at
       from source_runs sr
       left join raw_records rr on rr.source_run_id = sr.id
      group by sr.id, sr.source_type, sr.source_name, sr.source_url, sr.started_at, sr.finished_at, sr.status, sr.provenance, sr.error_message
      order by sr.started_at desc, sr.id
      limit $1`,
    [limit],
  );

  const now = options.now ?? new Date();
  return rows.map((row) => mapIngestionRunHistoryRow(row, now));
}
