export type FreshnessLevel = "unknown" | "fresh" | "aging" | "stale";

export interface PriceFreshness {
  level: FreshnessLevel;
  label: string;
  ageInDays: number | null;
  refreshHint: string;
  isStale: boolean;
}

export type FreshnessBadgeTone = "neutral" | "positive" | "warning" | "critical";

export interface StoreReliabilityScore {
  feedFreshness: PriceFreshness;
  priceObservationCount: number;
  priceObservationLabel: string;
  expectedCategories: string[];
  observedCategories: string[];
  missingCategories: string[];
  missingCategoryWarning: string;
  scoreLabel: string;
  tone: "strong" | "limited" | "blocked";
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const AGING_AFTER_DAYS = 2;
const STALE_AFTER_DAYS = 7;
const DEFAULT_STORE_RELIABILITY_CATEGORIES = ["branch price feed"];

export function getScrapeAgeInDays(
  scrapedAt: string | number | Date | null | undefined,
  now: Date = new Date(),
): number | null {
  if (scrapedAt === null || scrapedAt === undefined || scrapedAt === "") {
    return null;
  }

  const scrapedDate = scrapedAt instanceof Date ? scrapedAt : new Date(scrapedAt);

  if (Number.isNaN(scrapedDate.getTime())) {
    return null;
  }

  return Math.max(0, Math.floor((now.getTime() - scrapedDate.getTime()) / DAY_IN_MS));
}

export function formatScrapeAge(ageInDays: number | null): string {
  if (ageInDays === null) {
    return "Unknown age";
  }

  if (ageInDays === 0) {
    return "Updated today";
  }

  if (ageInDays === 1) {
    return "Updated yesterday";
  }

  return `Updated ${ageInDays} days ago`;
}

export function getPriceFreshness(
  scrapedAt: string | number | Date | null | undefined,
  now: Date = new Date(),
): PriceFreshness {
  const ageInDays = getScrapeAgeInDays(scrapedAt, now);

  if (ageInDays === null) {
    return {
      level: "unknown",
      label: "Freshness unknown",
      ageInDays,
      refreshHint: "No scrape timestamp is available; verify this price before relying on it.",
      isStale: true,
    };
  }

  if (ageInDays >= STALE_AFTER_DAYS) {
    return {
      level: "stale",
      label: formatScrapeAge(ageInDays),
      ageInDays,
      refreshHint: "Stale price: refresh or rescrape this item to confirm the latest shelf price.",
      isStale: true,
    };
  }

  if (ageInDays >= AGING_AFTER_DAYS) {
    return {
      level: "aging",
      label: formatScrapeAge(ageInDays),
      ageInDays,
      refreshHint: "Price is getting old; refresh soon if this item is important.",
      isStale: false,
    };
  }

  return {
    level: "fresh",
    label: formatScrapeAge(ageInDays),
    ageInDays,
    refreshHint: "Recently refreshed price.",
    isStale: false,
  };
}

export function freshnessBadgeTone(level: FreshnessLevel): FreshnessBadgeTone {
  if (level === "fresh") return "positive";
  if (level === "aging") return "warning";
  if (level === "stale") return "critical";
  return "neutral";
}

export function freshnessBadgeAriaLabel(freshness: PriceFreshness, context = "Price freshness"): string {
  return `${context}: ${freshness.label}. ${freshness.refreshHint}`;
}

export function getStoreReliabilityScore({
  feedRetrievedAt,
  now = new Date(),
  observedCategories = [],
  priceObservationCount,
  expectedCategories = DEFAULT_STORE_RELIABILITY_CATEGORIES,
}: {
  feedRetrievedAt: string | number | Date | null | undefined;
  now?: Date;
  observedCategories?: string[];
  priceObservationCount: number;
  expectedCategories?: string[];
}): StoreReliabilityScore {
  const feedFreshness = getPriceFreshness(feedRetrievedAt, now);
  const observedCategorySet = new Set(observedCategories.map((category) => category.toLowerCase()));
  const missingCategories = expectedCategories.filter((category) => !observedCategorySet.has(category.toLowerCase()));
  const hasObservations = priceObservationCount > 0;
  const tone: StoreReliabilityScore["tone"] = feedFreshness.isStale || !hasObservations
    ? "blocked"
    : missingCategories.length > 0
      ? "limited"
      : "strong";

  return {
    feedFreshness,
    priceObservationCount,
    priceObservationLabel: `${priceObservationCount.toLocaleString("sv-SE")} price observations`,
    expectedCategories,
    observedCategories,
    missingCategories,
    missingCategoryWarning: missingCategories.length > 0
      ? `Missing categories: ${missingCategories.join(", ")}`
      : "No missing category warnings",
    scoreLabel: tone === "strong"
      ? "Trustworthy store comparison"
      : tone === "limited"
        ? "Limited category coverage"
        : "Store comparison blocked",
    tone,
  };
}
