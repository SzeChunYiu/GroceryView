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
