import { createHash } from 'node:crypto';

export type PopularTimesDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type StoreBusynessLevel = 'quiet' | 'normal' | 'busy' | 'very_busy';

export type PopularTimesStoreInput = {
  storeId: string;
  name: string;
  brand?: string;
  googlePlaceId?: string;
  latitude?: number;
  longitude?: number;
};

export type PopularTimesObservation = {
  storeId: string;
  storeName: string;
  brand: string;
  googlePlaceId: string;
  day: PopularTimesDay;
  hour: number;
  popularityPercent: number;
  currentPopularityPercent: number | null;
  estimatedWaitMinutes: number;
  busynessLevel: StoreBusynessLevel;
  storeLocatorLabel: string;
  sourceUrl: string;
  retrievedAt: string;
  provenance: {
    source: 'google_popular_times';
    parserVersion: 'google-popular-times-v1';
    rawSnapshotRef: string;
  };
};

export type StoreLocatorPopularTimesBadge = {
  storeId: string;
  storeName: string;
  busynessLevel: StoreBusynessLevel;
  estimatedWaitMinutes: number;
  label: string;
  sourceUrl: string;
  retrievedAt: string;
};

export type FetchGooglePopularTimesOptions = {
  stores: PopularTimesStoreInput[];
  apiKey: string;
  endpointUrl?: string;
  fetchImpl?: typeof fetch;
  retrievedAt?: string;
};

type GooglePopularTimesPayload = {
  place_id?: unknown;
  placeId?: unknown;
  name?: unknown;
  current_popularity?: unknown;
  currentPopularity?: unknown;
  popular_times?: unknown;
  popularTimes?: unknown;
  wait_time?: unknown;
  waitTime?: unknown;
};

type PopularTimesDayPayload = {
  name?: unknown;
  day?: unknown;
  data?: unknown;
  hours?: unknown;
};

export const GOOGLE_POPULAR_TIMES_ENDPOINT = 'https://maps.googleapis.com/maps/api/place/details/json';

const DAYS: PopularTimesDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export async function fetchGooglePopularTimesForStores(options: FetchGooglePopularTimesOptions): Promise<PopularTimesObservation[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const observations: PopularTimesObservation[] = [];

  for (const store of options.stores) {
    if (!store.googlePlaceId) continue;
    const sourceUrl = buildGooglePopularTimesUrl(store.googlePlaceId, options.apiKey, options.endpointUrl);
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'application/json',
        'user-agent': 'GroceryView/0.1 popular-times-connector (+https://github.com/SzeChunYiu/GroceryView)'
      }
    });

    if (!response.ok) throw new Error(`Google popular-times request failed for ${store.storeId}: ${response.status}`);
    const body = await response.text();
    observations.push(...parseGooglePopularTimesPayload(JSON.parse(body) as GooglePopularTimesPayload, {
      store,
      sourceUrl,
      retrievedAt,
      rawSnapshotRef: `raw://google-popular-times/${contentHashFor(body)}`
    }));
  }

  return observations;
}

export function parseGooglePopularTimesPayload(
  payload: GooglePopularTimesPayload,
  context: {
    store: PopularTimesStoreInput;
    sourceUrl: string;
    retrievedAt: string;
    rawSnapshotRef?: string;
  }
): PopularTimesObservation[] {
  const placeId = text(payload.place_id) || text(payload.placeId) || context.store.googlePlaceId || '';
  if (!placeId) return [];

  const popularTimes = Array.isArray(payload.popular_times) ? payload.popular_times : payload.popularTimes;
  const rows = Array.isArray(popularTimes) ? popularTimes : [];
  const currentPopularityPercent = percentOrNull(payload.current_popularity ?? payload.currentPopularity);
  const rawSnapshotRef = context.rawSnapshotRef ?? `raw://google-popular-times/${placeId}-${context.retrievedAt}`;
  const storeName = context.store.name || text(payload.name);
  const brand = context.store.brand ?? brandFromStoreName(storeName);

  return rows.flatMap((row) => normalizePopularTimesDay(row as PopularTimesDayPayload)).map((slot) => {
    const popularityPercent = slot.popularityPercent;
    const effectivePopularity = currentPopularityPercent ?? popularityPercent;
    const busynessLevel = busynessLevelFor(effectivePopularity);
    const estimatedWaitMinutes = waitMinutesFor(effectivePopularity, payload.wait_time ?? payload.waitTime);

    return {
      storeId: context.store.storeId,
      storeName,
      brand,
      googlePlaceId: placeId,
      day: slot.day,
      hour: slot.hour,
      popularityPercent,
      currentPopularityPercent,
      estimatedWaitMinutes,
      busynessLevel,
      storeLocatorLabel: storeLocatorLabelFor(storeName, busynessLevel),
      sourceUrl: context.sourceUrl,
      retrievedAt: context.retrievedAt,
      provenance: {
        source: 'google_popular_times',
        parserVersion: 'google-popular-times-v1',
        rawSnapshotRef
      }
    };
  });
}

export function buildStoreLocatorPopularTimesBadges(
  observations: PopularTimesObservation[],
  now: Date = new Date()
): StoreLocatorPopularTimesBadge[] {
  const day = DAYS[(now.getUTCDay() + 6) % 7]!;
  const hour = now.getUTCHours();
  const latestByStore = new Map<string, PopularTimesObservation>();

  for (const observation of observations) {
    if (observation.day !== day || observation.hour !== hour) continue;
    const existing = latestByStore.get(observation.storeId);
    if (!existing || existing.retrievedAt < observation.retrievedAt) latestByStore.set(observation.storeId, observation);
  }

  return [...latestByStore.values()]
    .sort((a, b) => a.storeName.localeCompare(b.storeName, 'sv'))
    .map((observation) => ({
      storeId: observation.storeId,
      storeName: observation.storeName,
      busynessLevel: observation.busynessLevel,
      estimatedWaitMinutes: observation.estimatedWaitMinutes,
      label: observation.storeLocatorLabel,
      sourceUrl: observation.sourceUrl,
      retrievedAt: observation.retrievedAt
    }));
}

export function storeLocatorLabelFor(storeName: string, busynessLevel: StoreBusynessLevel): string {
  const status = busynessLevel === 'quiet'
    ? 'quiet'
    : busynessLevel === 'normal'
      ? 'normal'
      : busynessLevel === 'busy'
        ? 'busy'
        : 'very busy';
  return `Shop now: ${status} at ${storeName}`;
}

function buildGooglePopularTimesUrl(placeId: string, apiKey: string, endpointUrl = GOOGLE_POPULAR_TIMES_ENDPOINT): string {
  const url = new URL(endpointUrl);
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('fields', 'place_id,name,popular_times,current_popularity,wait_time');
  return url.toString();
}

function normalizePopularTimesDay(row: PopularTimesDayPayload): Array<{ day: PopularTimesDay; hour: number; popularityPercent: number }> {
  const day = dayFromValue(row.name ?? row.day);
  if (!day) return [];
  const data = Array.isArray(row.data) ? row.data : row.hours;
  if (!Array.isArray(data)) return [];

  return data
    .map((value, hour) => ({ day, hour, popularityPercent: percentOrNull(value) }))
    .filter((slot): slot is { day: PopularTimesDay; hour: number; popularityPercent: number } => slot.popularityPercent !== null && slot.hour >= 0 && slot.hour <= 23);
}

function busynessLevelFor(popularityPercent: number): StoreBusynessLevel {
  if (popularityPercent < 35) return 'quiet';
  if (popularityPercent < 65) return 'normal';
  if (popularityPercent < 85) return 'busy';
  return 'very_busy';
}

function waitMinutesFor(popularityPercent: number, explicitWaitTime: unknown): number {
  const explicit = numberOrNull(explicitWaitTime);
  if (explicit !== null && explicit >= 0) return Math.round(explicit);
  if (popularityPercent < 35) return 0;
  if (popularityPercent < 65) return 5;
  if (popularityPercent < 85) return 10;
  return 15;
}

function dayFromValue(value: unknown): PopularTimesDay | null {
  const normalized = text(value).toLowerCase();
  return DAYS.find((day) => normalized === day || normalized.startsWith(day.slice(0, 3))) ?? null;
}

function percentOrNull(value: unknown): number | null {
  const parsed = numberOrNull(value);
  if (parsed === null) return null;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function numberOrNull(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function brandFromStoreName(storeName: string): string {
  return storeName.split(/\s+/)[0] || '';
}

function contentHashFor(body: string): string {
  return createHash('sha256').update(body).digest('hex').slice(0, 24);
}
