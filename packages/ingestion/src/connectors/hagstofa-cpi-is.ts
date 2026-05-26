export type HagstofaCpiIsVertical = 'grocery';

export type HagstofaCpiIsExternalIndexRow = Readonly<{
  rowType: 'external_index';
  sourceId: 'HAGSTOFA_CPI_IS';
  country: 'IS';
  vertical: HagstofaCpiIsVertical;
  coicopCode: string;
  coicopLabel: string;
  period: string;
  value: number;
  unit: string;
  observedAt: string;
  sourceUrl: string;
}>;

export type FetchHagstofaCpiIsOptions = Readonly<{
  fetchImpl?: typeof fetch;
  endpoint?: string;
  observedAt?: string;
  months?: number;
  subindexCodes?: readonly string[];
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

export const HAGSTOFA_CPI_IS_SOURCE_ID = 'HAGSTOFA_CPI_IS' as const;
export const HAGSTOFA_CPI_IS_ENDPOINT = 'https://px.hagstofa.is/pxen/api/v1/en/Efnahagur/visitolur/1_vnv/2_undirvisitolur/VIS01300.px';
export const HAGSTOFA_CPI_IS_CRON = '23 6 30 * *';
export const HAGSTOFA_CPI_IS_REGISTRY_STATUS = 'ingestion_ready' as const;
export const HAGSTOFA_CPI_IS_DEFAULT_SUBINDEX_CODES = ['CP01', 'CP011', 'CP012'] as const;

export function buildHagstofaCpiIsRequestBody(months = 24, subindexCodes: readonly string[] = HAGSTOFA_CPI_IS_DEFAULT_SUBINDEX_CODES) {
  return {
    query: [
      { code: 'Month', selection: { filter: 'top', values: [String(Math.max(1, months))] } },
      { code: 'Item', selection: { filter: 'item', values: ['index'] } },
      { code: 'Subindex', selection: { filter: 'item', values: subindexCodes } }
    ],
    response: { format: 'JSON-stat2' }
  };
}

export function parseHagstofaCpiIsJsonStat(dataset: JsonStatDataset, observedAt: string, sourceUrl = HAGSTOFA_CPI_IS_ENDPOINT): HagstofaCpiIsExternalIndexRow[] {
  const monthCodes = orderedCategoryCodes(dataset.dimension.Month ?? {});
  const itemCodes = orderedCategoryCodes(dataset.dimension.Item ?? {});
  const subindexCodes = orderedCategoryCodes(dataset.dimension.Subindex ?? {});
  const values = dataset.value ?? [];
  const unit = unitFromDataset(dataset);
  const rows: HagstofaCpiIsExternalIndexRow[] = [];

  monthCodes.forEach((monthCode, monthIndex) => {
    const period = periodFromPxMonth(monthCode);
    if (!period) return;

    itemCodes.forEach((itemCode, itemIndex) => {
      if (itemCode !== 'index') return;

      subindexCodes.forEach((coicopCode, subindexIndex) => {
        if (!HAGSTOFA_CPI_IS_DEFAULT_SUBINDEX_CODES.includes(coicopCode as typeof HAGSTOFA_CPI_IS_DEFAULT_SUBINDEX_CODES[number])) return;
        const value = values[valueOffset(dataset, [monthIndex, itemIndex, subindexIndex])];
        if (typeof value !== 'number' || !Number.isFinite(value)) return;
        rows.push({
          rowType: 'external_index',
          sourceId: HAGSTOFA_CPI_IS_SOURCE_ID,
          country: 'IS',
          vertical: 'grocery',
          coicopCode,
          coicopLabel: dataset.dimension.Subindex?.category?.label?.[coicopCode] ?? coicopCode,
          period,
          value,
          unit,
          observedAt,
          sourceUrl
        });
      });
    });
  });

  return rows;
}

export async function fetchHagstofaCpiIsExternalIndexRows(options: FetchHagstofaCpiIsOptions = {}): Promise<HagstofaCpiIsExternalIndexRow[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const endpoint = options.endpoint ?? HAGSTOFA_CPI_IS_ENDPOINT;
  const observedAt = options.observedAt ?? new Date().toISOString();
  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify(buildHagstofaCpiIsRequestBody(options.months, options.subindexCodes))
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`${HAGSTOFA_CPI_IS_SOURCE_ID} source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`${HAGSTOFA_CPI_IS_SOURCE_ID} request failed: ${response.status}`);
  return parseHagstofaCpiIsJsonStat(await response.json() as JsonStatDataset, observedAt, endpoint);
}

function orderedCategoryCodes(dimension: JsonStatDimension): string[] {
  return Object.entries(dimension.category?.index ?? {})
    .sort((left, right) => left[1] - right[1])
    .map(([code]) => code);
}

function valueOffset(dataset: JsonStatDataset, indexes: readonly number[]): number {
  let offset = 0;
  for (let index = 0; index < indexes.length; index += 1) {
    const stride = dataset.size.slice(index + 1).reduce((product, size) => product * size, 1);
    offset += indexes[index]! * stride;
  }
  return offset;
}

function periodFromPxMonth(value: string): string {
  const match = value.match(/^(\d{4})M(0[1-9]|1[0-2])$/);
  return match ? `${match[1]}-${match[2]}` : '';
}

function unitFromDataset(dataset: JsonStatDataset): string {
  return dataset.dimension.Item?.category?.unit?.index?.base ?? 'index, May 1988=100';
}
