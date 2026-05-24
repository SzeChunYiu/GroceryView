export type FuelRouteCoordinate = {
  latitude: number;
  longitude: number;
};

export type FuelRouteRequest = {
  origin: FuelRouteCoordinate;
  destination: FuelRouteCoordinate;
  maxDetourKm: number;
  litres: number;
  detourCostPerKm: number;
};

export type FuelRouteStationCandidate = FuelRouteCoordinate & {
  stationId: string;
  stationName: string;
  chain: string;
  pricePerLitre: number;
  fuelGrade: string;
  source: string;
  sourceConfidence: number;
};

export type FuelRouteRecommendation = {
  station: FuelRouteStationCandidate;
  directDistanceKm: number;
  viaStationDistanceKm: number;
  detourKm: number;
  fuelCost: number;
  detourCost: number;
  totalCost: number;
};

export type FuelRouteOptimization = {
  status: 'found' | 'no_station_within_detour';
  directDistanceKm: number;
  maxDetourKm: number;
  recommendations: FuelRouteRecommendation[];
  cheapest?: FuelRouteRecommendation;
};

const earthRadiusKm = 6371;
const roundOne = (value: number): number => Math.round((value + Number.EPSILON) * 10) / 10;
const roundMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;
const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

export function haversineDistanceKm(a: FuelRouteCoordinate, b: FuelRouteCoordinate): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return roundOne(2 * earthRadiusKm * Math.asin(Math.sqrt(h)));
}

export function calculateFuelRouteDetourKm(origin: FuelRouteCoordinate, destination: FuelRouteCoordinate, station: FuelRouteCoordinate): number {
  const direct = haversineDistanceKm(origin, destination);
  const viaStation = haversineDistanceKm(origin, station) + haversineDistanceKm(station, destination);
  return roundOne(Math.max(0, viaStation - direct));
}

export function calculateDetourCost(detourKm: number, detourCostPerKm: number): number {
  return roundMoney(Math.max(0, detourKm) * Math.max(0, detourCostPerKm));
}

export function recommendCheapestFuelRoute(
  request: FuelRouteRequest,
  stations: FuelRouteStationCandidate[],
  options: { limit?: number; minimumConfidence?: number } = {}
): FuelRouteOptimization {
  const directDistanceKm = haversineDistanceKm(request.origin, request.destination);
  const minimumConfidence = options.minimumConfidence ?? 0.6;
  const recommendations = stations
    .filter((station) => station.pricePerLitre > 0 && station.sourceConfidence >= minimumConfidence)
    .map<FuelRouteRecommendation>((station) => {
      const originToStation = haversineDistanceKm(request.origin, station);
      const stationToDestination = haversineDistanceKm(station, request.destination);
      const viaStationDistanceKm = roundOne(originToStation + stationToDestination);
      const detourKm = roundOne(Math.max(0, viaStationDistanceKm - directDistanceKm));
      const fuelCost = roundMoney(station.pricePerLitre * Math.max(0, request.litres));
      const detourCost = calculateDetourCost(detourKm, request.detourCostPerKm);
      return {
        station,
        directDistanceKm,
        viaStationDistanceKm,
        detourKm,
        fuelCost,
        detourCost,
        totalCost: roundMoney(fuelCost + detourCost)
      };
    })
    .filter((result) => result.detourKm <= request.maxDetourKm)
    .sort((a, b) => a.totalCost - b.totalCost || a.detourKm - b.detourKm || a.station.pricePerLitre - b.station.pricePerLitre)
    .slice(0, options.limit ?? 8);

  return {
    status: recommendations.length > 0 ? 'found' : 'no_station_within_detour',
    directDistanceKm,
    maxDetourKm: request.maxDetourKm,
    recommendations,
    cheapest: recommendations[0]
  };
}
