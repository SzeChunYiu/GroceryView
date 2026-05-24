export type HagstofaCpiFoodIndexRow = {
  row_type: 'external_index';
  source: 'hagstofa';
  country: 'IS';
  index_id: 'cpi_food';
  category_code: string;
  category_name: string;
  period: string;
  value: number;
  unit: 'index';
  source_url: string;
};

export type HagstofaJsonStatResponse = {
  value?: unknown[];
  dimension?: Record<string, { category?: { index?: Record<string, number>; label?: Record<string, string> } }>;
};

export const HAGSTOFA_CPI_PAGE_URL = 'https://www.hagstofa.is/talnaefni/efnahagur/verdlag/visitala-neysluverds/';
export const HAGSTOFA_PXWEB_API_BASE = 'https://px.hagstofa.is/pxis/api/v1/is/Efnahagur/visitolur/1_vnv';
export const HAGSTOFA_CPI_FOOD_CATEGORY = { code: '01', name: 'Matur og drykkjarvörur' } as const;

export function buildHagstofaCpiFoodIndexQuery(periods: string[] = ['*']) {
  return {
    query: [
      { code: 'Vísitala', selection: { filter: 'item', values: [HAGSTOFA_CPI_FOOD_CATEGORY.code] } },
      { code: 'Mánuður', selection: { filter: periods.length === 1 && periods[0] === '*' ? 'all' : 'item', values: periods } },
    ],
    response: { format: 'JSON-stat2' },
  };
}

function sortedKeysByIndex(index: Record<string, number> = {}) {
  return Object.entries(index)
    .sort((left, right) => left[1] - right[1])
    .map(([key]) => key);
}

export function parseHagstofaCpiFoodIndexResponse(response: HagstofaJsonStatResponse, sourceUrl = HAGSTOFA_PXWEB_API_BASE): HagstofaCpiFoodIndexRow[] {
  const values = response.value ?? [];
  const dimensions = response.dimension ?? {};
  const categoryDimension = dimensions['Vísitala'] ?? dimensions.Visitala ?? dimensions.vísitala;
  const periodDimension = dimensions['Mánuður'] ?? dimensions.Manudur ?? dimensions.month;
  const categoryKeys = sortedKeysByIndex(categoryDimension?.category?.index).filter((key) => key === HAGSTOFA_CPI_FOOD_CATEGORY.code);
  const periodKeys = sortedKeysByIndex(periodDimension?.category?.index);

  return categoryKeys.flatMap((categoryKey, categoryOffset) => periodKeys.map((period, periodOffset) => {
    const rawValue = values[(categoryOffset * periodKeys.length) + periodOffset];
    const value = typeof rawValue === 'number' ? rawValue : Number(rawValue);
    if (!Number.isFinite(value)) return null;

    return {
      row_type: 'external_index',
      source: 'hagstofa',
      country: 'IS',
      index_id: 'cpi_food',
      category_code: categoryKey,
      category_name: categoryDimension?.category?.label?.[categoryKey] ?? HAGSTOFA_CPI_FOOD_CATEGORY.name,
      period,
      value,
      unit: 'index',
      source_url: sourceUrl,
    } satisfies HagstofaCpiFoodIndexRow;
  })).filter((row): row is HagstofaCpiFoodIndexRow => row !== null);
}
