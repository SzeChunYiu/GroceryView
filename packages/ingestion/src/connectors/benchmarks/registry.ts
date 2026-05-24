export type BenchmarkSourceStatus = 'registry_only' | 'ingestion_ready' | 'live';

export type BenchmarkSourceRegistryEntry = {
  sourceId: string;
  name: string;
  country: string;
  vertical: string;
  frequency: 'quarterly';
  status: BenchmarkSourceStatus;
  connectorPath: string;
  sourceUrl: string;
  valueLabel: string;
};

export const benchmarkSourceRegistry: BenchmarkSourceRegistryEntry[] = [
  {
    sourceId: 'NOMA_MEDICINES',
    name: 'NoMA Norwegian max prices',
    country: 'NO',
    vertical: 'pharmacy',
    frequency: 'quarterly',
    status: 'live',
    connectorPath: 'packages/ingestion/src/connectors/benchmarks/noma-medicines.ts',
    sourceUrl: 'https://www.dmp.no/contentassets/fed1be54a81f4ec99a2329ca0fd0964c/package-prices-2026-05-04.xlsx',
    valueLabel: 'regulated_reference'
  }
];
