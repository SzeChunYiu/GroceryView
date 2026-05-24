import type { EcoicopCode, OfficialBenchmarkCategory, OfficialBenchmarkSource } from '../types/benchmark.js';

const ecoicopCategories: Array<{ code: EcoicopCode; label: string; vertical: 'grocery' | 'pharmacy' | 'fuel'; groceryViewCategory?: string }> = [
  { code: 'CP01', label: 'Food and non-alcoholic beverages', vertical: 'grocery', groceryViewCategory: 'grocery' },
  { code: 'CP011', label: 'Food', vertical: 'grocery', groceryViewCategory: 'food' },
  { code: 'CP0111', label: 'Bread and cereals', vertical: 'grocery', groceryViewCategory: 'bakery-cereal' },
  { code: 'CP0112', label: 'Meat', vertical: 'grocery', groceryViewCategory: 'meat' },
  { code: 'CP01121', label: 'Beef and veal', vertical: 'grocery', groceryViewCategory: 'meat' },
  { code: 'CP01122', label: 'Pork', vertical: 'grocery', groceryViewCategory: 'meat' },
  { code: 'CP01124', label: 'Poultry', vertical: 'grocery', groceryViewCategory: 'meat' },
  { code: 'CP0113', label: 'Fish and seafood', vertical: 'grocery', groceryViewCategory: 'fish' },
  { code: 'CP0114', label: 'Milk, cheese and eggs', vertical: 'grocery', groceryViewCategory: 'dairy-eggs' },
  { code: 'CP0115', label: 'Oils and fats', vertical: 'grocery', groceryViewCategory: 'oils-fats' },
  { code: 'CP0116', label: 'Fruit', vertical: 'grocery', groceryViewCategory: 'fruit' },
  { code: 'CP0117', label: 'Vegetables', vertical: 'grocery', groceryViewCategory: 'vegetables' },
  { code: 'CP01174', label: 'Potatoes', vertical: 'grocery', groceryViewCategory: 'vegetables' },
  { code: 'CP0121', label: 'Coffee, tea and cocoa', vertical: 'grocery', groceryViewCategory: 'coffee-tea' },
  { code: 'CP06', label: 'Health', vertical: 'pharmacy', groceryViewCategory: 'pharmacy' },
  { code: 'CP061', label: 'Medical products, appliances and equipment', vertical: 'pharmacy', groceryViewCategory: 'pharmacy' },
  { code: 'CP0611', label: 'Pharmaceutical products', vertical: 'pharmacy', groceryViewCategory: 'medicine' },
  { code: 'CP0612', label: 'Other medical products', vertical: 'pharmacy', groceryViewCategory: 'medicine' },
  { code: 'CP0613', label: 'Therapeutic appliances and equipment', vertical: 'pharmacy', groceryViewCategory: 'medical-equipment' },
  { code: 'CP0722', label: 'Fuels and lubricants for personal transport equipment', vertical: 'fuel', groceryViewCategory: 'fuel' },
];

const allEcoicopCategories: OfficialBenchmarkCategory[] = ecoicopCategories.map((category) => ({
  ...category,
  notes: 'Official consumer index category; not a GroceryView shelf-price observation.'
}));

const groceryCategories = allEcoicopCategories.filter((category) => category.vertical === 'grocery');
const pharmacyCategories = allEcoicopCategories.filter((category) => category.vertical === 'pharmacy');
const fuelCategories = allEcoicopCategories.filter((category) => category.vertical === 'fuel');

export const benchmarkRegistry: OfficialBenchmarkSource[] = [
  {
    id: 'EUROSTAT_HICP',
    label: 'Eurostat Harmonised Index of Consumer Prices (HICP)',
    countries: ['SE', 'NO', 'IS'],
    verticals: ['grocery', 'pharmacy', 'fuel'],
    layer: 'consumer_index',
    frequency: 'monthly',
    status: 'registry_only',
    categories: allEcoicopCategories,
    homepageUrl: 'https://ec.europa.eu/eurostat/web/hicp/information-data',
    apiUrl: 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_midx',
    notes: 'Cross-country HICP consumer-index benchmark for ECOICOP categories. It measures official consumer price index movement, not scraped GroceryView retail observations or current shelf prices.'
  },
  {
    id: 'SCB_CPI',
    label: 'Statistics Sweden Consumer Price Index',
    countries: ['SE'],
    verticals: ['grocery', 'pharmacy', 'fuel'],
    layer: 'consumer_index',
    frequency: 'monthly',
    status: 'registry_only',
    categories: allEcoicopCategories,
    homepageUrl: 'https://www.scb.se/en/services/open-data-api/',
    apiUrl: 'https://api.scb.se/OV0104/v1/doris/en/ssd',
    notes: 'Swedish national CPI benchmark from SCB. This is a monthly official consumer index and must not be displayed as a live product price or GroceryView retail observation.'
  },
  {
    id: 'SSB_CPI_03013',
    label: 'Statistics Norway CPI table 03013',
    countries: ['NO'],
    verticals: ['grocery', 'pharmacy', 'fuel'],
    layer: 'consumer_index',
    frequency: 'monthly',
    status: 'registry_only',
    categories: allEcoicopCategories,
    homepageUrl: 'https://www.ssb.no/en/statbank/table/03013',
    apiUrl: 'https://data.ssb.no/api/v0/en/table/03013',
    notes: 'Norwegian CPI by consumption group and month, including food, pharmaceutical products, petrol, diesel, and fuels/lubricants where available. It is an official consumer index, not a GroceryView scraped shelf price.'
  },
  {
    id: 'STATICE_CPI',
    label: 'Statistics Iceland CPI / HICP',
    countries: ['IS'],
    verticals: ['grocery', 'pharmacy', 'fuel'],
    layer: 'consumer_index',
    frequency: 'monthly',
    status: 'registry_only',
    categories: allEcoicopCategories,
    homepageUrl: 'https://statice.is/statistics/economy/prices/consumer-price-index/',
    apiUrl: 'https://px.hagstofa.is/pxen/api/v1/en/Efnahagur/visitolur/',
    notes: 'Icelandic CPI/HICP benchmark for consumer price categories. It documents official index movement and remains separate from GroceryView retail price observations.'
  },
  {
    id: 'STATICE_ENERGY',
    label: 'Statistics Iceland energy price context',
    countries: ['IS'],
    verticals: ['fuel'],
    layer: 'energy_context',
    frequency: 'monthly',
    status: 'registry_only',
    categories: fuelCategories,
    homepageUrl: 'https://statice.is/statistics/business-sectors/energy/',
    apiUrl: 'https://px.hagstofa.is/pxen/api/v1/en/',
    notes: 'Iceland energy/fuel context for interpreting fuel costs. This is an energy-context layer, not a GroceryView station-level observed pump price.'
  },
  {
    id: 'TLV_MEDICINES',
    label: 'TLV medicines price and reimbursement database',
    countries: ['SE'],
    verticals: ['pharmacy'],
    layer: 'regulated_reference',
    frequency: 'quarterly',
    status: 'registry_only',
    categories: pharmacyCategories,
    homepageUrl: 'https://www.tlv.se/beslut/sok-priser-och-beslut-i-databasen.html',
    apiUrl: 'https://www.tlv.se/om-tlv/oppna-data.html',
    notes: 'Swedish regulated medicine and reimbursement reference. UI must label this as a regulated reference, not a normal retail or pharmacy shelf price.'
  },
  {
    id: 'NOMA_MEDICINES',
    label: 'Norwegian Medical Products Agency maximum and stepped prices',
    countries: ['NO'],
    verticals: ['pharmacy'],
    layer: 'regulated_reference',
    frequency: 'quarterly',
    status: 'registry_only',
    categories: pharmacyCategories,
    homepageUrl: 'https://www.dmp.no/en/public-funding-and-pricing/pricing-of-medicines/maximum-price',
    apiUrl: 'https://www.dmp.no/en/public-funding-and-pricing/pricing-of-medicines/maximum-price',
    notes: 'Norwegian maximum-price and stepped-price medicine reference. It constrains regulated medicines and must not be presented as a live retail pharmacy price.'
  },
  {
    id: 'EU_AGRI_FOOD',
    label: 'European Commission agri-food market price data',
    countries: ['SE'],
    verticals: ['grocery'],
    layer: 'upstream_agriculture',
    frequency: 'weekly',
    status: 'registry_only',
    categories: groceryCategories.filter((category) => ['CP0112', 'CP01121', 'CP01122', 'CP01124', 'CP0114', 'CP0116', 'CP0117', 'CP01174', 'CP0111'].includes(category.code)),
    homepageUrl: 'https://agriculture.ec.europa.eu/data-and-analysis/markets/price-data_en',
    apiUrl: 'https://agridata.ec.europa.eu/extensions/DataPortal/agricultural_markets.html',
    notes: 'EU upstream agricultural market context for meat, dairy, eggs, cereals, fruit, and vegetables. It is wholesale/agricultural context, not a supermarket shelf price.'
  }
];
