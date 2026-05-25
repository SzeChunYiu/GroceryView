export type FreshnessLevel = "unknown" | "fresh" | "aging" | "stale";
export type StockFreshnessStatus = "live" | "stale" | "inferred" | "unavailable";

export interface PriceFreshness {
  level: FreshnessLevel;
  label: string;
  ageInDays: number | null;
  refreshHint: string;
  isStale: boolean;
}

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

export interface StoreProductStockFreshness {
  status: StockFreshnessStatus;
  label: string;
  detail: string;
  ageInDays: number | null;
  actionable: boolean;
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

export function getStoreProductStockFreshness({
  availability,
  observedAt,
  now = new Date(),
}: {
  availability?: StockFreshnessStatus | boolean | null;
  observedAt?: string | number | Date | null;
  now?: Date;
}): StoreProductStockFreshness {
  const ageInDays = getScrapeAgeInDays(observedAt, now);

  if (availability === false || availability === "unavailable") {
    return {
      status: "unavailable",
      label: "Unavailable",
      detail: "Source marks this item unavailable for this store.",
      ageInDays,
      actionable: false,
    };
  }

  if (availability === "inferred" || (availability === undefined && ageInDays === null)) {
    return {
      status: "inferred",
      label: "Inferred availability",
      detail: "Availability is inferred from a priced row; verify before visiting.",
      ageInDays,
      actionable: true,
    };
  }

  if (availability === "stale" || (ageInDays !== null && ageInDays >= STALE_AFTER_DAYS)) {
    return {
      status: "stale",
      label: "Stale stock",
      detail: ageInDays === null ? "Stock evidence is stale." : `Last stock signal was ${ageInDays} days ago.`,
      ageInDays,
      actionable: false,
    };
  }

  return {
    status: "live",
    label: "Live stock",
    detail: ageInDays === null ? "Current store feed reports this item as available." : formatScrapeAge(ageInDays),
    ageInDays,
    actionable: true,
  };
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
