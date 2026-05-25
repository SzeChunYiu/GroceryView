import { getPriceFreshness, isStockFreshEnoughForTravel } from "./freshness";

export type SourceDuplicateSample = {
  source: string;
  windowMinutes: number;
  currentDuplicateLikeMatches: number;
  baselineDuplicateLikeMatches: number;
  sampledAt: string;
};

export type StockConfidenceState = "in-stock" | "uncertain" | "stale";

export type StockConfidenceInput = {
  isAvailable?: boolean | null;
  observedAt?: string | number | Date | null;
  sourceRetrievedAt?: string | number | Date | null;
  recentObservationCount?: number | null;
  now?: Date;
};

export type StockConfidenceIndicator = {
  state: StockConfidenceState;
  label: string;
  detail: string;
  ageInDays: number | null;
  shouldWarnBeforeTravel: boolean;
};

export function getStockConfidenceIndicator(input: StockConfidenceInput): StockConfidenceIndicator {
  const timestamp = input.observedAt ?? input.sourceRetrievedAt ?? null;
  const freshness = getPriceFreshness(timestamp, input.now);
  const hasRecentObservation = (input.recentObservationCount ?? 0) > 0 || timestamp !== null;

  if (freshness.isStale) {
    return {
      state: "stale",
      label: "Stale stock",
      detail: `${freshness.label}. Verify before travelling; stock may no longer match the source row.`,
      ageInDays: freshness.ageInDays,
      shouldWarnBeforeTravel: true,
    };
  }

  if (input.isAvailable === true && hasRecentObservation && isStockFreshEnoughForTravel(timestamp, input.now)) {
    return {
      state: "in-stock",
      label: "In-stock confidence",
      detail: `${freshness.label}. Recent source evidence reports this item available.`,
      ageInDays: freshness.ageInDays,
      shouldWarnBeforeTravel: false,
    };
  }

  return {
    state: "uncertain",
    label: "Stock uncertain",
    detail: input.isAvailable === false
      ? "Latest source evidence reports unavailable stock; check the store before travelling."
      : "Availability evidence is incomplete; check the store before travelling.",
    ageInDays: freshness.ageInDays,
    shouldWarnBeforeTravel: true,
  };
}

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
