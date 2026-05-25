import { osmStoreOpeningHoursLabel, type OsmStore } from './osm-stores';

export type ShopperLocation = {
  lat: number;
  lng: number;
};

export type PreferredPickupMode = 'any' | 'full-basket' | 'quick-trip';

export type NearestStoreCandidate = {
  distanceKm: number;
  distanceLabel: string;
  matchesPickupMode: boolean;
  openingLabel: string;
  openNow: boolean | null;
  pickupModeLabel: string;
  store: OsmStore;
};

const DAY_CODES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function distanceKmBetween(from: ShopperLocation, to: Pick<OsmStore, 'lat' | 'lng'>): number {
  const earthRadiusKm = 6371;
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatStoreDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

function minutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function dayMatches(token: string, date: Date): boolean {
  const today = DAY_CODES[date.getDay()];
  if (token.includes('-')) {
    const [start, end] = token.split('-');
    const startIndex = DAY_CODES.indexOf(start);
    const endIndex = DAY_CODES.indexOf(end);
    const todayIndex = DAY_CODES.indexOf(today);
    if (startIndex === -1 || endIndex === -1) return false;
    return startIndex <= endIndex
      ? todayIndex >= startIndex && todayIndex <= endIndex
      : todayIndex >= startIndex || todayIndex <= endIndex;
  }
  return token === today;
}

function openingHoursMatchToday(rule: string, date: Date): boolean {
  const dayPart = rule.match(/\b(Mo|Tu|We|Th|Fr|Sa|Su)(?:-(Mo|Tu|We|Th|Fr|Sa|Su))?\b/g);
  if (!dayPart) return true;
  return dayPart.some((token) => dayMatches(token, date));
}

function isOpenForTimeWindow(rule: string, date: Date): boolean | null {
  const label = rule.trim();
  if (!label || /not reported/i.test(label)) return null;
  if (/24\s*\/\s*7/.test(label)) return true;
  if (/\boff\b/i.test(label)) return false;
  if (!openingHoursMatchToday(label, date)) return false;

  const timeRanges = [...label.matchAll(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/g)];
  if (timeRanges.length === 0) return null;

  const now = minutesSinceMidnight(date);
  return timeRanges.some((match) => {
    const start = Number(match[1]) * 60 + Number(match[2]);
    const end = Number(match[3]) * 60 + Number(match[4]);
    return start <= end ? now >= start && now <= end : now >= start || now <= end;
  });
}

export function storePickupModeLabel(store: Pick<OsmStore, 'format' | 'shop'>): string {
  if (store.shop === 'convenience' || /convenience/i.test(store.format)) return 'Quick top-up';
  return 'Full-basket store';
}

function matchesPickupMode(store: Pick<OsmStore, 'format' | 'shop'>, preferredMode: PreferredPickupMode): boolean {
  if (preferredMode === 'any') return true;
  const quickTrip = store.shop === 'convenience' || /convenience/i.test(store.format);
  return preferredMode === 'quick-trip' ? quickTrip : !quickTrip;
}

export function rankNearestStores(
  stores: OsmStore[],
  origin: ShopperLocation,
  options: { limit?: number; now?: Date; openNowOnly?: boolean; preferredPickupMode?: PreferredPickupMode } = {}
): NearestStoreCandidate[] {
  const now = options.now ?? new Date();
  const preferredPickupMode = options.preferredPickupMode ?? 'any';

  return stores
    .filter((store) => Number.isFinite(store.lat) && Number.isFinite(store.lng))
    .map((store) => {
      const openingLabel = osmStoreOpeningHoursLabel(store);
      const openNow = isOpenForTimeWindow(openingLabel, now);
      const distanceKm = distanceKmBetween(origin, store);
      return {
        distanceKm,
        distanceLabel: formatStoreDistance(distanceKm),
        matchesPickupMode: matchesPickupMode(store, preferredPickupMode),
        openingLabel,
        openNow,
        pickupModeLabel: storePickupModeLabel(store),
        store
      };
    })
    .filter((candidate) => candidate.matchesPickupMode)
    .filter((candidate) => !options.openNowOnly || candidate.openNow === true)
    .sort((left, right) => {
      const leftOpenScore = left.openNow === true ? 0 : left.openNow === null ? 1 : 2;
      const rightOpenScore = right.openNow === true ? 0 : right.openNow === null ? 1 : 2;
      return left.distanceKm - right.distanceKm || leftOpenScore - rightOpenScore || left.store.name.localeCompare(right.store.name, 'sv');
    })
    .slice(0, options.limit ?? 6);
}
