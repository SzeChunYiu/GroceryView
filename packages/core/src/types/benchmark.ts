export type CountryCode = 'SE' | 'NO' | 'IS';

export type EssentialsVertical = 'grocery' | 'pharmacy' | 'fuel';

export type OfficialIndexSourceId =
  | 'EUROSTAT_HICP'
  | 'SCB_CPI'
  | 'SSB_CPI_03013'
  | 'STATICE_CPI'
  | 'STATICE_ENERGY'
  | 'TLV_MEDICINES'
  | 'NOMA_MEDICINES'
  | 'EU_AGRI_FOOD';

export type BenchmarkFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'unknown';

export type BenchmarkPriceLayer =
  | 'consumer_index'
  | 'retail_observation'
  | 'regulated_reference'
  | 'upstream_agriculture'
  | 'energy_context';

export type BenchmarkStatus =
  | 'registry_only'
  | 'ingestion_planned'
  | 'ingestion_ready'
  | 'live';

export type EcoicopCode =
  | 'CP01' | 'CP011' | 'CP0111' | 'CP0112' | 'CP01121' | 'CP01122' | 'CP01124'
  | 'CP0113' | 'CP0114' | 'CP0115' | 'CP0116' | 'CP0117' | 'CP01174' | 'CP0121'
  | 'CP06' | 'CP061' | 'CP0611' | 'CP0612' | 'CP0613'
  | 'CP0722';

export interface OfficialBenchmarkCategory {
  code: EcoicopCode | string;
  label: string;
  vertical: EssentialsVertical;
  groceryViewCategory?: string;
  groceryViewCommodityIds?: string[];
  notes?: string;
}

export interface OfficialBenchmarkSource {
  id: OfficialIndexSourceId;
  label: string;
  countries: CountryCode[];
  verticals: EssentialsVertical[];
  layer: BenchmarkPriceLayer;
  frequency: BenchmarkFrequency;
  status: BenchmarkStatus;
  categories: OfficialBenchmarkCategory[];
  homepageUrl?: string;
  apiUrl?: string;
  notes: string;
}
