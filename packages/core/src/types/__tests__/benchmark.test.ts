import type {
  BenchmarkFrequency,
  BenchmarkPriceLayer,
  BenchmarkStatus,
  CountryCode,
  EcoicopCode,
  EssentialsVertical,
  OfficialIndexSourceId
} from '../benchmark.js';

type AssertNever<T extends never> = T;

const countryLabels = {
  SE: 'Sweden',
  NO: 'Norway',
  IS: 'Iceland'
} satisfies Record<CountryCode, string>;

const verticalLabels = {
  grocery: 'Grocery',
  pharmacy: 'Pharmacy',
  fuel: 'Fuel'
} satisfies Record<EssentialsVertical, string>;

const sourceLabels = {
  EUROSTAT_HICP: 'Eurostat HICP',
  SCB_CPI: 'SCB CPI',
  SSB_CPI_03013: 'SSB CPI 03013',
  STATICE_CPI: 'Statistics Iceland CPI',
  STATICE_ENERGY: 'Statistics Iceland energy',
  TLV_MEDICINES: 'TLV medicines',
  NOMA_MEDICINES: 'NOMA medicines',
  EU_AGRI_FOOD: 'EU agri-food'
} satisfies Record<OfficialIndexSourceId, string>;

const frequencyLabels = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annual',
  unknown: 'Unknown'
} satisfies Record<BenchmarkFrequency, string>;

const layerLabels = {
  consumer_index: 'Consumer index',
  retail_observation: 'Retail observation',
  regulated_reference: 'Regulated reference',
  upstream_agriculture: 'Upstream agriculture',
  energy_context: 'Energy context'
} satisfies Record<BenchmarkPriceLayer, string>;

const statusLabels = {
  registry_only: 'Registry only',
  ingestion_planned: 'Ingestion planned',
  ingestion_ready: 'Ingestion ready',
  live: 'Live'
} satisfies Record<BenchmarkStatus, string>;

const ecoicopLabels = {
  CP01: 'Food and non-alcoholic beverages',
  CP011: 'Food',
  CP0111: 'Bread and cereals',
  CP0112: 'Meat',
  CP01121: 'Beef and veal',
  CP01122: 'Pork',
  CP01124: 'Poultry',
  CP0113: 'Fish and seafood',
  CP0114: 'Milk, cheese and eggs',
  CP0115: 'Oils and fats',
  CP0116: 'Fruit',
  CP0117: 'Vegetables',
  CP01174: 'Potatoes',
  CP0121: 'Coffee, tea and cocoa',
  CP06: 'Health',
  CP061: 'Medical products, appliances and equipment',
  CP0611: 'Pharmaceutical products',
  CP0612: 'Other medical products',
  CP0613: 'Therapeutic appliances and equipment',
  CP0722: 'Fuels and lubricants for personal transport equipment'
} satisfies Record<EcoicopCode, string>;

void [countryLabels, verticalLabels, sourceLabels, frequencyLabels, layerLabels, statusLabels, ecoicopLabels];
export type BenchmarkTypeExhaustiveness = AssertNever<Exclude<CountryCode, keyof typeof countryLabels>>;
