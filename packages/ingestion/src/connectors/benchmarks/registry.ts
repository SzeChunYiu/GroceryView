import { EU_AGRI_FOOD_CRON, EU_AGRI_FOOD_ENDPOINT, EU_AGRI_FOOD_REGISTRY_STATUS, EU_AGRI_FOOD_SOURCE_ID } from './eu-agri-food.js';
import { TLV_MEDICINES_CRON, TLV_MEDICINES_ENDPOINT, TLV_MEDICINES_REGISTRY_STATUS, TLV_MEDICINES_SOURCE_ID } from './tlv-medicines.js';

export type BenchmarkSourceRegistryEntry = Readonly<{
  sourceId: string;
  countries: readonly string[];
  verticals: readonly string[];
  frequency: 'quarterly' | 'weekly';
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
  },
  {
    sourceId: EU_AGRI_FOOD_SOURCE_ID,
    countries: ['SE'],
    verticals: ['grocery'],
    frequency: 'weekly',
    endpointHint: 'https',
    endpoint: EU_AGRI_FOOD_ENDPOINT,
    status: EU_AGRI_FOOD_REGISTRY_STATUS,
    cron: EU_AGRI_FOOD_CRON,
    notes: 'European Commission Agri-food Data Portal; label values as upstream_agriculture, not retail shelf price.'
  }
];
