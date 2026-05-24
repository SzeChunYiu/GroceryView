type OsmType = 'node' | 'way' | 'relation';

export type FuelStationChain = 'Circle K' | 'OKQ8' | 'Preem' | 'St1' | 'Ingo' | 'Tanka' | 'Qstar' | 'Shell';

export type BrandedSwedishFuelStation = {
  osmType: OsmType;
  osmId: number;
  name: string;
  chain: FuelStationChain;
  brand: string;
  operator: string;
  amenity: 'fuel';
  latitude: number;
  longitude: number;
  street: string;
  houseNumber: string;
  postcode: string;
  city: string;
  openingHours: string;
  website: string;
  phone: string;
  sourceUrl: string;
  retrievedAt: string;
};

type OverpassElement = {
  type?: unknown;
  id?: unknown;
  lat?: unknown;
  lon?: unknown;
  center?: { lat?: unknown; lon?: unknown };
  tags?: Record<string, unknown>;
};

type OverpassResponse = {
  elements?: OverpassElement[];
};

export const BRANDED_SWEDISH_FUEL_STATION_CHAINS: FuelStationChain[] = ['Circle K', 'OKQ8', 'Preem', 'St1', 'Ingo', 'Tanka', 'Qstar', 'Shell'];

export const BRANDED_FUEL_STATIONS_OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

export const SWEDEN_BRANDED_FUEL_STATIONS_OVERPASS_QUERY = `[out:json][timeout:90];
area["ISO3166-1"="SE"][admin_level=2]->.searchArea;
(
${BRANDED_SWEDISH_FUEL_STATION_CHAINS.map((chain) => `  node["amenity"="fuel"]["brand"~"${escapeOverpassRegex(chain)}",i](area.searchArea);
  way["amenity"="fuel"]["brand"~"${escapeOverpassRegex(chain)}",i](area.searchArea);
  relation["amenity"="fuel"]["brand"~"${escapeOverpassRegex(chain)}",i](area.searchArea);
  node["amenity"="fuel"]["name"~"${escapeOverpassRegex(chain)}",i](area.searchArea);
  way["amenity"="fuel"]["name"~"${escapeOverpassRegex(chain)}",i](area.searchArea);
  relation["amenity"="fuel"]["name"~"${escapeOverpassRegex(chain)}",i](area.searchArea);
  node["amenity"="fuel"]["operator"~"${escapeOverpassRegex(chain)}",i](area.searchArea);
  way["amenity"="fuel"]["operator"~"${escapeOverpassRegex(chain)}",i](area.searchArea);
  relation["amenity"="fuel"]["operator"~"${escapeOverpassRegex(chain)}",i](area.searchArea);`).join('\n')}
);
out center tags 640;`;

export type FetchBrandedSwedishFuelStationsOptions = {
  fetchImpl?: typeof fetch;
  query?: string;
  retrievedAt?: string;
};

export async function fetchBrandedSwedishFuelStations(options: FetchBrandedSwedishFuelStationsOptions = {}): Promise<BrandedSwedishFuelStation[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const query = options.query ?? SWEDEN_BRANDED_FUEL_STATIONS_OVERPASS_QUERY;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const body = new URLSearchParams({ data: query });
  const response = await fetchImpl(BRANDED_FUEL_STATIONS_OVERPASS_URL, {
    method: 'POST',
    body,
    headers: {
      accept: 'application/json',
      'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'user-agent': 'GroceryView/0.1 fuel stations (https://github.com/SzeChunYiu/GroceryView)'
    }
  });

  if (!response.ok) {
    throw new Error(`Overpass branded fuel station request failed: ${response.status}`);
  }

  const payload = await response.json() as OverpassResponse;
  return parseBrandedSwedishFuelStations(payload, retrievedAt);
}

export function parseBrandedSwedishFuelStations(payload: OverpassResponse, retrievedAt: string): BrandedSwedishFuelStation[] {
  return (payload.elements ?? [])
    .map((element) => normalizeBrandedSwedishFuelStation(element, retrievedAt))
    .filter((station): station is BrandedSwedishFuelStation => station !== null);
}

export function normalizeBrandedSwedishFuelStation(element: OverpassElement, retrievedAt: string): BrandedSwedishFuelStation | null {
  const osmType = asOsmType(element.type);
  const osmId = typeof element.id === 'number' ? element.id : null;
  const tags = element.tags ?? {};
  const latitude = numberOrNull(element.lat) ?? numberOrNull(element.center?.lat);
  const longitude = numberOrNull(element.lon) ?? numberOrNull(element.center?.lon);
  const chain = normalizeFuelStationChain([tags.brand, tags.name, tags.operator]);

  if (!osmType || osmId === null || latitude === null || longitude === null || text(tags.amenity) !== 'fuel' || !chain) {
    return null;
  }

  const name = text(tags.name) || text(tags.brand) || text(tags.operator) || chain;

  return {
    osmType,
    osmId,
    name,
    chain,
    brand: text(tags.brand) || chain,
    operator: text(tags.operator),
    amenity: 'fuel',
    latitude,
    longitude,
    street: text(tags['addr:street']),
    houseNumber: text(tags['addr:housenumber']),
    postcode: text(tags['addr:postcode']),
    city: text(tags['addr:city']),
    openingHours: text(tags.opening_hours),
    website: text(tags.website) || text(tags['contact:website']),
    phone: text(tags.phone) || text(tags['contact:phone']),
    sourceUrl: BRANDED_FUEL_STATIONS_OVERPASS_URL,
    retrievedAt
  };
}

export function normalizeFuelStationChain(values: unknown[]): FuelStationChain | null {
  for (const value of values) {
    const raw = text(value);
    const chain = BRANDED_SWEDISH_FUEL_STATION_CHAINS.find((candidate) => new RegExp(escapeRegExp(candidate), 'i').test(raw));
    if (chain) return chain;
  }
  return null;
}

function asOsmType(value: unknown): OsmType | null {
  return value === 'node' || value === 'way' || value === 'relation' ? value : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeOverpassRegex(value: string): string {
  return escapeRegExp(value).replace(/"/g, '\\"');
}
