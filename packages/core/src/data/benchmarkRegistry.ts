import type { OfficialBenchmarkCategory, OfficialBenchmarkSource } from '../types/benchmark.js';

export const officialBenchmarkCategories: readonly OfficialBenchmarkCategory[] = [
  { code: 'CP01', label: 'Food and non-alcoholic beverages', vertical: 'grocery', groceryViewCategory: 'grocery', notes: 'Broad consumer-index aggregate; not a shelf-price basket.' },
  { code: 'CP011', label: 'Food', vertical: 'grocery', groceryViewCategory: 'food', notes: 'Food consumer-price index category.' },
  { code: 'CP0111', label: 'Bread and cereals', vertical: 'grocery', groceryViewCategory: 'bread-cereals' },
  { code: 'CP0112', label: 'Meat', vertical: 'grocery', groceryViewCategory: 'meat' },
  { code: 'CP01121', label: 'Beef and veal', vertical: 'grocery', groceryViewCategory: 'meat' },
  { code: 'CP01122', label: 'Pork', vertical: 'grocery', groceryViewCategory: 'meat' },
  { code: 'CP01124', label: 'Poultry', vertical: 'grocery', groceryViewCategory: 'meat' },
  { code: 'CP0113', label: 'Fish and seafood', vertical: 'grocery', groceryViewCategory: 'fish-seafood' },
  { code: 'CP0114', label: 'Milk, cheese and eggs', vertical: 'grocery', groceryViewCategory: 'dairy-eggs' },
  { code: 'CP0115', label: 'Oils and fats', vertical: 'grocery', groceryViewCategory: 'oils-fats' },
  { code: 'CP0116', label: 'Fruit', vertical: 'grocery', groceryViewCategory: 'fruit' },
  { code: 'CP0117', label: 'Vegetables', vertical: 'grocery', groceryViewCategory: 'vegetables' },
  { code: 'CP01174', label: 'Potatoes', vertical: 'grocery', groceryViewCategory: 'vegetables' },
  { code: 'CP0121', label: 'Coffee, tea and cocoa', vertical: 'grocery', groceryViewCategory: 'pantry' },
  { code: 'CP06', label: 'Health', vertical: 'pharmacy', groceryViewCategory: 'pharmacy', notes: 'Health CPI aggregate; includes more than pharmacy retail.' },
  { code: 'CP061', label: 'Medical products, appliances and equipment', vertical: 'pharmacy', groceryViewCategory: 'pharmacy' },
  { code: 'CP0611', label: 'Pharmaceutical products', vertical: 'pharmacy', groceryViewCategory: 'medicines' },
  { code: 'CP0612', label: 'Other medical products', vertical: 'pharmacy', groceryViewCategory: 'medical-products' },
  { code: 'CP0613', label: 'Therapeutic appliances and equipment', vertical: 'pharmacy', groceryViewCategory: 'medical-devices' },
  { code: 'CP0722', label: 'Fuels and lubricants for personal transport equipment', vertical: 'fuel', groceryViewCategory: 'fuel' }
];

const groceryCategories = officialBenchmarkCategories.filter((category) => category.vertical === 'grocery');
const pharmacyCategories = officialBenchmarkCategories.filter((category) => category.vertical === 'pharmacy');
const fuelCategories = officialBenchmarkCategories.filter((category) => category.vertical === 'fuel');
const allCategories = [...officialBenchmarkCategories];

export const officialBenchmarkRegistry: readonly OfficialBenchmarkSource[] = [
  {
    id: 'EUROSTAT_HICP',
    label: 'Eurostat HICP / ECOICOP',
    countries: ['SE', 'NO', 'IS'],
    verticals: ['grocery', 'pharmacy', 'fuel'],
    layer: 'consumer_index',
    frequency: 'monthly',
    status: 'registry_only',
    categories: allCategories,
    homepageUrl: 'https://ec.europa.eu/eurostat/web/hicp/database',
    apiUrl: 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_midx',
    notes: 'Cross-country HICP/ECOICOP consumer inflation benchmark for household expenditure categories. It measures index movement, not individual GroceryView retail observations or supermarket shelf prices; layer label must read consumer index.'
  },
  {
    id: 'SCB_CPI',
    label: 'Statistics Sweden CPI (KPI)',
    countries: ['SE'],
    verticals: ['grocery', 'pharmacy', 'fuel'],
    layer: 'consumer_index',
    frequency: 'monthly',
    status: 'registry_only',
    categories: allCategories,
    homepageUrl: 'https://www.scb.se/pr0101',
    apiUrl: 'https://api.scb.se/OV0104/v1/doris/en/ssd/START/PR/PR0101',
    notes: 'Swedish national CPI benchmark from SCB for price development by consumption group. It is a consumer index over representative baskets and must not be displayed as GroceryView scraped retail observations; layer label must read consumer index.'
  },
  {
    id: 'SSB_CPI_03013',
    label: 'Statistics Norway CPI table 03013',
    countries: ['NO'],
    verticals: ['grocery', 'pharmacy', 'fuel'],
    layer: 'consumer_index',
    frequency: 'monthly',
    status: 'registry_only',
    categories: allCategories,
    homepageUrl: 'https://www.ssb.no/en/statbank/table/03013',
    apiUrl: 'https://data.ssb.no/api/v0/en/table/03013',
    notes: 'Norwegian CPI by consumption group and month, including food, pharmaceutical products, petrol, diesel, and fuels/lubricants where available. It is official consumer-index context, not a live GroceryView retail price feed; layer label must read consumer index.'
  },
  {
    id: 'STATICE_CPI',
    label: 'Statistics Iceland CPI / HICP',
    countries: ['IS'],
    verticals: ['grocery', 'pharmacy', 'fuel'],
    layer: 'consumer_index',
    frequency: 'monthly',
    status: 'registry_only',
    categories: allCategories,
    homepageUrl: 'https://statice.is/statistics/economy/prices/consumer-price-index/',
    apiUrl: 'https://px.hagstofa.is/pxen/api/v1/en/Efnahagur/',
    notes: 'Icelandic CPI/HICP benchmark published monthly by Statistics Iceland. It measures consumer price-index movement and is separate from any GroceryView Iceland retail observations; layer label must read consumer index.'
  },
  {
    id: 'STATICE_ENERGY',
    label: 'Statistics Iceland energy prices',
    countries: ['IS'],
    verticals: ['fuel'],
    layer: 'energy_context',
    frequency: 'monthly',
    status: 'registry_only',
    categories: fuelCategories,
    homepageUrl: 'https://statice.is/statistics/environment/energy/energy-prices/',
    apiUrl: 'https://px.hagstofa.is/pxen/api/v1/en/Umhverfi/Orka/',
    notes: 'Iceland energy-price context for fuel and electricity-related market analysis. It is contextual energy statistics, not GroceryView station retail observations; layer label must read energy context.'
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
    homepageUrl: 'https://www.tlv.se/in-english/prices-in-our-database.html',
    apiUrl: 'https://www.tlv.se/om-tlv/oppna-data.html',
    notes: 'Swedish TLV reimbursement and medicine price reference for products in the high-cost threshold system. It is a regulated reimbursement/reference layer and must be labelled as regulated reference, not normal retail price.'
  },
  {
    id: 'NOMA_MEDICINES',
    label: 'Norwegian Medical Products Agency maximum prices',
    countries: ['NO'],
    verticals: ['pharmacy'],
    layer: 'regulated_reference',
    frequency: 'quarterly',
    status: 'registry_only',
    categories: pharmacyCategories,
    homepageUrl: 'https://www.dmp.no/en/public-funding-and-pricing/pricing-of-medicines/maximum-price',
    apiUrl: 'https://www.dmp.no/en/public-funding-and-pricing/pricing-of-medicines/maximum-price',
    notes: 'Norwegian maximum pharmacy purchase/retail price reference for prescription medicines. It caps regulated medicine prices and must be labelled as regulated reference, not a normal retail price or GroceryView pharmacy observation.'
  },
  {
    id: 'EU_AGRI_FOOD',
    label: 'EU Agri-food Data Portal market prices',
    countries: ['SE'],
    verticals: ['grocery'],
    layer: 'upstream_agriculture',
    frequency: 'weekly',
    status: 'registry_only',
    categories: groceryCategories,
    homepageUrl: 'https://agridata.ec.europa.eu/extensions/dataportal/agricultural_markets.html',
    apiUrl: 'https://agridata.ec.europa.eu/extensions/API_Documentation/API-Guide.html',
    notes: 'EU upstream agriculture and wholesale context for meat, dairy, eggs, cereals, fruit, and vegetables. It is not supermarket shelf price evidence and must be labelled upstream / wholesale / agricultural context.'
  }
];
