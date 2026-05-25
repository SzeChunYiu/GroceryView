import { TLV_MEDICINES_CRON, TLV_MEDICINES_ENDPOINT, TLV_MEDICINES_REGISTRY_STATUS, TLV_MEDICINES_SOURCE_ID } from './tlv-medicines.js';

export type BenchmarkSourceRegistryEntry = Readonly<{
  sourceId: string;
  countries: readonly string[];
  verticals: readonly string[];
  frequency: 'quarterly';
  endpointHint: 'https';
  endpoint: string;
  status: 'registry_only' | 'ingestion_ready' | 'live';
  cron: string;
  notes: string;
}>;

export const benchmarkSourceRegistry: readonly BenchmarkSourceRegistryEntry[] = [
  {
    sourceId: TLV_MEDICINES_SOURCE_ID,
    countries: ['SE'],
    verticals: ['pharmacy'],
    frequency: 'quarterly',
    endpointHint: 'https',
    endpoint: TLV_MEDICINES_ENDPOINT,
    status: TLV_MEDICINES_REGISTRY_STATUS,
    cron: TLV_MEDICINES_CRON,
    notes: 'TLV regulated reimbursement reference; label values as regulated_reference, not retail price.'
  }
];
