export type FreshnessLevel = "unknown" | "fresh" | "aging" | "stale";
export type StoreStockStatus = "likely_in_stock" | "uncertain" | "unavailable";

export interface PriceFreshness {
  level: FreshnessLevel;
  label: string;
  ageInDays: number | null;
  refreshHint: string;
  isStale: boolean;
}

export interface StoreStockStatusInput {
  isAvailable?: boolean | null;
  observedAt?: string | number | Date | null;
  scrapedAt?: string | number | Date | null;
  sourceSignals?: readonly string[];
  sourceStockStatus?: string | null;
}

export interface StoreStockStatusBadge {
  status: StoreStockStatus;
  label: string;
  tone: "green" | "amber" | "red";
  ageInDays: number | null;
  reason: string;
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const AGING_AFTER_DAYS = 2;
const STALE_AFTER_DAYS = 7;
const STOCK_RECENT_AFTER_DAYS = 2;

function stockSignalText(input: StoreStockStatusInput): string {
  return [input.sourceStockStatus, ...(input.sourceSignals ?? [])]
    .filter((signal): signal is string => typeof signal === "string" && signal.trim().length > 0)
    .join(" ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
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

export function getStoreStockStatus(
  input: StoreStockStatusInput,
  now: Date = new Date(),
): StoreStockStatusBadge {
  const ageInDays = getScrapeAgeInDays(input.observedAt ?? input.scrapedAt, now);
  const sourceSignals = stockSignalText(input);

  if (
    input.isAvailable === false
    || /\b(out[-\s]?of[-\s]?stock|slut|unavailable|not available|sold out|discontinued)\b/.test(sourceSignals)
  ) {
    return {
      status: "unavailable",
      label: "Unavailable",
      tone: "red",
      ageInDays,
      reason: "Source availability or recent observations indicate this store row is not currently shopper-ready.",
    };
  }

  if (
    input.isAvailable === true
    || /\b(in[-\s]?stock|available|i lager|pa lager)\b/.test(sourceSignals)
  ) {
    if (ageInDays !== null && ageInDays <= STOCK_RECENT_AFTER_DAYS) {
      return {
        status: "likely_in_stock",
        label: "Likely in stock",
        tone: "green",
        ageInDays,
        reason: "Recent source evidence says the product was available at this store.",
      };
    }

    return {
      status: "uncertain",
      label: "Stock uncertain",
      tone: "amber",
      ageInDays,
      reason: "Availability was positive, but the observation is old or missing a timestamp.",
    };
  }

  return {
    status: "uncertain",
    label: "Stock uncertain",
    tone: "amber",
    ageInDays,
    reason: "No recent source availability signal is available for this store row.",
  };
}
