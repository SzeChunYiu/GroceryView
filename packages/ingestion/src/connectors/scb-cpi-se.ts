export type ScbCpiSeExternalIndexRow = {
  rowType: 'external_index';
  provider: 'SCB';
  country: 'SE';
  indexFamily: 'KPI';
  tableId: 'KPI2020COICOPM';
  categoryCode: string;
  categoryLabel: string;
  period: string;
  observedAt: string;
  value: number;
  unit: 'index';
  cadence: 'monthly';
  sourceUrl: string;
  fetchedAt: string;
  updatedAt: string | null;
  provenance: {
    source: 'api.scb.se';
    api: 'PxWeb v1';
    contentCode: '0000080H';
    responseFormat: 'JSON-stat2';
  };
};

type ScbJsonStatDimension = {
  category: {
    index: Record<string, number> | string[];
    label?: Record<string, string>;
  };
};

type ScbJsonStatDataset = {
  id: string[];
  size: number[];
  value: Array<number | null>;
  updated?: string;
  dimension: Record<string, ScbJsonStatDimension>;
};

export const SCB_CPI_SE_FOOD_ENDPOINT = 'https://api.scb.se/OV0104/v1/doris/sv/ssd/PR/PR0101/PR0101A/KPI2020COICOPM';
export const SCB_CPI_SE_CONTENT_CODE = '0000080H';
export const SCB_CPI_SE_FOOD_CATEGORY_CODES = [
  '01',
  '01.1',
  '01.2',
  '01.1.1',
  '01.1.2',
  '01.1.3',
  '01.1.4',
  '01.1.5',
  '01.1.6',
  '01.1.7',
  '01.1.8',
  '01.1.9',
  '01.2.1',
  '01.2.2',
  '01.2.3',
  '01.2.5',
  '01.2.6',
  '01.2.9'
] as const;

export function buildScbCpiSeFoodPayload(months = 12) {
  return {
    query: [
      { code: 'VaruTjanstegrupp', selection: { filter: 'item', values: [...SCB_CPI_SE_FOOD_CATEGORY_CODES] } },
      { code: 'ContentsCode', selection: { filter: 'item', values: [SCB_CPI_SE_CONTENT_CODE] } },
      { code: 'Tid', selection: { filter: 'top', values: [String(months)] } }
    ],
    response: { format: 'JSON-stat2' }
  };
}

function orderedCodes(dimension: ScbJsonStatDimension): string[] {
  const index = dimension.category.index;
  if (Array.isArray(index)) return index;
  return Object.entries(index)
    .sort((left, right) => left[1] - right[1])
    .map(([code]) => code);
}

function jsonStatOffset(dataset: ScbJsonStatDataset, coordinates: Record<string, number>) {
  return dataset.id.reduce((offset, dimensionId, index) => offset * dataset.size[index]! + coordinates[dimensionId]!, 0);
}

function periodLabel(periodCode: string) {
  return periodCode.replace('M', '-');
}

export function parseScbCpiSeJsonStat(input: {
  dataset: ScbJsonStatDataset;
  sourceUrl?: string;
  fetchedAt: string;
}): ScbCpiSeExternalIndexRow[] {
  const sourceUrl = input.sourceUrl ?? SCB_CPI_SE_FOOD_ENDPOINT;
  const dataset = input.dataset;
  const categoryDimension = dataset.dimension.VaruTjanstegrupp;
  const contentDimension = dataset.dimension.ContentsCode;
  const timeDimension = dataset.dimension.Tid;
  if (!categoryDimension || !contentDimension || !timeDimension) throw new Error('SCB CPI response missing required dimensions.');

  const categoryCodes = orderedCodes(categoryDimension);
  const contentCodes = orderedCodes(contentDimension);
  const timeCodes = orderedCodes(timeDimension);
  const contentIndex = contentCodes.indexOf(SCB_CPI_SE_CONTENT_CODE);
  if (contentIndex < 0) throw new Error(`SCB CPI response missing content code ${SCB_CPI_SE_CONTENT_CODE}.`);

  const rows: ScbCpiSeExternalIndexRow[] = [];
  categoryCodes.forEach((categoryCode, categoryIndex) => {
    timeCodes.forEach((timeCode, timeIndex) => {
      const offset = jsonStatOffset(dataset, {
        VaruTjanstegrupp: categoryIndex,
        ContentsCode: contentIndex,
        Tid: timeIndex
      });
      const value = dataset.value[offset];
      if (value == null || !Number.isFinite(value)) return;
      const period = periodLabel(timeCode);
      rows.push({
        rowType: 'external_index',
        provider: 'SCB',
        country: 'SE',
        indexFamily: 'KPI',
        tableId: 'KPI2020COICOPM',
        categoryCode,
        categoryLabel: categoryDimension.category.label?.[categoryCode] ?? categoryCode,
        period,
        observedAt: `${period}-01T00:00:00.000Z`,
        value,
        unit: 'index',
        cadence: 'monthly',
        sourceUrl,
        fetchedAt: input.fetchedAt,
        updatedAt: dataset.updated ?? null,
        provenance: {
          source: 'api.scb.se',
          api: 'PxWeb v1',
          contentCode: SCB_CPI_SE_CONTENT_CODE,
          responseFormat: 'JSON-stat2'
        }
      });
    });
  });

  return rows.sort((left, right) => left.categoryCode.localeCompare(right.categoryCode, 'sv') || left.period.localeCompare(right.period));
}

export async function fetchScbCpiSeFoodIndices(options: {
  fetchImpl?: typeof fetch;
  fetchedAt?: string;
  months?: number;
  sourceUrl?: string;
} = {}): Promise<ScbCpiSeExternalIndexRow[]> {
  const sourceUrl = options.sourceUrl ?? SCB_CPI_SE_FOOD_ENDPOINT;
  const fetchedAt = options.fetchedAt ?? new Date().toISOString();
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(sourceUrl, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'user-agent': 'GroceryView SCB CPI connector (+https://groceryview.example)'
    },
    body: JSON.stringify(buildScbCpiSeFoodPayload(options.months ?? 12))
  });
  if (!response.ok) throw new Error(`SCB CPI food index source failed with HTTP ${response.status}.`);
  return parseScbCpiSeJsonStat({
    dataset: await response.json() as ScbJsonStatDataset,
    sourceUrl,
    fetchedAt
  });
}
