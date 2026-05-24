export type BenchmarkObservationRow = {
  source_id: 'SSB_CPI_03013';
  country: 'NO';
  vertical: string;
  ecoicop_code: string;
  period: string;
  value: number;
  unit: string;
  observed_at: string;
};

type SsbJsonStatDimension = {
  category?: {
    index?: Record<string, number>;
    label?: Record<string, string>;
  };
};

type SsbJsonStatResponse = {
  id?: string[];
  size?: number[];
  value?: Array<number | null>;
  dimension?: Record<string, SsbJsonStatDimension>;
};

export type FetchSsbCpi03013Options = {
  fetchImpl?: typeof fetch;
  endpoint?: string;
  observedAt?: string;
  ecoicopCodes?: readonly string[];
  periods?: readonly string[];
};

export const SSB_CPI_03013_SOURCE_ID = 'SSB_CPI_03013';
export const SSB_CPI_03013_ENDPOINT = 'https://data.ssb.no/api/v0/no/table/03013';
export const DEFAULT_SSB_CPI_03013_CODES = ['01', '06.1', '07.2.2'] as const;

export function buildSsbCpi03013Request(input: { ecoicopCodes?: readonly string[]; periods?: readonly string[] } = {}) {
  return {
    query: [
      { code: 'Konsumgrp', selection: { filter: 'item', values: [...(input.ecoicopCodes ?? DEFAULT_SSB_CPI_03013_CODES)] } },
      { code: 'ContentsCode', selection: { filter: 'item', values: ['KpiIndMnd'] } },
      input.periods?.length
        ? { code: 'Tid', selection: { filter: 'item', values: [...input.periods] } }
        : { code: 'Tid', selection: { filter: 'top', values: ['24'] } }
    ],
    response: { format: 'JSON-stat2' }
  };
}

export async function fetchSsbCpi03013(options: FetchSsbCpi03013Options = {}): Promise<BenchmarkObservationRow[]> {
  const endpoint = options.endpoint ?? SSB_CPI_03013_ENDPOINT;
  const response = await (options.fetchImpl ?? fetch)(endpoint, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json', 'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)' },
    body: JSON.stringify(buildSsbCpi03013Request({ ecoicopCodes: options.ecoicopCodes, periods: options.periods }))
  });
  if (!response.ok) throw new Error(`SSB CPI 03013 request failed: ${response.status}`);
  return parseSsbCpi03013(await response.json() as SsbJsonStatResponse, options.observedAt ?? new Date().toISOString());
}

export function parseSsbCpi03013(payload: SsbJsonStatResponse, observedAt: string): BenchmarkObservationRow[] {
  const ids = payload.id ?? [];
  const sizes = payload.size ?? [];
  const values = payload.value ?? [];
  const groupIndex = ids.indexOf('Konsumgrp');
  const timeIndex = ids.indexOf('Tid');
  if (groupIndex === -1 || timeIndex === -1) return [];

  const groups = orderedCategoryKeys(payload.dimension?.Konsumgrp);
  const periods = orderedCategoryKeys(payload.dimension?.Tid);
  const rows: BenchmarkObservationRow[] = [];
  for (let groupOffset = 0; groupOffset < groups.length; groupOffset += 1) {
    for (let periodOffset = 0; periodOffset < periods.length; periodOffset += 1) {
      const coords = sizes.map(() => 0);
      coords[groupIndex] = groupOffset;
      coords[timeIndex] = periodOffset;
      const flatIndex = flattenIndex(coords, sizes);
      const value = values[flatIndex];
      if (typeof value !== 'number' || !Number.isFinite(value)) continue;
      rows.push({
        source_id: SSB_CPI_03013_SOURCE_ID,
        country: 'NO',
        vertical: verticalForEcoicop(groups[groupOffset]!),
        ecoicop_code: groups[groupOffset]!,
        period: normalizeSsbPeriod(periods[periodOffset]!),
        value,
        unit: 'index',
        observed_at: observedAt
      });
    }
  }
  return rows;
}

function orderedCategoryKeys(dimension: SsbJsonStatDimension | undefined): string[] {
  const index = dimension?.category?.index ?? {};
  return Object.entries(index).sort((left, right) => left[1] - right[1]).map(([key]) => key);
}

function flattenIndex(coords: number[], sizes: number[]): number {
  let index = 0;
  for (let i = 0; i < coords.length; i += 1) {
    const stride = sizes.slice(i + 1).reduce((product, size) => product * size, 1);
    index += coords[i]! * stride;
  }
  return index;
}

function normalizeSsbPeriod(period: string): string {
  return period.replace(/^([0-9]{4})M([0-9]{2})$/, '$1-$2');
}

function verticalForEcoicop(code: string): string {
  if (code.startsWith('01')) return 'food';
  if (code.startsWith('06')) return 'pharmacy';
  if (code.startsWith('07.2')) return 'fuel';
  return 'consumer_prices';
}
