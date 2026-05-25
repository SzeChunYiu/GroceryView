import { SSB_CPI_03013_CRON, SSB_CPI_03013_ENDPOINT, SSB_CPI_03013_REGISTRY_STATUS, SSB_CPI_03013_SOURCE_ID } from './ssb-cpi-03013.js';
import { TLV_MEDICINES_CRON, TLV_MEDICINES_ENDPOINT, TLV_MEDICINES_REGISTRY_STATUS, TLV_MEDICINES_SOURCE_ID } from './tlv-medicines.js';

export type BenchmarkSourceRegistryEntry = Readonly<{
  sourceId: string;
  countries: readonly string[];
  verticals: readonly string[];
  frequency: 'monthly' | 'quarterly';
  endpointHint: 'https';
  endpoint: string;
  status: 'registry_only' | 'ingestion_ready' | 'live';
  cron: string;
  notes: string;
}>;

export const benchmarkSourceRegistry: readonly BenchmarkSourceRegistryEntry[] = [
  {
    sourceId: SSB_CPI_03013_SOURCE_ID,
    countries: ['NO'],
    verticals: ['grocery', 'pharmacy', 'fuel'],
    frequency: 'monthly',
    endpointHint: 'https',
    endpoint: SSB_CPI_03013_ENDPOINT,
    status: SSB_CPI_03013_REGISTRY_STATUS,
    cron: SSB_CPI_03013_CRON,
    notes: 'SSB CPI table 03013 JSON-stat2 feed for ECOICOP food, medicines, petrol, and diesel indexes; values are CPI index points only.'
  },
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
