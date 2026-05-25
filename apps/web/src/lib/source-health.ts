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

export type RetailerSourceFreshnessInput = {
  name: string;
  rows: number;
  freshness: string;
};

export type RetailerFreshnessStatus = "fresh" | "stale" | "unknown";

export type RetailerFreshnessBannerRow = {
  affectedChains: string[];
  ageHours: number | null;
  lastSuccessfulIngestLabel: string;
  name: string;
  rowCount: number;
  staleAfterHours: number;
  status: RetailerFreshnessStatus;
  warning: string;
};

export const retailerFreshnessBannerAsOf = "2026-05-25T12:00:00.000Z";
export const retailerFreshnessStaleAfterHours = 48;

const sourceChainAliases: Array<{ match: RegExp; chains: string[] }> = [
  { match: /axfood|willys|hemk[oö]p/i, chains: ["Willys", "Hemköp"] },
  { match: /ica/i, chains: ["ICA"] },
  { match: /openprices/i, chains: ["OpenPrices community"] },
  { match: /openfoodfacts/i, chains: ["OpenFoodFacts metadata"] },
  { match: /okq8|fuel/i, chains: ["OKQ8"] },
  { match: /store directory|osm|sweden store/i, chains: ["OSM store directory"] },
];

function sourceChains(name: string) {
  return sourceChainAliases.find((alias) => alias.match.test(name))?.chains ?? [name];
}

function parseFreshnessTime(value: string) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatIngestLabel(value: string) {
  const parsed = parseFreshnessTime(value);
  if (parsed == null) return value || "Not reported";
  return new Date(parsed).toISOString();
}

export function buildRetailerFreshnessBanners(
  sources: RetailerSourceFreshnessInput[],
  options: { asOf?: string; staleAfterHours?: number } = {},
): RetailerFreshnessBannerRow[] {
  const asOf = Date.parse(options.asOf ?? retailerFreshnessBannerAsOf);
  const staleAfterHours = options.staleAfterHours ?? retailerFreshnessStaleAfterHours;

  return sources.map((source) => {
    const freshnessTime = parseFreshnessTime(source.freshness);
    const ageHours = freshnessTime == null ? null : Math.max(0, Math.round((asOf - freshnessTime) / (60 * 60 * 1000)));
    const status: RetailerFreshnessStatus = ageHours == null ? "unknown" : ageHours > staleAfterHours ? "stale" : "fresh";
    const affectedChains = sourceChains(source.name);

    return {
      affectedChains,
      ageHours,
      lastSuccessfulIngestLabel: formatIngestLabel(source.freshness),
      name: source.name,
      rowCount: source.rows,
      staleAfterHours,
      status,
      warning:
        status === "stale"
          ? `${affectedChains.join(", ")} data is stale; use caution before trusting current prices.`
          : status === "unknown"
            ? `${affectedChains.join(", ")} freshness is unknown; price trust is limited until ingest evidence is available.`
            : `${affectedChains.join(", ")} data is inside the freshness window.`,
    };
  });
}
