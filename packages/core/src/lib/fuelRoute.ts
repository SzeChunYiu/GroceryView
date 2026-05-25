export type FuelRoutePoint = {
  latitude: number;
  longitude: number;
  label?: string;
};

export type FuelRouteStation = FuelRoutePoint & {
  id: string;
  chain: string;
  name: string;
  pricePerLitre: number;
};

export type FuelRouteRecommendation = FuelRouteStation & {
  directRouteKm: number;
  detourCost: number;
  detourKm: number;
  fuelCost: number;
  routeViaStationKm: number;
  totalTripCost: number;
};

export type FuelRouteInput = {
  destination: FuelRoutePoint;
  detourCostPerKm: number;
  fuelNeededLitres: number;
  maxDetourKm: number;
  origin: FuelRoutePoint;
  stations: FuelRouteStation[];
};

const EARTH_RADIUS_KM = 6371;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function calculateFuelRouteDistanceKm(left: FuelRoutePoint, right: FuelRoutePoint): number {
  const latitudeDelta = toRadians(right.latitude - left.latitude);
  const longitudeDelta = toRadians(right.longitude - left.longitude);
  const leftLatitude = toRadians(left.latitude);
  const rightLatitude = toRadians(right.latitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(leftLatitude) * Math.cos(rightLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(haversine)));
}

export function calculateFuelRouteDetourCost(detourKm: number, costPerKm: number): number {
  return Math.max(0, detourKm) * Math.max(0, costPerKm);
}

export function rankCheapestFuelStationsByRoute(input: FuelRouteInput): FuelRouteRecommendation[] {
  const directRouteKm = calculateFuelRouteDistanceKm(input.origin, input.destination);

  return input.stations
    .map((station) => {
      const routeViaStationKm = calculateFuelRouteDistanceKm(input.origin, station)
        + calculateFuelRouteDistanceKm(station, input.destination);
      const detourKm = Math.max(0, routeViaStationKm - directRouteKm);
      const detourCost = calculateFuelRouteDetourCost(detourKm, input.detourCostPerKm);
      const fuelCost = station.pricePerLitre * Math.max(0, input.fuelNeededLitres);
      return {
        ...station,
        directRouteKm,
        detourCost,
        detourKm,
        fuelCost,
        routeViaStationKm,
        totalTripCost: fuelCost + detourCost
      } satisfies FuelRouteRecommendation;
    })
    .filter((station) => station.detourKm <= input.maxDetourKm)
    .sort((left, right) => left.totalTripCost - right.totalTripCost || left.detourKm - right.detourKm || left.name.localeCompare(right.name));
}
