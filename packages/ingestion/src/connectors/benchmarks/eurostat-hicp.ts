export const EUROSTAT_HICP_SOURCE_ID = 'EUROSTAT_HICP';
export const EUROSTAT_HICP_ENDPOINT = 'https://ec.europa.eu/eurostat/api/dissemination/sdmx/2.1/data/prc_hicp_midx';
export const EUROSTAT_HICP_UNIT = 'I15';
export const EUROSTAT_HICP_FREQUENCY = 'monthly';

export type EurostatHicpCountry = 'SE' | 'NO' | 'IS';
export type EurostatHicpVertical = 'grocery' | 'pharmacy' | 'fuel';

export type BenchmarkObservationRow = {
  source_id: typeof EUROSTAT_HICP_SOURCE_ID;
  country: EurostatHicpCountry;
  vertical: EurostatHicpVertical;
  ecoicop_code: string;
  period: string;
  value: number;
  unit: string;
  observed_at: string;
};

export type JsonStatDataset = {
  value?: Record<string, number | null> | Array<number | null>;
  updated?: string;
  dimension?: Record<string, { category?: { index?: Record<string, number>; label?: Record<string, string> } }>;
};

export type EurostatHicpSeries = {
  country: EurostatHicpCountry;
  vertical: EurostatHicpVertical;
  ecoicopCode: string;
};

export const EUROSTAT_HICP_SERIES: readonly EurostatHicpSeries[] = [
  { country: 'SE', vertical: 'grocery', ecoicopCode: 'CP01' },
  { country: 'NO', vertical: 'grocery', ecoicopCode: 'CP01' },
  { country: 'IS', vertical: 'grocery', ecoicopCode: 'CP01' },
  { country: 'SE', vertical: 'pharmacy', ecoicopCode: 'CP06' },
  { country: 'NO', vertical: 'pharmacy', ecoicopCode: 'CP06' },
  { country: 'IS', vertical: 'pharmacy', ecoicopCode: 'CP06' },
  { country: 'SE', vertical: 'fuel', ecoicopCode: 'CP0722' },
  { country: 'NO', vertical: 'fuel', ecoicopCode: 'CP0722' },
  { country: 'IS', vertical: 'fuel', ecoicopCode: 'CP0722' }
] as const;

export function buildEurostatHicpUrl(series: EurostatHicpSeries, startPeriod?: string) {
  const url = new URL(`${EUROSTAT_HICP_ENDPOINT}/M.${EUROSTAT_HICP_UNIT}.${series.ecoicopCode}.${series.country}`);
  url.searchParams.set('format', 'JSON');
  url.searchParams.set('compressed', 'false');
  if (startPeriod) url.searchParams.set('startPeriod', startPeriod);
  return url.toString();
}

function orderedCodes(dataset: JsonStatDataset, dimension: string) {
  const index = dataset.dimension?.[dimension]?.category?.index;
  if (!index) return [];
  return Object.entries(index).sort(([, left], [, right]) => left - right).map(([code]) => code);
}

function valueAt(dataset: JsonStatDataset, offset: number) {
  const value = Array.isArray(dataset.value) ? dataset.value[offset] : dataset.value?.[String(offset)];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function parseEurostatHicpJsonStat(
  dataset: JsonStatDataset,
  series: EurostatHicpSeries,
  observedAt = new Date().toISOString()
): BenchmarkObservationRow[] {
  return orderedCodes(dataset, 'time')
    .map((period, offset) => {
      const value = valueAt(dataset, offset);
      if (value === null) return null;
      return {
        source_id: EUROSTAT_HICP_SOURCE_ID,
        country: series.country,
        vertical: series.vertical,
        ecoicop_code: series.ecoicopCode,
        period,
        value,
        unit: 'index, 2015=100',
        observed_at: observedAt
      } satisfies BenchmarkObservationRow;
    })
    .filter((row): row is BenchmarkObservationRow => row !== null);
}

export async function fetchEurostatHicpBenchmarkRows(options: { fetchImpl?: typeof fetch; startPeriod?: string; observedAt?: string } = {}) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const rows: BenchmarkObservationRow[] = [];
  for (const series of EUROSTAT_HICP_SERIES) {
    const response = await fetchImpl(buildEurostatHicpUrl(series, options.startPeriod), { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Eurostat HICP request failed for ${series.country}/${series.ecoicopCode}: ${response.status}`);
    rows.push(...parseEurostatHicpJsonStat(await response.json() as JsonStatDataset, series, options.observedAt));
  }
  return rows;
}
