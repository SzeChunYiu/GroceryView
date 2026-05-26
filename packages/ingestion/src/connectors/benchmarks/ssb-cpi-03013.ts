export type SsbCpi03013Vertical = 'grocery' | 'pharmacy' | 'fuel';

export type SsbCpi03013BenchmarkObservation = Readonly<{
  sourceId: 'SSB_CPI_03013';
  country: 'NO';
  vertical: SsbCpi03013Vertical;
  ecoicopCode: string;
  period: string;
  value: number;
  unit: string;
  observedAt: string;
}>;

export type FetchSsbCpi03013Options = Readonly<{
  fetchImpl?: typeof fetch;
  endpoint?: string;
  observedAt?: string;
  months?: number;
  ecoicopCodes?: readonly string[];
}>;

export type BenchmarkObservationQueryExecutor = Readonly<{
  query: (sql: string, params: readonly unknown[]) => Promise<unknown>;
}>;

type JsonStatDimension = Readonly<{
  category?: Readonly<{
    index?: Record<string, number>;
    label?: Record<string, string>;
    unit?: Record<string, { base?: string }>;
  }>;
}>;

type JsonStatDataset = Readonly<{
  id: readonly string[];
  size: readonly number[];
  dimension: Record<string, JsonStatDimension>;
  value?: Array<number | null>;
}>;

export const SSB_CPI_03013_SOURCE_ID = 'SSB_CPI_03013' as const;
export const SSB_CPI_03013_ENDPOINT = 'https://data.ssb.no/api/v0/no/table/03013';
export const SSB_CPI_03013_CRON = '17 5 12 * *';
export const SSB_CPI_03013_REGISTRY_STATUS = 'ingestion_ready' as const;

export const SSB_CPI_03013_DEFAULT_ECOICOP_CODES = ['01', '06.1.1', '07.2.2.1', '07.2.2.2', '07.2.2.3'] as const;

const ECOICOP_VERTICALS: Record<string, SsbCpi03013Vertical> = {
  '01': 'grocery',
  '06.1.1': 'pharmacy',
  '07.2.2.1': 'fuel',
  '07.2.2.2': 'fuel',
  '07.2.2.3': 'fuel'
};

export function buildSsbCpi03013RequestBody(months = 24, ecoicopCodes: readonly string[] = SSB_CPI_03013_DEFAULT_ECOICOP_CODES) {
  return {
    query: [
      { code: 'Konsumgrp', selection: { filter: 'item', values: ecoicopCodes } },
      { code: 'ContentsCode', selection: { filter: 'item', values: ['KpiIndMnd'] } },
      { code: 'Tid', selection: { filter: 'top', values: [String(Math.max(1, months))] } }
    ],
    response: { format: 'JSON-stat2' }
  };
}

function orderedCategoryCodes(dimension: JsonStatDimension): string[] {
  return Object.entries(dimension.category?.index ?? {})
    .sort((left, right) => left[1] - right[1])
    .map(([code]) => code);
}

function periodFromSsbMonth(value: string) {
  const match = value.match(/^(\d{4})M(0[1-9]|1[0-2])$/);
  return match ? `${match[1]}-${match[2]}` : '';
}

function unitFromDataset(dataset: JsonStatDataset) {
  return dataset.dimension.ContentsCode?.category?.unit?.KpiIndMnd?.base ?? 'index 2015=100';
}

export function parseSsbCpi03013JsonStat(dataset: JsonStatDataset, observedAt: string): SsbCpi03013BenchmarkObservation[] {
  const groupCodes = orderedCategoryCodes(dataset.dimension.Konsumgrp ?? {});
  const timeCodes = orderedCategoryCodes(dataset.dimension.Tid ?? {});
  const values = dataset.value ?? [];
  const timeCount = timeCodes.length;
  const rows: SsbCpi03013BenchmarkObservation[] = [];

  groupCodes.forEach((ecoicopCode, groupIndex) => {
    const vertical = ECOICOP_VERTICALS[ecoicopCode];
    if (!vertical) return;

    timeCodes.forEach((timeCode, timeIndex) => {
      const value = values[(groupIndex * timeCount) + timeIndex];
      const period = periodFromSsbMonth(timeCode);
      if (typeof value !== 'number' || !Number.isFinite(value) || !period) return;
      rows.push({
        sourceId: SSB_CPI_03013_SOURCE_ID,
        country: 'NO',
        vertical,
        ecoicopCode,
        period,
        value,
        unit: unitFromDataset(dataset),
        observedAt
      });
    });
  });

  return rows;
}

export async function fetchSsbCpi03013BenchmarkObservations(options: FetchSsbCpi03013Options = {}): Promise<SsbCpi03013BenchmarkObservation[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const endpoint = options.endpoint ?? SSB_CPI_03013_ENDPOINT;
  const observedAt = options.observedAt ?? new Date().toISOString();
  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify(buildSsbCpi03013RequestBody(options.months, options.ecoicopCodes))
  });
  if (!response.ok) throw new Error(`${SSB_CPI_03013_SOURCE_ID} request failed: ${response.status}`);
  return parseSsbCpi03013JsonStat(await response.json() as JsonStatDataset, observedAt);
}

export async function upsertSsbCpi03013BenchmarkObservations(
  executor: BenchmarkObservationQueryExecutor,
  rows: readonly SsbCpi03013BenchmarkObservation[]
): Promise<number> {
  for (const row of rows) {
    await executor.query(
      `insert into benchmark_observation (
        source_id,
        country,
        vertical,
        ecoicop_code,
        period,
        value,
        unit,
        observed_at
      ) values ($1, $2, $3, $4, $5, $6, $7, $8)
      on conflict on constraint benchmark_observation_pkey
      do update set
        value = excluded.value,
        unit = excluded.unit,
        observed_at = excluded.observed_at`,
      [
        row.sourceId,
        row.country,
        row.vertical,
        row.ecoicopCode,
        row.period,
        row.value,
        row.unit,
        row.observedAt
      ]
    );
  }
  return rows.length;
}

export async function fetchAndPersistSsbCpi03013BenchmarkObservations(
  executor: BenchmarkObservationQueryExecutor,
  options: FetchSsbCpi03013Options = {}
): Promise<{ fetched: number; persisted: number }> {
  const rows = await fetchSsbCpi03013BenchmarkObservations(options);
  return {
    fetched: rows.length,
    persisted: await upsertSsbCpi03013BenchmarkObservations(executor, rows)
  };
}
