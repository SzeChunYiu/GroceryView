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

export interface NewArrivalSourceProduct {
  brand?: string | null;
  brands?: string | null;
  category?: string | null;
  lastObservedAt?: string | null;
  name: string;
  observationCount?: number | null;
  observations?: ReadonlyArray<{ date: string; price?: number | null }>;
  slug: string;
}

export interface NewArrivalFeedItem {
  brand: string;
  category: string;
  firstSeenAt: string;
  freshness: PriceFreshness;
  href: string;
  isFirstSeenInWindow: boolean;
  lastObservedAt: string;
  name: string;
  observationCount: number;
  slug: string;
  sourceLabel: string;
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const AGING_AFTER_DAYS = 2;
const STALE_AFTER_DAYS = 7;
const DEFAULT_STORE_RELIABILITY_CATEGORIES = ["branch price feed"];

function validIsoDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

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

export function buildNewArrivalFeed(
  products: readonly NewArrivalSourceProduct[],
  options: { categoryLabels?: Record<string, string>; limit?: number; windowDays?: number } = {},
): NewArrivalFeedItem[] {
  const limit = options.limit ?? 12;
  const windowDays = options.windowDays ?? 30;
  const rows = products.flatMap((product) => {
    const observationDates = (product.observations ?? [])
      .map((observation) => validIsoDate(observation.date))
      .filter((date): date is string => Boolean(date));
    const lastObservedAt = validIsoDate(product.lastObservedAt) ?? observationDates.at(-1);
    if (!lastObservedAt) return [];

    const firstSeenAt = observationDates.length > 0
      ? [...observationDates].sort((left, right) => left.localeCompare(right))[0]!
      : lastObservedAt;

    return [{
      product,
      firstSeenAt,
      firstSeenTime: Date.parse(`${firstSeenAt}T00:00:00.000Z`),
      lastObservedAt,
      lastObservedTime: Date.parse(`${lastObservedAt}T00:00:00.000Z`)
    }];
  });

  const latestObservedTime = rows.reduce((latest, row) => Math.max(latest, row.lastObservedTime), 0);
  const windowStartTime = latestObservedTime - windowDays * DAY_IN_MS;

  const mappedRows = rows.map((row) => {
      const category = row.product.category ?? 'grocery';
      const isFirstSeenInWindow = row.firstSeenTime >= windowStartTime;
      return {
        brand: row.product.brand ?? row.product.brands ?? 'Brand not reported',
        category: options.categoryLabels?.[category] ?? category,
        firstSeenAt: row.firstSeenAt,
        freshness: getPriceFreshness(row.lastObservedAt),
        href: `/products/${row.product.slug}`,
        isFirstSeenInWindow,
        lastObservedAt: row.lastObservedAt,
        name: row.product.name,
        observationCount: row.product.observationCount ?? row.product.observations?.length ?? 0,
        slug: row.product.slug,
        sourceLabel: isFirstSeenInWindow
          ? `First seen inside the latest ${windowDays}-day ingestion window`
          : `Latest observation is inside the ingestion window; first seen ${row.firstSeenAt}`
      } satisfies NewArrivalFeedItem;
    });
  const visibleRows = mappedRows.filter((item) => item.isFirstSeenInWindow || item.freshness.level === 'fresh' || item.freshness.level === 'aging');

  return (visibleRows.length > 0 ? visibleRows : mappedRows)
    .sort((left, right) =>
      right.firstSeenAt.localeCompare(left.firstSeenAt)
      || right.lastObservedAt.localeCompare(left.lastObservedAt)
      || left.name.localeCompare(right.name, 'sv')
    )
    .slice(0, limit);
}
