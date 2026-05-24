export type FreshnessLevel = "unknown" | "fresh" | "aging" | "stale";

export interface PriceFreshness {
  level: FreshnessLevel;
  label: string;
  ageInDays: number | null;
  refreshHint: string;
  isStale: boolean;
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const AGING_AFTER_DAYS = 2;
const STALE_AFTER_DAYS = 7;

export const DEFAULT_STALE_PRICE_THRESHOLD_DAYS = 14;
export const STALE_PRICE_THRESHOLD_DAYS_ENV = "GROCERYVIEW_STALE_PRICE_THRESHOLD_DAYS";

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

export type StalePriceArchiveExecutor = {
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
};

export type StalePriceArchiveResult = {
  archivedCount: number;
  cutoffAt: string;
  thresholdDays: number;
};

type StalePriceArchiveRow = {
  archived_count: string | number;
  cutoff_at: string | Date;
};

function numberFromEnv(value: string | undefined): number | null {
  if (value === undefined || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function stalePriceThresholdDays(env: Record<string, string | undefined> = process.env): number {
  return numberFromEnv(env[STALE_PRICE_THRESHOLD_DAYS_ENV]) ?? DEFAULT_STALE_PRICE_THRESHOLD_DAYS;
}

export function stalePriceCutoffDate(asOf: Date = new Date(), thresholdDays = stalePriceThresholdDays()): Date {
  return new Date(asOf.getTime() - thresholdDays * DAY_IN_MS);
}

function iso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

/**
 * Marks old grocery latest-price rows unavailable so existing best-price reads
 * that filter on `is_available` stop ranking stale observations by default.
 */
export async function archiveStalePrices(
  executor: StalePriceArchiveExecutor,
  options: { asOf?: Date; thresholdDays?: number } = {},
): Promise<StalePriceArchiveResult> {
  const asOf = options.asOf ?? new Date();
  const thresholdDays = options.thresholdDays ?? stalePriceThresholdDays();
  const cutoffAt = stalePriceCutoffDate(asOf, thresholdDays).toISOString();

  const rows = await executor.query<StalePriceArchiveRow>(
    `with archived as (
       update latest_prices
          set is_available = false,
              updated_at = now(),
              provenance = coalesce(latest_prices.provenance, '{}'::jsonb)
                || jsonb_build_object(
                  'staleAutoArchivedAt', $2::timestamptz,
                  'staleAutoArchiveCutoffAt', $1::timestamptz,
                  'staleAutoArchiveThresholdDays', $3::int
                )
        where latest_prices.domain = 'grocery'
          and coalesce(latest_prices.is_available, true) = true
          and latest_prices.observed_at < $1::timestamptz
        returning latest_prices.id
     )
     select count(*)::int as archived_count, $1::timestamptz as cutoff_at
       from archived`,
    [cutoffAt, asOf.toISOString(), thresholdDays],
  );

  const row = rows[0];

  return {
    archivedCount: Number(row?.archived_count ?? 0),
    cutoffAt: iso(row?.cutoff_at ?? cutoffAt),
    thresholdDays,
  };
}
