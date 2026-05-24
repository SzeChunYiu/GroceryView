export type BenchmarkObservation = {
  source_id: 'EU_AGRI_FOOD';
  country: 'SE';
  vertical: 'grocery';
  ecoicop_code: string;
  period: string;
  value: number;
  unit: string;
  observed_at: string;
};

export type FetchEuAgriFoodOptions = {
  fetchImpl?: typeof fetch;
  endpointUrl?: string;
  observedAt?: string;
};

export const EU_AGRI_FOOD_SOURCE_ID = 'EU_AGRI_FOOD';
export const EU_AGRI_FOOD_ENDPOINT_URL = 'https://api.tech.ec.europa.eu/agrifood/fruitandvegetables/prices';
export const EU_AGRI_FOOD_FREQUENCY = 'weekly';

export async function fetchEuAgriFoodBenchmarkObservations(options: FetchEuAgriFoodOptions = {}): Promise<BenchmarkObservation[]> {
  const endpointUrl = options.endpointUrl ?? EU_AGRI_FOOD_ENDPOINT_URL;
  const observedAt = options.observedAt ?? new Date().toISOString();
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(endpointUrl, {
    headers: {
      accept: 'application/json',
      'user-agent': 'GroceryView/0.1 eu-agri-food-benchmark (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`EU agri-food benchmark source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`EU agri-food benchmark request failed with HTTP ${response.status}`);
  return parseEuAgriFoodBenchmarkObservations(await response.json(), observedAt);
}

export function parseEuAgriFoodBenchmarkObservations(payload: unknown, observedAt: string): BenchmarkObservation[] {
  return rawRows(payload)
    .map((row) => normalizeEuAgriFoodRow(row, observedAt))
    .filter((row): row is BenchmarkObservation => row !== null);
}

export function normalizeEuAgriFoodRow(row: Record<string, unknown>, observedAt: string): BenchmarkObservation | null {
  const country = text(row.memberStateCode, row.countryCode, row.country, row.memberState);
  if (!/^SE|Sweden|Sverige$/i.test(country)) return null;

  const stage = text(row.productStage, row.stage, row.priceStage, row.marketStage);
  if (/retail|consumer|shelf/i.test(stage)) return null;

  const value = number(row.value, row.price, row.priceValue, row.amount);
  const period = periodFrom(row.beginDate, row.period, row.date, row.referencePeriod);
  const unit = text(row.unit, row.unitOfMeasure, row.uom, row.currency) || 'EUR/100kg';
  if (value === null || !period) return null;

  return {
    source_id: EU_AGRI_FOOD_SOURCE_ID,
    country: 'SE',
    vertical: 'grocery',
    ecoicop_code: text(row.ecoicop_code, row.ecoicopCode, row.coicop, row.productCode) || '01.1',
    period,
    value,
    unit,
    observed_at: observedAt
  };
}

function rawRows(payload: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (!isRecord(payload)) return [];
  for (const key of ['data', 'items', 'results', 'records', 'content']) {
    const value = payload[key];
    if (Array.isArray(value)) return value.filter(isRecord);
  }
  return [payload];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function text(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function number(...values: unknown[]): number | null {
  for (const value of values) {
    const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.replace(',', '.')) : Number.NaN;
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function periodFrom(...values: unknown[]): string | null {
  const value = text(...values);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value) || /^\d{4}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : null;
}
