export const SHELL_NO_STATION_LOCATOR_URL = 'https://www.shell.no/bilister/shell-stasjoner.html';
export const SHELL_NO_CONNECTOR_VERSION = 'shell-no-store-locator-v1';

export type ShellNoFuelGrade = '95' | '98' | 'diesel' | 'adblue' | 'ev_charging' | 'unknown';

export type ShellNoStation = {
  id: string;
  name: string;
  chainId: 'shell-no';
  operatorName: 'Shell Norge';
  country: 'NO';
  address: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  fuelGrades: ShellNoFuelGrade[];
  hasSelectConvenience: boolean;
  services: string[];
  sourceUrl: string;
  capturedAt: string;
  provenance: {
    source: 'shell_no_locator';
    parserVersion: string;
    rawRecordId: string;
  };
};

export type FetchShellNoStationsOptions = {
  fetchImpl?: typeof fetch;
  capturedAt?: string;
  sourceUrl?: string;
};

type RawShellNoStation = Record<string, unknown>;

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function number(value: unknown) {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number.parseFloat(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry) => {
      if (typeof entry === 'string') return [entry.trim()].filter(Boolean);
      if (entry && typeof entry === 'object') return [text((entry as Record<string, unknown>).name ?? (entry as Record<string, unknown>).title ?? (entry as Record<string, unknown>).label)].filter(Boolean);
      return [];
    });
  }
  if (typeof value === 'string') return value.split(/[,|]/).map((entry) => entry.trim()).filter(Boolean);
  return [];
}

function fuelGrade(value: string): ShellNoFuelGrade {
  const normalized = value.toLowerCase();
  if (/\b98\b/.test(normalized)) return '98';
  if (/\b95\b|bensin/.test(normalized)) return '95';
  if (/diesel|truckdiesel/.test(normalized)) return 'diesel';
  if (/adblue/.test(normalized)) return 'adblue';
  if (/elbil|lading|charge|ev/.test(normalized)) return 'ev_charging';
  return 'unknown';
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function candidateRecords(payload: unknown): RawShellNoStation[] {
  let parsed = payload;
  if (typeof payload === 'string') {
    try {
      parsed = JSON.parse(payload) as unknown;
    } catch {
      return [];
    }
  }
  if (Array.isArray(parsed)) return parsed.filter((row): row is RawShellNoStation => row !== null && typeof row === 'object');
  if (!parsed || typeof parsed !== 'object') return [];
  const object = parsed as Record<string, unknown>;
  for (const key of ['stations', 'sites', 'locations', 'results', 'data']) {
    const value = object[key];
    if (Array.isArray(value)) return value.filter((row): row is RawShellNoStation => row !== null && typeof row === 'object');
  }
  return [];
}

export function parseShellNoStations(
  payload: unknown,
  options: { capturedAt: string; sourceUrl?: string } = { capturedAt: new Date().toISOString() }
): ShellNoStation[] {
  const sourceUrl = options.sourceUrl ?? SHELL_NO_STATION_LOCATOR_URL;

  return candidateRecords(payload)
    .map((record) => {
      const country = text(record.country ?? record.countryCode ?? record.market).toUpperCase();
      const services = unique([
        ...stringList(record.services),
        ...stringList(record.amenities),
        ...stringList(record.facilities)
      ]);
      const fuels = unique([
        ...stringList(record.fuels),
        ...stringList(record.fuelTypes),
        ...stringList(record.products)
      ].map(fuelGrade));
      const id = text(record.id ?? record.siteId ?? record.stationId ?? record.slug);
      const name = text(record.name ?? record.siteName ?? record.title);
      const address = text(record.address ?? record.streetAddress ?? record.street);
      const city = text(record.city ?? record.postalTown ?? record.town);

      if (country && country !== 'NO') return null;
      if (!id || !name) return null;

      return {
        id,
        name,
        chainId: 'shell-no' as const,
        operatorName: 'Shell Norge' as const,
        country: 'NO' as const,
        address,
        ...(city ? { city } : {}),
        ...(number(record.latitude ?? record.lat) !== undefined ? { latitude: number(record.latitude ?? record.lat) } : {}),
        ...(number(record.longitude ?? record.lng ?? record.lon) !== undefined ? { longitude: number(record.longitude ?? record.lng ?? record.lon) } : {}),
        fuelGrades: fuels.length > 0 ? fuels : ['unknown' as const],
        hasSelectConvenience: services.some((service) => /shell\s*select|\bselect\b|convenience|butikk/i.test(service)),
        services,
        sourceUrl,
        capturedAt: options.capturedAt,
        provenance: {
          source: 'shell_no_locator' as const,
          parserVersion: SHELL_NO_CONNECTOR_VERSION,
          rawRecordId: id
        }
      } satisfies ShellNoStation;
    })
    .filter((station): station is ShellNoStation => station !== null);
}

export async function fetchShellNoStations(options: FetchShellNoStationsOptions = {}): Promise<ShellNoStation[]> {
  const sourceUrl = options.sourceUrl ?? SHELL_NO_STATION_LOCATOR_URL;
  const capturedAt = options.capturedAt ?? new Date().toISOString();
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'application/json,text/html',
      'user-agent': 'GroceryView/0.1 Shell NO connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 429) {
    throw new Error(`Shell NO locator source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Shell NO locator request failed with HTTP ${response.status}.`);

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('json') ? await response.json() : await response.text();
  return parseShellNoStations(payload, { capturedAt, sourceUrl });
}
