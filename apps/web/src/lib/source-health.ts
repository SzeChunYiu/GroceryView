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

export type IngestionRunStatus = "succeeded" | "warning" | "failed" | "running";

export type IngestionRunRowCounts = {
  accepted: number;
  rejected: number;
  inserted: number;
  updated: number;
};

export type IngestionRunDiagnosticLink = {
  label: string;
  href: string;
  source: string;
};

export type IngestionRunHistoryEntry = {
  id: string;
  source: string;
  jobName: string;
  status: IngestionRunStatus;
  startedAt: string;
  finishedAt?: string;
  durationSeconds?: number;
  rowCounts: IngestionRunRowCounts;
  warnings: string[];
  diagnostics: IngestionRunDiagnosticLink[];
};

export type IngestionRunStatusSummary = {
  totalRuns: number;
  activeRuns: number;
  failedRuns: number;
  warningRuns: number;
  acceptedRows: number;
  rejectedRows: number;
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

export const ingestionRunHistory: IngestionRunHistoryEntry[] = [
  {
    id: "daily-2026-05-25-willys",
    source: "Willys",
    jobName: "willys-all-store-products",
    status: "succeeded",
    startedAt: "2026-05-25T02:00:12.000Z",
    finishedAt: "2026-05-25T02:18:46.000Z",
    durationSeconds: 1114,
    rowCounts: {
      accepted: 48231,
      rejected: 18,
      inserted: 1263,
      updated: 46968,
    },
    warnings: ["18 rows skipped because package size was incomplete."],
    diagnostics: [
      {
        label: "Connector diagnostics",
        href: "/admin/sources#willys",
        source: "willys",
      },
    ],
  },
  {
    id: "daily-2026-05-25-coop",
    source: "Coop",
    jobName: "coop-all-store-products",
    status: "warning",
    startedAt: "2026-05-25T02:20:04.000Z",
    finishedAt: "2026-05-25T02:47:19.000Z",
    durationSeconds: 1635,
    rowCounts: {
      accepted: 35904,
      rejected: 112,
      inserted: 732,
      updated: 35172,
    },
    warnings: [
      "Stockholm branch 0160 retried twice before succeeding.",
      "112 rows rejected for missing retailer product id.",
    ],
    diagnostics: [
      {
        label: "Connector diagnostics",
        href: "/admin/sources#coop",
        source: "coop",
      },
      {
        label: "Daily ingestion artifact",
        href: "/data-sources#coop",
        source: "coop",
      },
    ],
  },
  {
    id: "daily-2026-05-25-citygross",
    source: "City Gross",
    jobName: "citygross-public-products",
    status: "failed",
    startedAt: "2026-05-25T02:49:02.000Z",
    finishedAt: "2026-05-25T02:56:44.000Z",
    durationSeconds: 462,
    rowCounts: {
      accepted: 0,
      rejected: 0,
      inserted: 0,
      updated: 0,
    },
    warnings: ["Connector stopped after repeated upstream 503 responses."],
    diagnostics: [
      {
        label: "Connector diagnostics",
        href: "/admin/sources#citygross",
        source: "citygross",
      },
    ],
  },
  {
    id: "daily-2026-05-25-openfoodfacts",
    source: "Open Food Facts",
    jobName: "openfoodfacts-sweden-refresh",
    status: "running",
    startedAt: "2026-05-25T03:05:31.000Z",
    durationSeconds: 732,
    rowCounts: {
      accepted: 8120,
      rejected: 27,
      inserted: 344,
      updated: 7776,
    },
    warnings: [],
    diagnostics: [
      {
        label: "Source diagnostics",
        href: "/data-sources#openfoodfacts",
        source: "openfoodfacts",
      },
    ],
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

export function getIngestionRunHistory(
  runs: IngestionRunHistoryEntry[] = ingestionRunHistory,
): IngestionRunHistoryEntry[] {
  return [...runs].sort(
    (left, right) => Date.parse(right.startedAt) - Date.parse(left.startedAt),
  );
}

export function summarizeIngestionRuns(
  runs: IngestionRunHistoryEntry[] = ingestionRunHistory,
): IngestionRunStatusSummary {
  return runs.reduce<IngestionRunStatusSummary>(
    (summary, run) => ({
      totalRuns: summary.totalRuns + 1,
      activeRuns: summary.activeRuns + (run.status === "running" ? 1 : 0),
      failedRuns: summary.failedRuns + (run.status === "failed" ? 1 : 0),
      warningRuns: summary.warningRuns + (run.status === "warning" ? 1 : 0),
      acceptedRows: summary.acceptedRows + run.rowCounts.accepted,
      rejectedRows: summary.rejectedRows + run.rowCounts.rejected,
    }),
    {
      totalRuns: 0,
      activeRuns: 0,
      failedRuns: 0,
      warningRuns: 0,
      acceptedRows: 0,
      rejectedRows: 0,
    },
  );
}
