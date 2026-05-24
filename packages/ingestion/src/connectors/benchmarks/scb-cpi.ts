export type BenchmarkObservation = {
  sourceId: 'SCB_CPI';
  country: 'SE';
  vertical: 'overall' | 'food' | 'pharmaceutical' | 'fuel';
  ecoicopCode: string;
  period: string;
  value: number;
  unit: 'index_2020_100';
  observedAt: string;
};

export type BenchmarkSourceStatus = 'registry_only' | 'ingestion_ready' | 'live';

export const SCB_CPI_ENDPOINT = 'https://api.scb.se/OV0104/v1/doris/sv/ssd/START/PR/PR0101/PR0101A/KPI2020COICOPM';
export const SCB_CPI_CONTENT_CODE = '0000080H';

export const SCB_CPI_BENCHMARK_SOURCE = {
  sourceId: 'SCB_CPI',
  status: 'ingestion_ready',
  country: 'SE',
  frequency: 'monthly',
  endpoint: SCB_CPI_ENDPOINT
} as const;

export const benchmarkSourceRegistry = [SCB_CPI_BENCHMARK_SOURCE] as const;

export const SCB_CPI_SERIES = [
  { ecoicopCode: '00', vertical: 'overall' },
  { ecoicopCode: '01', vertical: 'food' },
  { ecoicopCode: '06.1', vertical: 'pharmaceutical' },
  { ecoicopCode: '07.2.2', vertical: 'fuel' }
] as const;

type JsonStatDimension = {
  category?: {
    index?: Record<string, number> | string[];
    label?: Record<string, string>;
  };
};

type JsonStatPayload = {
  id?: string[];
  size?: number[];
  updated?: string;
  value?: Array<number | null>;
  dimension?: Record<string, JsonStatDimension>;
};

export type FetchScbCpiOptions = {
  fetchImpl?: typeof fetch;
  endpoint?: string;
  ecoicopCodes?: readonly string[];
  topPeriods?: number;
  observedAt?: string;
};

export function buildScbCpiRequestBody(options: Pick<FetchScbCpiOptions, 'ecoicopCodes' | 'topPeriods'> = {}) {
  return {
    query: [
      {
        code: 'VaruTjanstegrupp',
        selection: { filter: 'item', values: [...(options.ecoicopCodes ?? SCB_CPI_SERIES.map((series) => series.ecoicopCode))] }
      },
      {
        code: 'ContentsCode',
        selection: { filter: 'item', values: [SCB_CPI_CONTENT_CODE] }
      },
      {
        code: 'Tid',
        selection: { filter: 'top', values: [String(options.topPeriods ?? 1)] }
      }
    ],
    response: { format: 'JSON-stat2' }
  };
}

export async function fetchScbCpiBenchmarkObservations(options: FetchScbCpiOptions = {}): Promise<BenchmarkObservation[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const endpoint = options.endpoint ?? SCB_CPI_ENDPOINT;
  const observedAt = options.observedAt ?? new Date().toISOString();
  const response = await fetchImpl(endpoint, {
    body: JSON.stringify(buildScbCpiRequestBody(options)),
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    },
    method: 'POST'
  });
  if (!response.ok) throw new Error(`SCB CPI request failed: ${response.status}`);
  return parseScbCpiJsonStat(await response.json() as JsonStatPayload, observedAt);
}

export function parseScbCpiJsonStat(payload: JsonStatPayload, observedAt: string): BenchmarkObservation[] {
  const ids = payload.id ?? [];
  const sizes = payload.size ?? [];
  const values = payload.value ?? [];
  const varuIndex = ids.indexOf('VaruTjanstegrupp');
  const tidIndex = ids.indexOf('Tid');
  const contentIndex = ids.indexOf('ContentsCode');
  if (varuIndex < 0 || tidIndex < 0 || contentIndex < 0) throw new Error('SCB CPI JSON-stat response missing required dimensions.');

  const ecoicopCodes = orderedCategoryKeys(payload.dimension?.VaruTjanstegrupp);
  const periods = orderedCategoryKeys(payload.dimension?.Tid).map(normalizeScbPeriod);
  const contentCodes = orderedCategoryKeys(payload.dimension?.ContentsCode);
  const contentPosition = contentCodes.indexOf(SCB_CPI_CONTENT_CODE);
  if (contentPosition < 0) return [];

  const rows: BenchmarkObservation[] = [];
  for (const series of SCB_CPI_SERIES) {
    const ecoicopPosition = ecoicopCodes.indexOf(series.ecoicopCode);
    if (ecoicopPosition < 0) continue;
    for (let periodPosition = 0; periodPosition < periods.length; periodPosition += 1) {
      const value = values[flatJsonStatIndex(sizes, [
        { dimension: varuIndex, position: ecoicopPosition },
        { dimension: contentIndex, position: contentPosition },
        { dimension: tidIndex, position: periodPosition }
      ])];
      if (typeof value !== 'number' || !Number.isFinite(value)) continue;
      rows.push({
        sourceId: 'SCB_CPI',
        country: 'SE',
        vertical: series.vertical,
        ecoicopCode: series.ecoicopCode,
        period: periods[periodPosition]!,
        value,
        unit: 'index_2020_100',
        observedAt
      });
    }
  }
  return rows;
}

export async function persistBenchmarkObservations(executor: { query: (sql: string, params?: unknown[]) => Promise<unknown> }, rows: readonly BenchmarkObservation[]): Promise<void> {
  if (rows.length === 0) return;
  await executor.query(
    `insert into benchmark_observation(source_id, country, vertical, ecoicop_code, period, value, unit, observed_at)
     select source_id, country, vertical, ecoicop_code, period, value, unit, observed_at
     from jsonb_to_recordset($1::jsonb) as x(source_id text, country text, vertical text, ecoicop_code text, period text, value numeric, unit text, observed_at timestamptz)
     on conflict (source_id, country, vertical, ecoicop_code, period) do update set
       value = excluded.value,
       unit = excluded.unit,
       observed_at = excluded.observed_at`,
    [JSON.stringify(rows.map((row) => ({
      source_id: row.sourceId,
      country: row.country,
      vertical: row.vertical,
      ecoicop_code: row.ecoicopCode,
      period: row.period,
      value: row.value,
      unit: row.unit,
      observed_at: row.observedAt
    })))]
  );
}

function orderedCategoryKeys(dimension: JsonStatDimension | undefined): string[] {
  const index = dimension?.category?.index;
  if (Array.isArray(index)) return index;
  if (index && typeof index === 'object') return Object.entries(index).sort((a, b) => a[1] - b[1]).map(([key]) => key);
  return [];
}

function flatJsonStatIndex(sizes: number[], coordinates: Array<{ dimension: number; position: number }>): number {
  const positions = Array(sizes.length).fill(0);
  for (const coordinate of coordinates) positions[coordinate.dimension] = coordinate.position;
  return positions.reduce((offset, position, dimension) => offset + position * sizes.slice(dimension + 1).reduce((product, size) => product * size, 1), 0);
}

function normalizeScbPeriod(value: string): string {
  return value.replace('M', '-');
}
