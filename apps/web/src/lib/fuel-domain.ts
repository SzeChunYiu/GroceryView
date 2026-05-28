import { formatFuelPrice, verifiedFuelPriceObservations, verifiedFuelPriceSource } from '@/lib/fuel-prices';
import { fuelStations, fuelStationSource, type IngestedFuelStation } from '@/lib/ingested/fuel-stations';

export type FuelDomainSearchParams = Record<string, string | string[] | undefined>;

function firstValue(params: FuelDomainSearchParams, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function normalizedNeedle(value: string) {
  return value.trim().toLocaleLowerCase('sv-SE');
}

function stationAddress(station: IngestedFuelStation) {
  return [station.street, station.houseNumber, station.postcode, station.city].filter(Boolean).join(', ');
}

function supportedGradesLabel(station: IngestedFuelStation) {
  return station.supportedGradeIds?.length ? station.supportedGradeIds.join(', ') : 'Grade availability not tagged';
}

function stationMatchesQuery(station: IngestedFuelStation, query: string) {
  if (!query) return true;
  const haystack = [station.name, station.chain, station.brand, station.operator, station.city, stationAddress(station), supportedGradesLabel(station)]
    .join(' ')
    .toLocaleLowerCase('sv-SE');
  return haystack.includes(query);
}

function gradeMatchesQuery(row: (typeof verifiedFuelPriceObservations)[number], query: string) {
  if (!query) return true;
  return [row.label, row.grade, row.operatorName, row.productId]
    .join(' ')
    .toLocaleLowerCase('sv-SE')
    .includes(query);
}

export function buildFuelDomainSearchView(params: FuelDomainSearchParams = {}) {
  const query = normalizedNeedle(firstValue(params, 'q'));
  const requestedGrade = normalizedNeedle(firstValue(params, 'grade'));
  const gradeCards = verifiedFuelPriceObservations
    .filter((row) => (!requestedGrade || row.grade === requestedGrade || row.productId === requestedGrade) && gradeMatchesQuery(row, query))
    .map((row) => ({
      id: row.productId,
      label: row.label,
      grade: row.grade,
      operatorName: row.operatorName,
      priceLabel: formatFuelPrice(row.pricePerLitre),
      confidenceLabel: `${Math.round(row.confidence * 100)}% confidence`,
      freshnessLabel: row.observedAt.slice(0, 10),
      href: `/fuel?grade=${row.grade}`,
      sourceLabel: verifiedFuelPriceSource.name,
      sourceUrl: row.sourceUrl,
      limitation: 'Operator-level price guardrail: this is not a station-specific pump price.'
    }));
  const stationCards = fuelStations
    .filter((station) => stationMatchesQuery(station, query))
    .filter((station) => !requestedGrade || station.supportedGradeIds?.some((grade) => grade.includes(requestedGrade)))
    .slice(0, 6)
    .map((station) => ({
      osmId: station.osmId,
      name: station.name,
      chain: station.chain,
      address: stationAddress(station) || 'Address not tagged',
      gradeAvailability: supportedGradesLabel(station),
      href: `/fuel/stations/${station.osmId}`,
      mapHref: `/map?domain=fuel&station=${station.osmId}`,
      sourceLabel: fuelStationSource.source,
      freshnessLabel: station.retrievedAt.slice(0, 10),
      limitation: 'Location and grade availability evidence only; no station pump price inference.'
    }));

  return {
    query,
    domain: 'fuel' as const,
    resultCount: gradeCards.length + stationCards.length,
    gradeCards,
    operatorPriceCards: gradeCards,
    stationCards,
    evidenceSummary: `${gradeCards.length} operator price cards · ${stationCards.length} station cards · ${fuelStationSource.rowCount} OSM fuel station rows`,
    emptyState: 'No fuel rows matched this query. Try diesel, 95, OKQ8, or open the fuel station list.'
  };
}

export function buildFuelSelectedStationDetail(stationId: string | string[] | undefined) {
  const rawStationId = Array.isArray(stationId) ? stationId[0] : stationId;
  if (!rawStationId) return null;
  const station = fuelStations.find((candidate) => String(candidate.osmId) === rawStationId);
  if (!station) return null;

  return {
    station,
    title: `${station.name} fuel station evidence`,
    address: stationAddress(station) || 'Address not tagged',
    gradeAvailability: supportedGradesLabel(station),
    sourceLabel: fuelStationSource.source,
    freshnessLabel: station.retrievedAt.slice(0, 10),
    detailHref: `/fuel/stations/${station.osmId}`,
    watchlistHref: `/watchlist?domain=fuel&station=${station.osmId}`,
    guardrail: 'Selected fuel station detail uses an operator-level price guardrail: no station-specific pump price is shown without station-level source evidence.'
  };
}
