export const N1_IS_FUEL_PRICES_URL = 'https://www.n1.is/eldsneyti/eldsneytisverd/';
export const N1_IS_FUEL_PRICE_PARSER_VERSION = 'n1-is-fuel-prices-v1';

export type N1FuelGradeId = 'fuel-95' | 'fuel-diesel';
export type N1FuelObservation = {
  domain: 'fuel';
  productId: N1FuelGradeId;
  fuelGrade: '95' | 'diesel';
  gradeLabel: string;
  chainId: 'n1-is';
  operatorName: 'N1';
  stationId: string;
  stationName: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  sourceUrl: string;
  observedAt: string;
  capturedAt: string;
  pricePerLitre: number;
  currency: 'ISK';
  unit: 'l';
  confidence: number;
  provenance: {
    source: 'n1_is_fuel_prices';
    parserVersion: string;
    rawSnapshotRef: string;
    originalGrade: string;
    originalPrice: string;
  };
};

export type FetchN1FuelPricesOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  capturedAt?: string;
  rawSnapshotRef?: string;
};

type N1Fixture = {
  lastUpdated?: unknown;
  stations?: unknown;
};

type N1StationFixture = {
  id?: unknown;
  name?: unknown;
  address?: unknown;
  latitude?: unknown;
  lat?: unknown;
  longitude?: unknown;
  lon?: unknown;
  lng?: unknown;
  prices?: unknown;
};

const GRADE_MAP: Record<string, { productId: N1FuelGradeId; fuelGrade: N1FuelObservation['fuelGrade']; gradeLabel: string }> = {
  '95': { productId: 'fuel-95', fuelGrade: '95', gradeLabel: 'Bensín 95' },
  bensin95: { productId: 'fuel-95', fuelGrade: '95', gradeLabel: 'Bensín 95' },
  gasoline95: { productId: 'fuel-95', fuelGrade: '95', gradeLabel: 'Bensín 95' },
  diesel: { productId: 'fuel-diesel', fuelGrade: 'diesel', gradeLabel: 'Dísel' },
  disel: { productId: 'fuel-diesel', fuelGrade: 'diesel', gradeLabel: 'Dísel' }
};

export class N1FuelSourceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'N1FuelSourceError';
  }
}

export async function fetchN1FuelPrices(options: FetchN1FuelPricesOptions = {}): Promise<N1FuelObservation[]> {
  const sourceUrl = options.sourceUrl ?? N1_IS_FUEL_PRICES_URL;
  const capturedAt = options.capturedAt ?? new Date().toISOString();
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'application/json,text/html;q=0.9',
      'user-agent': 'GroceryView/0.1 n1-is-fuel-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });

  if (!response.ok) {
    throw new N1FuelSourceError(`N1 fuel request failed: ${response.status}`);
  }

  return parseN1FuelPrices({
    body: await response.text(),
    sourceUrl,
    capturedAt,
    rawSnapshotRef: options.rawSnapshotRef
  });
}

export function parseN1FuelPrices(input: {
  body: string;
  sourceUrl?: string;
  capturedAt: string;
  rawSnapshotRef?: string;
  parserVersion?: string;
}): N1FuelObservation[] {
  const sourceUrl = input.sourceUrl ?? N1_IS_FUEL_PRICES_URL;
  const parserVersion = input.parserVersion ?? N1_IS_FUEL_PRICE_PARSER_VERSION;
  const payload = extractFixture(input.body);
  const observedAt = isoTimestamp(payload.lastUpdated) ?? input.capturedAt;
  const stations = Array.isArray(payload.stations) ? payload.stations as N1StationFixture[] : [];
  const rows: N1FuelObservation[] = [];

  for (const station of stations) {
    const stationId = stringValue(station.id);
    const stationName = stringValue(station.name);
    if (!stationId || !stationName || !isRecord(station.prices)) continue;

    for (const [rawGrade, rawPrice] of Object.entries(station.prices)) {
      const grade = GRADE_MAP[normaliseGrade(rawGrade)];
      const pricePerLitre = parseIcelandicKronur(rawPrice);
      if (!grade || pricePerLitre == null) continue;

      rows.push({
        domain: 'fuel',
        productId: grade.productId,
        fuelGrade: grade.fuelGrade,
        gradeLabel: grade.gradeLabel,
        chainId: 'n1-is',
        operatorName: 'N1',
        stationId,
        stationName,
        address: stringValue(station.address),
        latitude: numberValue(station.latitude ?? station.lat),
        longitude: numberValue(station.longitude ?? station.lon ?? station.lng),
        sourceUrl,
        observedAt,
        capturedAt: input.capturedAt,
        pricePerLitre,
        currency: 'ISK',
        unit: 'l',
        confidence: 0.8,
        provenance: {
          source: 'n1_is_fuel_prices',
          parserVersion,
          rawSnapshotRef: input.rawSnapshotRef ?? `raw://n1-is/${hashCode(input.body)}`,
          originalGrade: rawGrade,
          originalPrice: String(rawPrice)
        }
      });
    }
  }

  if (rows.length === 0) throw new N1FuelSourceError('No N1 fuel price rows found in fixture.');
  return rows.sort((a, b) => a.stationId.localeCompare(b.stationId) || a.productId.localeCompare(b.productId));
}

function extractFixture(body: string): N1Fixture {
  const trimmed = body.trim();
  const jsonText = trimmed.startsWith('{') ? trimmed : trimmed.match(/<script[^>]+id=["']__N1_FUEL_FIXTURE__["'][^>]*>([\s\S]*?)<\/script>/i)?.[1]?.trim();
  if (!jsonText) throw new N1FuelSourceError('N1 fixture JSON was not found.');
  try {
    return JSON.parse(jsonText) as N1Fixture;
  } catch (error) {
    throw new N1FuelSourceError(`N1 fixture JSON could not be parsed: ${(error as Error).message}`);
  }
}

function parseIcelandicKronur(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? round(value) : null;
  if (typeof value !== 'string') return null;
  const parsed = Number(value.replace(/[^\d,.-]/g, '').replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? round(parsed) : null;
}

function isoTimestamp(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.replace(',', '.')) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function normaliseGrade(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function hashCode(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(16);
}
