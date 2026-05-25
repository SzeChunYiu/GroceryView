export type EuAgriFoodApiRow = Readonly<{
  memberStateCode?: string;
  memberStateName?: string;
  beginDate?: string;
  endDate?: string;
  price?: string;
  unit?: string;
  periodType?: string;
  period?: number;
  year?: number;
  variety?: string;
  productStage?: string;
  market?: string;
  isCalculated?: string;
  isRegulated?: string;
}>;

export type EuAgriFoodBenchmarkObservation = Readonly<{
  sourceId: 'EU_AGRI_FOOD';
  country: 'SE';
  vertical: 'grocery';
  ecoicopCode: string;
  period: string;
  value: number;
  unit: string;
  observedAt: string;
}>;

export type FetchEuAgriFoodOptions = Readonly<{
  fetchImpl?: typeof fetch;
  endpoint?: string;
  observedAt?: string;
}>;

export const EU_AGRI_FOOD_SOURCE_ID = 'EU_AGRI_FOOD' as const;
export const EU_AGRI_FOOD_ENDPOINT = 'https://api.tech.ec.europa.eu/agrifood/api/fruitAndVegetable/pricesSupplyChain?memberStateCodes=SE';
export const EU_AGRI_FOOD_CRON = '17 5 * * 2';
export const EU_AGRI_FOOD_REGISTRY_STATUS = 'ingestion_ready' as const;

const DEFAULT_ECOICOP_CODE = '01.1';

function parseNumber(value: string | undefined) {
  const normalized = value?.trim().replace(/\s/g, '').replace(',', '.') ?? '';
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseEuDate(value: string | undefined) {
  const match = value?.trim().match(/^(\d{2})\/(\d{2})\/(20\d{2})$/);
  if (!match) return '';
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function normalizedProductStage(value: string | undefined) {
  const stage = value?.trim().toLowerCase().replace(/\s+/g, '_');
  return stage || 'upstream_agriculture';
}

function observationUnit(row: EuAgriFoodApiRow) {
  const unit = row.unit?.trim() || 'EUR upstream_agriculture';
  return unit.includes('upstream_agriculture') ? unit : `${unit} upstream_agriculture`;
}

export function parseEuAgriFoodRows(rows: readonly EuAgriFoodApiRow[], observedAt: string): EuAgriFoodBenchmarkObservation[] {
  return rows.flatMap((row): EuAgriFoodBenchmarkObservation[] => {
    if (row.memberStateCode && row.memberStateCode !== 'SE') return [];
    const value = parseNumber(row.price);
    const period = parseEuDate(row.beginDate);
    if (value === null || !period) return [];

    return [{
      sourceId: EU_AGRI_FOOD_SOURCE_ID,
      country: 'SE',
      vertical: 'grocery',
      ecoicopCode: DEFAULT_ECOICOP_CODE,
      period,
      value,
      unit: `${observationUnit(row)} ${normalizedProductStage(row.productStage)}`,
      observedAt
    }];
  });
}

function rowsFromPayload(payload: unknown): EuAgriFoodApiRow[] {
  if (Array.isArray(payload)) return payload.filter((row): row is EuAgriFoodApiRow => row !== null && typeof row === 'object');
  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: unknown[] }).data.filter((row): row is EuAgriFoodApiRow => row !== null && typeof row === 'object');
  }
  return [];
}

export async function fetchEuAgriFoodBenchmarkObservations(options: FetchEuAgriFoodOptions = {}): Promise<EuAgriFoodBenchmarkObservation[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const endpoint = options.endpoint ?? EU_AGRI_FOOD_ENDPOINT;
  const observedAt = options.observedAt ?? new Date().toISOString();
  const response = await fetchImpl(endpoint, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`EU_AGRI_FOOD request failed: ${response.status}`);
  return parseEuAgriFoodRows(rowsFromPayload(await response.json()), observedAt);
}
