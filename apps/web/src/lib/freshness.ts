export type FreshnessLevel = 'unknown' | 'fresh' | 'aging' | 'stale';

export interface PriceFreshness {
  level: FreshnessLevel;
  label: string;
  ageInDays: number | null;
  refreshHint: string;
  isStale: boolean;
}

export type StockSourceReliability = 'high' | 'medium' | 'low' | 'unknown';
export type StockConfidenceLevel = 'high' | 'medium' | 'low' | 'unknown';

export interface StockConfidenceInput {
  lastObservedAt?: string | number | Date | null;
  sourceReliability?: StockSourceReliability | number | null;
  source?: string | null;
  now?: Date;
}

export interface StockConfidence {
  level: StockConfidenceLevel;
  icon: string;
  label: string;
  ageInDays: number | null;
  sourceReliability: StockSourceReliability;
  isStale: boolean;
  description: string;
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const AGING_AFTER_DAYS = 2;
const STALE_AFTER_DAYS = 7;
const STOCK_AGING_AFTER_DAYS = 1;
const STOCK_STALE_AFTER_DAYS = 3;

export function getScrapeAgeInDays(
  scrapedAt: string | number | Date | null | undefined,
  now: Date = new Date(),
): number | null {
  if (scrapedAt === null || scrapedAt === undefined || scrapedAt === '') {
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
    return 'Unknown age';
  }

  if (ageInDays === 0) {
    return 'Updated today';
  }

  if (ageInDays === 1) {
    return 'Updated yesterday';
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
      level: 'unknown',
      label: 'Freshness unknown',
      ageInDays,
      refreshHint: 'No scrape timestamp is available; verify this price before relying on it.',
      isStale: true,
    };
  }

  if (ageInDays >= STALE_AFTER_DAYS) {
    return {
      level: 'stale',
      label: formatScrapeAge(ageInDays),
      ageInDays,
      refreshHint: 'Stale price: refresh or rescrape this item to confirm the latest shelf price.',
      isStale: true,
    };
  }

  if (ageInDays >= AGING_AFTER_DAYS) {
    return {
      level: 'aging',
      label: formatScrapeAge(ageInDays),
      ageInDays,
      refreshHint: 'Price is getting old; refresh soon if this item is important.',
      isStale: false,
    };
  }

  return {
    level: 'fresh',
    label: formatScrapeAge(ageInDays),
    ageInDays,
    refreshHint: 'Recently refreshed price.',
    isStale: false,
  };
}

export function getScanAgeInDays(
  observedAt: string | number | Date | null | undefined,
  now: Date = new Date(),
): number | null {
  return getScrapeAgeInDays(observedAt, now);
}

export function normalizeStockSourceReliability(
  reliability: StockConfidenceInput['sourceReliability'],
  source?: string | null,
): StockSourceReliability {
  if (typeof reliability === 'number') {
    if (reliability >= 0.8) return 'high';
    if (reliability >= 0.5) return 'medium';
    if (reliability >= 0) return 'low';
  }

  if (reliability === 'high' || reliability === 'medium' || reliability === 'low' || reliability === 'unknown') {
    return reliability;
  }

  const normalizedSource = source?.toLowerCase() ?? '';

  if (normalizedSource.includes('scan') || normalizedSource.includes('shelf')) {
    return 'high';
  }

  if (normalizedSource.includes('branch') || normalizedSource.includes('inventory')) {
    return 'medium';
  }

  return 'unknown';
}

export function getStockConfidence(input: StockConfidenceInput): StockConfidence {
  const ageInDays = getScanAgeInDays(input.lastObservedAt, input.now ?? new Date());
  const sourceReliability = normalizeStockSourceReliability(input.sourceReliability, input.source);
  const isStale = ageInDays === null || ageInDays >= STOCK_STALE_AFTER_DAYS;

  if (ageInDays === null || sourceReliability === 'unknown') {
    return {
      level: 'unknown',
      icon: '⚪',
      label: 'Stock confidence unknown',
      ageInDays,
      sourceReliability,
      isStale: true,
      description: 'No recent store scan is available; verify stock before relying on branch-level inventory.',
    };
  }

  if (isStale || sourceReliability === 'low') {
    return {
      level: 'low',
      icon: '🔴',
      label: 'Low stock confidence',
      ageInDays,
      sourceReliability,
      isStale: true,
      description: `${formatScrapeAge(ageInDays)} from a ${sourceReliability}-reliability source; confirm in store.`,
    };
  }

  if (ageInDays >= STOCK_AGING_AFTER_DAYS || sourceReliability === 'medium') {
    return {
      level: 'medium',
      icon: '🟡',
      label: 'Medium stock confidence',
      ageInDays,
      sourceReliability,
      isStale: false,
      description: `${formatScrapeAge(ageInDays)} from a ${sourceReliability}-reliability source.`,
    };
  }

  return {
    level: 'high',
    icon: '🟢',
    label: 'High stock confidence',
    ageInDays,
    sourceReliability,
    isStale: false,
    description: 'Observed today from a high-reliability store scan.',
  };
}
