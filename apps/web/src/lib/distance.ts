export type Coordinate = {
  lat: number;
  lng: number;
};

export type DistanceResult<T = Coordinate> = {
  record: T;
  distanceKm: number;
};

const EARTH_RADIUS_KM = 6_371;

function isFiniteCoordinate(value: number) {
  return Number.isFinite(value);
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function normalizeCoordinate(candidate: Coordinate): Coordinate | null {
  return isFiniteCoordinate(candidate.lat) && isFiniteCoordinate(candidate.lng)
    ? candidate
    : null;
}

export function haversineDistanceKm(left: Coordinate, right: Coordinate) {
  const leftPoint = normalizeCoordinate(left);
  const rightPoint = normalizeCoordinate(right);
  if (!leftPoint || !rightPoint) return null;

  const deltaLatitude = toRadians(rightPoint.lat - leftPoint.lat);
  const deltaLongitude = toRadians(rightPoint.lng - leftPoint.lng);
  const latitudeLeft = toRadians(leftPoint.lat);
  const latitudeRight = toRadians(rightPoint.lat);

  const a = Math.sin(deltaLatitude / 2) ** 2
    + Math.cos(latitudeLeft) * Math.cos(latitudeRight) * Math.sin(deltaLongitude / 2) ** 2;
  const angularDistance = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * angularDistance;
}

export function formatDistanceKm(distanceKm: number | null | undefined, unit: 'auto' | 'km' = 'auto') {
  if (distanceKm === null || distanceKm === undefined || !Number.isFinite(distanceKm)) return 'Not reported';

  const distanceKmValue = distanceKm;

  if (unit === 'km' || distanceKmValue === 0 || distanceKmValue >= 1) {
    return `${distanceKmValue.toFixed(distanceKmValue >= 10 ? 1 : 2)} km`;
  }

  return `${Math.round(distanceKmValue * 1_000)} m`;
}

export function nearestRecord<T extends Coordinate>(records: ReadonlyArray<T>, origin: Coordinate): DistanceResult<T> | null {
  let bestDistanceKm: number | null = null;
  let bestRecord: T | null = null;

  for (const record of records) {
    const distanceKm = haversineDistanceKm(origin, record);
    if (distanceKm === null) continue;
    if (bestDistanceKm === null || distanceKm < bestDistanceKm) {
      bestDistanceKm = distanceKm;
      bestRecord = record;
    }
  }

  return bestRecord && bestDistanceKm !== null ? { record: bestRecord, distanceKm: bestDistanceKm } : null;
}
