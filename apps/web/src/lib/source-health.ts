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

export type ConnectorManagementStatus = "enabled" | "paused" | "watch";

export type ConnectorManagementConfig = {
  id: string;
  name: string;
  upstream: string;
  metadataOwner: string;
  escalationOwner: string;
  enabledMarkets: string[];
  freshnessThresholdHours: number;
  status: ConnectorManagementStatus;
  lastEditedAt: string;
  changeReason: string;
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

export const connectorManagementConfigs: ConnectorManagementConfig[] = [
  {
    id: "axfood-weekly",
    name: "Axfood weekly campaign connector",
    upstream: "Willys/Hemköp campaign feeds",
    metadataOwner: "ingestion-oncall@groceryview.example",
    escalationOwner: "retailer-sources@groceryview.example",
    enabledMarkets: ["SE"],
    freshnessThresholdHours: 36,
    status: "enabled",
    lastEditedAt: "2026-05-25T08:30:00.000Z",
    changeReason: "Weekly campaign rows are current and source URLs remain reachable.",
  },
  {
    id: "ica-store-promotions",
    name: "ICA store-scoped promotions",
    upstream: "handla.ica.se store-scoped campaign data",
    metadataOwner: "ica-ingestion@groceryview.example",
    escalationOwner: "retailer-sources@groceryview.example",
    enabledMarkets: ["SE"],
    freshnessThresholdHours: 24,
    status: "watch",
    lastEditedAt: "2026-05-25T08:45:00.000Z",
    changeReason: "Store-scoped coverage is live, but branch shelf-price claims remain blocked.",
  },
  {
    id: "openfoodfacts",
    name: "Open Food Facts enrichment",
    upstream: "Open Food Facts public product API",
    metadataOwner: "catalog-quality@groceryview.example",
    escalationOwner: "community-data@groceryview.example",
    enabledMarkets: ["SE", "NO", "DK", "FI"],
    freshnessThresholdHours: 168,
    status: "enabled",
    lastEditedAt: "2026-05-25T09:00:00.000Z",
    changeReason: "Nutrition and image enrichment can lag weekly without blocking price ingestion.",
  },
];

export function connectorManagementSummary(configs: ConnectorManagementConfig[] = connectorManagementConfigs) {
  return {
    total: configs.length,
    enabled: configs.filter((config) => config.status === "enabled").length,
    watch: configs.filter((config) => config.status === "watch").length,
    paused: configs.filter((config) => config.status === "paused").length,
    markets: [...new Set(configs.flatMap((config) => config.enabledMarkets))].sort(),
    shortestFreshnessThresholdHours: Math.min(...configs.map((config) => config.freshnessThresholdHours)),
  };
}

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
