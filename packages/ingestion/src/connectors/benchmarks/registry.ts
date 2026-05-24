export type BenchmarkSourceStatus = 'registry_only' | 'ingestion_ready' | 'live';

export const benchmarkSourceRegistry = [{
  source_id: 'EU_AGRI_FOOD',
  name: 'EU agri-food upstream prices',
  country: 'SE',
  vertical: 'grocery',
  frequency: 'weekly',
  status: 'ingestion_ready' as BenchmarkSourceStatus,
  label: 'upstream_agriculture'
}] as const;
