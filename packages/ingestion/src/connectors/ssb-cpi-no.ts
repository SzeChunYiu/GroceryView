export const SSB_CPI_NO_SOURCE_ID = 'SSB_CPI_NO' as const;
export const SSB_CPI_NO_ENDPOINT = 'https://data.ssb.no/api/v0/no/table/03013';
export const SSB_CPI_NO_PARSER_VERSION = 'ssb-cpi-no-food-jsonstat-v1';
export const SSB_CPI_NO_FOOD_ECOICOP_CODES = ['01', '01.1', '01.2'] as const;

export type SsbCpiNoExternalIndexRow = {
  rowType: 'external_index';
  sourceId: typeof SSB_CPI_NO_SOURCE_ID;
  country: 'NO';
  authority: 'SSB';
  indexFamily: 'consumer_price_index';
  vertical: 'grocery';
  ecoicopCode: string;
  label: string;
  period: string;
  value: number;
  unit: string;
  sourceUrl: string;
  observedAt: string;
  provenance: {
    parserVersion: string;
    tableId: '03013';
    contentCode: 'KpiIndMnd';
  };
};

export type FetchSsbCpiNoExternalIndexOptions = {
  fetchImpl?: typeof fetch;
  endpoint?: string;
  observedAt?: string;
  months?: number;
  ecoicopCodes?: readonly string[];
};

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

export function buildSsbCpiNoRequestBody(months = 24, ecoicopCodes: readonly string[] = SSB_CPI_NO_FOOD_ECOICOP_CODES) {
  return {
    query: [
      { code: 'Konsumgrp', selection: { filter: 'item', values: ecoicopCodes } },
      { code: 'ContentsCode', selection: { filter: 'item', values: ['KpiIndMnd'] } },
      { code: 'Tid', selection: { filter: 'top', values: [String(Math.max(1, months))] } }
    ],
    response: { format: 'JSON-stat2' }
  };
}

export function parseSsbCpiNoExternalIndexRows(dataset: JsonStatDataset, observedAt: string, sourceUrl = SSB_CPI_NO_ENDPOINT): SsbCpiNoExternalIndexRow[] {
  const groupCodes = orderedCategoryCodes(dataset.dimension.Konsumgrp ?? {});
  const timeCodes = orderedCategoryCodes(dataset.dimension.Tid ?? {});
  const values = dataset.value ?? [];
  const unit = dataset.dimension.ContentsCode?.category?.unit?.KpiIndMnd?.base ?? 'index 2015=100';
  const rows: SsbCpiNoExternalIndexRow[] = [];

  groupCodes.forEach((ecoicopCode, groupIndex) => {
    if (!SSB_CPI_NO_FOOD_ECOICOP_CODES.includes(ecoicopCode as typeof SSB_CPI_NO_FOOD_ECOICOP_CODES[number])) return;
    timeCodes.forEach((timeCode, timeIndex) => {
      const value = values[(groupIndex * timeCodes.length) + timeIndex];
      const period = periodFromSsbMonth(timeCode);
      if (typeof value !== 'number' || !Number.isFinite(value) || !period) return;
      rows.push({
        rowType: 'external_index',
        sourceId: SSB_CPI_NO_SOURCE_ID,
        country: 'NO',
        authority: 'SSB',
        indexFamily: 'consumer_price_index',
        vertical: 'grocery',
        ecoicopCode,
        label: dataset.dimension.Konsumgrp?.category?.label?.[ecoicopCode] ?? ecoicopCode,
        period,
        value,
        unit,
        sourceUrl,
        observedAt,
        provenance: {
          parserVersion: SSB_CPI_NO_PARSER_VERSION,
          tableId: '03013',
          contentCode: 'KpiIndMnd'
        }
      });
    });
  });

  return rows;
}

export async function fetchSsbCpiNoExternalIndexRows(options: FetchSsbCpiNoExternalIndexOptions = {}): Promise<SsbCpiNoExternalIndexRow[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const endpoint = options.endpoint ?? SSB_CPI_NO_ENDPOINT;
  const observedAt = options.observedAt ?? new Date().toISOString();
  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'user-agent': 'GroceryView/0.1 ssb-cpi-no-connector (+https://github.com/SzeChunYiu/GroceryView)'
    },
    body: JSON.stringify(buildSsbCpiNoRequestBody(options.months, options.ecoicopCodes))
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`${SSB_CPI_NO_SOURCE_ID} source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`${SSB_CPI_NO_SOURCE_ID} request failed: ${response.status}`);
  return parseSsbCpiNoExternalIndexRows(await response.json() as JsonStatDataset, observedAt, endpoint);
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
