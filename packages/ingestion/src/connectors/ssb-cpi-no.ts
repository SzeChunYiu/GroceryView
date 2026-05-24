export type SsbCpiNoSelectionFilter = 'item' | 'top' | 'all';
export type SsbCpiNoResponseFormat = 'JSON-stat2';
export type SsbCpiNoQueryVariableCode = 'VareTjenesteGrp' | 'ContentsCode' | 'Tid';

export type SsbCpiNoQueryVariable = {
  code: SsbCpiNoQueryVariableCode;
  selection: {
    filter: SsbCpiNoSelectionFilter;
    values: string[];
  };
};

export type SsbCpiNoQueryPayload = {
  query: SsbCpiNoQueryVariable[];
  response: { format: SsbCpiNoResponseFormat };
};

export type SsbCpiNoExternalIndexRow = {
  source: 'SSB';
  countryCode: 'NO';
  tableId: typeof SSB_CPI_NO_TABLE_ID;
  externalIndexId: string;
  categoryCode: string;
  categoryLabel: string;
  contentCode: typeof SSB_CPI_NO_INDEX_CONTENT_CODE;
  contentLabel: string;
  period: string;
  value: number;
  unit: 'index';
  basePeriod: '2025=100';
  sourceUrl: string;
  retrievedAt: string;
  sourceUpdatedAt: string | null;
  emitsStorePrices: false;
  emitsSkuPrices: false;
};

type JsonStatCategoryDimension = {
  label?: string;
  category?: {
    index?: Record<string, number>;
    label?: Record<string, string>;
    unit?: Record<string, { base?: string; decimals?: number }>;
  };
};

type SsbJsonStat2Dataset = {
  label?: string;
  source?: string;
  updated?: string;
  id?: string[];
  size?: number[];
  value?: Array<number | null>;
  dimension?: Record<string, JsonStatCategoryDimension>;
};

export const SSB_CPI_NO_TABLE_ID = '14700';
export const SSB_CPI_NO_ENDPOINT = `https://data.ssb.no/api/v0/en/table/${SSB_CPI_NO_TABLE_ID}`;
export const SSB_CPI_NO_SOURCE_URL = `https://www.ssb.no/en/statbank/table/${SSB_CPI_NO_TABLE_ID}`;
export const SSB_CPI_NO_INDEX_CONTENT_CODE = 'KpiIndMnd';
export const SSB_CPI_NO_FOOD_CATEGORY_CODE = '01';
export const SSB_CPI_NO_DEFAULT_TOP_MONTHS = 12;

export function buildSsbCpiNoQueryPayload(options: {
  categoryCodes?: readonly string[];
  topMonths?: number;
} = {}): SsbCpiNoQueryPayload {
  const categoryCodes = options.categoryCodes ?? [SSB_CPI_NO_FOOD_CATEGORY_CODE];
  const topMonths = options.topMonths ?? SSB_CPI_NO_DEFAULT_TOP_MONTHS;

  if (categoryCodes.length === 0) throw new Error('At least one SSB CPI category code is required.');
  if (!Number.isInteger(topMonths) || topMonths <= 0) throw new Error('topMonths must be a positive integer.');

  return {
    query: [
      { code: 'VareTjenesteGrp', selection: { filter: 'item', values: [...categoryCodes] } },
      { code: 'ContentsCode', selection: { filter: 'item', values: [SSB_CPI_NO_INDEX_CONTENT_CODE] } },
      { code: 'Tid', selection: { filter: 'top', values: [String(topMonths)] } }
    ],
    response: { format: 'JSON-stat2' }
  };
}

export async function fetchSsbCpiNoExternalIndexRows(options: {
  fetchImpl?: typeof fetch;
  categoryCodes?: readonly string[];
  topMonths?: number;
  retrievedAt?: string;
} = {}): Promise<SsbCpiNoExternalIndexRow[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const response = await fetchImpl(SSB_CPI_NO_ENDPOINT, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    },
    body: JSON.stringify(buildSsbCpiNoQueryPayload({
      categoryCodes: options.categoryCodes,
      topMonths: options.topMonths
    }))
  });

  if (!response.ok) {
    throw new Error(`SSB CPI NO request failed: ${response.status}`);
  }

  return parseSsbCpiNoExternalIndexRows(await response.json(), { retrievedAt });
}

export function parseSsbCpiNoExternalIndexRows(dataset: unknown, options: {
  retrievedAt: string;
  sourceUrl?: string;
}): SsbCpiNoExternalIndexRow[] {
  const parsed = parseDataset(dataset);
  const dimensionIds = parsed.id;
  const sizes = parsed.size;
  const categoryDimensionIndex = dimensionIds.indexOf('VareTjenesteGrp');
  const contentDimensionIndex = dimensionIds.indexOf('ContentsCode');
  const timeDimensionIndex = dimensionIds.indexOf('Tid');

  if (categoryDimensionIndex < 0 || contentDimensionIndex < 0 || timeDimensionIndex < 0) {
    throw new Error('SSB CPI NO JSON-stat2 response is missing one or more required dimensions.');
  }

  const categoryDimension = parsed.dimension?.VareTjenesteGrp;
  const contentDimension = parsed.dimension?.ContentsCode;
  const timeDimension = parsed.dimension?.Tid;
  const categoryIndex = categoryDimension?.category?.index ?? {};
  const contentIndex = contentDimension?.category?.index ?? {};
  const timeIndex = timeDimension?.category?.index ?? {};
  const contentPosition = contentIndex[SSB_CPI_NO_INDEX_CONTENT_CODE];

  if (contentPosition === undefined) throw new Error(`SSB CPI NO response is missing ${SSB_CPI_NO_INDEX_CONTENT_CODE}.`);

  const categoryEntries = Object.entries(categoryIndex).sort((a, b) => a[1] - b[1]);
  const timeEntries = Object.entries(timeIndex).sort((a, b) => a[1] - b[1]);
  const rows: SsbCpiNoExternalIndexRow[] = [];

  for (const [categoryCode, categoryPosition] of categoryEntries) {
    for (const [period, timePosition] of timeEntries) {
      const value = parsed.value[flatIndex(sizes, dimensionIds.map((dimensionId) => {
        if (dimensionId === 'VareTjenesteGrp') return categoryPosition;
        if (dimensionId === 'ContentsCode') return contentPosition;
        if (dimensionId === 'Tid') return timePosition;
        throw new Error("Unexpected SSB CPI NO dimension: " + dimensionId);
      }))];

      if (typeof value !== 'number' || !Number.isFinite(value)) continue;

      rows.push({
        source: 'SSB',
        countryCode: 'NO',
        tableId: SSB_CPI_NO_TABLE_ID,
        externalIndexId: `ssb:${SSB_CPI_NO_TABLE_ID}:${categoryCode}:${SSB_CPI_NO_INDEX_CONTENT_CODE}:${period}`,
        categoryCode,
        categoryLabel: categoryDimension?.category?.label?.[categoryCode] ?? categoryCode,
        contentCode: SSB_CPI_NO_INDEX_CONTENT_CODE,
        contentLabel: contentDimension?.category?.label?.[SSB_CPI_NO_INDEX_CONTENT_CODE] ?? 'Consumer Price Index',
        period,
        value,
        unit: 'index',
        basePeriod: '2025=100',
        sourceUrl: options.sourceUrl ?? SSB_CPI_NO_SOURCE_URL,
        retrievedAt: options.retrievedAt,
        sourceUpdatedAt: parsed.updated ?? null,
        emitsStorePrices: false,
        emitsSkuPrices: false
      });
    }
  }

  return rows;
}

function parseDataset(value: unknown): Required<Pick<SsbJsonStat2Dataset, 'id' | 'size' | 'value'>> & SsbJsonStat2Dataset {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('SSB CPI NO response must be a JSON-stat2 object.');
  }

  const dataset = value as SsbJsonStat2Dataset;
  if (!Array.isArray(dataset.id) || !dataset.id.every((id): id is string => typeof id === 'string')) {
    throw new Error('SSB CPI NO response id must be a string array.');
  }
  if (!Array.isArray(dataset.size) || !dataset.size.every((size): size is number => Number.isInteger(size) && size > 0)) {
    throw new Error('SSB CPI NO response size must be a positive integer array.');
  }
  if (dataset.id.length !== dataset.size.length) {
    throw new Error('SSB CPI NO response id/size dimension lengths differ.');
  }
  if (!Array.isArray(dataset.value)) {
    throw new Error('SSB CPI NO response value must be an array.');
  }

  return dataset as Required<Pick<SsbJsonStat2Dataset, 'id' | 'size' | 'value'>> & SsbJsonStat2Dataset;
}

function flatIndex(sizes: number[], positionsByDimensionIdOrder: number[]): number {
  if (sizes.length !== positionsByDimensionIdOrder.length) {
    throw new Error('SSB CPI NO dimension position count does not match response size.');
  }

  return positionsByDimensionIdOrder.reduce((offset, position, dimensionIndex) => {
    const stride = sizes.slice(dimensionIndex + 1).reduce((product, size) => product * size, 1);
    return offset + position * stride;
  }, 0);
}
