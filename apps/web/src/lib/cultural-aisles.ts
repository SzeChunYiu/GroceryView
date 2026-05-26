export type CulturalAisleFilter = 'all' | 'halal' | 'kosher' | 'asian' | 'middle-eastern' | 'polish-eastern-european' | 'african';

export type CulturalAisleTag = Exclude<CulturalAisleFilter, 'all'>;

export type CulturalAisleRow = {
  id: string;
  name: string;
  category: string;
  tags: CulturalAisleTag[];
  operatorName: string;
  retailerType: string;
  status: 'verified_chain' | 'verified_online_presence' | 'limited_verified_store' | 'verified_multi_location_specialty';
  confidenceLabel: string;
  availabilityLabel: string;
  cities: string[];
  sourceLabel: string;
  sourceUrl: string;
  parserVersion: string;
  evidenceText: string;
  caveat: string;
  productSearchHref: string;
};

export type CulturalAisleCoverageGap = {
  id: string;
  label: string;
  status: 'skipped_below_chain_threshold';
  confidenceLabel: string;
  evidenceLabel: string;
  sourceUrl: string;
};

export const culturalAisleFilters: Array<{ value: CulturalAisleFilter; label: string }> = [
  { value: 'all', label: 'All verified rows' },
  { value: 'halal', label: 'Halal evidence' },
  { value: 'kosher', label: 'Kosher evidence' },
  { value: 'asian', label: 'Asian aisle' },
  { value: 'middle-eastern', label: 'Middle Eastern aisle' },
  { value: 'polish-eastern-european', label: 'Polish and Eastern European aisle' },
  { value: 'african', label: 'African aisle' }
];

const sourceOnlyCaveat = 'Rows are sourced aisle or assortment evidence only. GroceryView does not infer religious suitability, certification, live stock, or prices from names alone.';

function productSearchHref(query: string, tag: CulturalAisleTag) {
  const params = new URLSearchParams({ q: query, cultural: tag });
  return `/products?${params.toString()}`;
}

export const verifiedCulturalAisles: CulturalAisleRow[] = [
  {
    id: 'halal-center-meat',
    name: 'Halal meat and deli assortment',
    category: 'meat_halal',
    tags: ['halal'],
    operatorName: 'Halal Center',
    retailerType: 'kosher_halal',
    status: 'verified_online_presence',
    confidenceLabel: 'Source-backed halal specialist assortment',
    availabilityLabel: 'National online presence; physical store coverage currently 1 verified store signal',
    cities: ['SE national'],
    sourceLabel: 'Halal Center official site',
    sourceUrl: 'https://www.halalcenter.se/',
    parserVersion: 'halal-center-se-v1',
    evidenceText: 'Halal Center source-backed meat, chicken, lamb, and deli category evidence.',
    caveat: sourceOnlyCaveat,
    productSearchHref: productSearchHref('halal meat', 'halal')
  },
  {
    id: 'halal-center-pantry',
    name: 'Halal pantry and frozen assortment',
    category: 'pantry_frozen_dairy',
    tags: ['halal'],
    operatorName: 'Halal Center',
    retailerType: 'kosher_halal',
    status: 'verified_online_presence',
    confidenceLabel: 'Source-backed halal specialist assortment',
    availabilityLabel: 'National online presence; category rows carry no SKU price',
    cities: ['SE national'],
    sourceLabel: 'Halal Center official site',
    sourceUrl: 'https://www.halalcenter.se/',
    parserVersion: 'halal-center-se-v1',
    evidenceText: 'Whitelisted pantry, frozen, dairy, and chilled halal assortment categories.',
    caveat: sourceOnlyCaveat,
    productSearchHref: productSearchHref('halal pantry frozen dairy', 'halal')
  },
  {
    id: 'kosher-deli-makolet',
    name: 'Kosher meat, dairy, pantry, sweets, and international food',
    category: 'kosher_grocery',
    tags: ['kosher'],
    operatorName: 'Makolet i Bajit',
    retailerType: 'kosher_halal',
    status: 'limited_verified_store',
    confidenceLabel: 'Limited single-store kosher coverage',
    availabilityLabel: 'One verified Stockholm kosher grocery/deli location',
    cities: ['Stockholm'],
    sourceLabel: 'JF Stockholm kosher information pages',
    sourceUrl: 'https://jfst.se/fler-tjanster/kosherinformation/kosherian-i-bajit-makolet/',
    parserVersion: 'kosher-deli-se-makolet-v1',
    evidenceText: 'Community and Stockholm guide pages describe Makolet as a shop for kosher goods, meat, cheese, dry goods, sweets, and more.',
    caveat: 'Primary sources verify one Stockholm store, so the finder labels coverage as limited instead of promoting a national chain.',
    productSearchHref: productSearchHref('kosher pantry dairy meat', 'kosher')
  },
  {
    id: 'antep-halal-meat',
    name: 'Halal meat and Middle Eastern deli assortment',
    category: 'meat_deli',
    tags: ['halal', 'middle-eastern'],
    operatorName: 'Antep Market',
    retailerType: 'ethnic_middle_eastern',
    status: 'verified_chain',
    confidenceLabel: 'Category-level halal evidence only',
    availabilityLabel: 'Verified multi-store Antep Market operation; not every aisle is marked halal',
    cities: ['Stockholm', 'Botkyrka', 'Malmo'],
    sourceLabel: 'Antep Market site',
    sourceUrl: 'https://www.antepmarket.se/',
    parserVersion: 'antep-se-v1',
    evidenceText: 'Whitelisted meat and deli pattern includes halal, meat, charcuterie, sucuk, and lamb evidence.',
    caveat: 'Only this meat/deli row carries halal evidence; bakery, produce, and pantry rows remain cultural-aisle rows without religious suitability claims.',
    productSearchHref: productSearchHref('halal sucuk lamb', 'halal')
  },
  {
    id: 'antep-pantry',
    name: 'Middle Eastern bakery, produce, and pantry assortment',
    category: 'bakery_produce_pantry',
    tags: ['middle-eastern'],
    operatorName: 'Antep Market',
    retailerType: 'ethnic_middle_eastern',
    status: 'verified_chain',
    confidenceLabel: 'Source-backed cultural aisle category',
    availabilityLabel: 'Verified multi-store Antep Market operation',
    cities: ['Stockholm', 'Botkyrka', 'Malmo'],
    sourceLabel: 'Antep Market site',
    sourceUrl: 'https://www.antepmarket.se/',
    parserVersion: 'antep-se-v1',
    evidenceText: 'Bakery, fresh produce, bulgur, rice, spices, tahini, lentils, and beans are matched only as Middle Eastern grocery-overlap categories.',
    caveat: sourceOnlyCaveat,
    productSearchHref: productSearchHref('bulgur tahini lentils pide', 'middle-eastern')
  },
  {
    id: 'tian-tian-asian',
    name: 'Asian rice, noodles, sauces, frozen, snacks, and beverages',
    category: 'asian_grocery',
    tags: ['asian'],
    operatorName: 'Tian Tian / Asian Express',
    retailerType: 'ethnic_asian',
    status: 'verified_chain',
    confidenceLabel: 'Verified Asian grocery operator',
    availabilityLabel: 'Operator-level coverage with source-backed grocery-overlap categories',
    cities: ['SE national'],
    sourceLabel: 'Tian Tian official storefront',
    sourceUrl: 'https://www.tiantian.se/',
    parserVersion: 'tian-tian-se-v1',
    evidenceText: 'Rice, noodles, sauces, condiments, frozen dumplings, pantry, snacks, sweets, drinks, and tea categories.',
    caveat: sourceOnlyCaveat,
    productSearchHref: productSearchHref('rice noodles soy sauce dumplings', 'asian')
  },
  {
    id: 'polmarket-polish',
    name: 'Polish bakery, deli, dairy, and pantry assortment',
    category: 'polish_grocery',
    tags: ['polish-eastern-european'],
    operatorName: 'Polmarket',
    retailerType: 'ethnic_polish_eastern_european',
    status: 'verified_chain',
    confidenceLabel: 'Verified three-store Polish grocery chain',
    availabilityLabel: 'Vallingby, Solna, and Norsborg stores verified by source evidence',
    cities: ['Vallingby', 'Solna', 'Norsborg'],
    sourceLabel: 'Polmarket official site',
    sourceUrl: 'https://www.polmarket.se/',
    parserVersion: 'polski-sklep-se-polmarket-v1',
    evidenceText: 'Source-backed Polish bread, bakery, charcuterie, cheese, dairy, and pantry assortment categories.',
    caveat: 'Generic Polish-store wording is not merged into one chain; this row targets the verified Polmarket operator only.',
    productSearchHref: productSearchHref('polish bread charcuterie cheese', 'polish-eastern-european')
  },
  {
    id: 'afroshop-african',
    name: 'African grains, legumes, spices, sauces, frozen meat/fish, and beverages',
    category: 'african_grocery',
    tags: ['african'],
    operatorName: 'AfroShop / African Centre Sweden',
    retailerType: 'ethnic_african',
    status: 'verified_multi_location_specialty',
    confidenceLabel: 'Verified multi-location African specialty coverage group',
    availabilityLabel: 'At least two Swedish African-specialty location signals in connector coverage',
    cities: ['Stockholm', 'Goteborg'],
    sourceLabel: 'AfroShop and African Centre public pages',
    sourceUrl: 'https://afroshop.se/',
    parserVersion: 'afroshop-se-african-centre-v1',
    evidenceText: 'Garri, fufu, cassava, beans, palm oil, egusi, suya, stockfish, goat meat, and malt drink grocery-overlap terms.',
    caveat: 'Non-food beauty, hair, textile, and money-transfer services are excluded by whitelist.',
    productSearchHref: productSearchHref('garri fufu palm oil beans', 'african')
  }
];

export const culturalAisleCoverageGaps: CulturalAisleCoverageGap[] = [
  {
    id: 'asia-supermarket-gbg',
    label: 'Asian Food Store Kville Saluhall',
    status: 'skipped_below_chain_threshold',
    confidenceLabel: 'One verified Gothenburg store, below the three-store chain connector threshold',
    evidenceLabel: 'Kept out of promoted chain results until more store evidence exists',
    sourceUrl: 'https://www.kvillessaluhall.se/butiker/asianfoodstore/'
  }
];

export function normalizeCulturalAisleFilter(value: string | string[] | undefined): CulturalAisleFilter {
  const candidate = Array.isArray(value) ? value[0] : value;
  return culturalAisleFilters.some((filter) => filter.value === candidate) ? candidate as CulturalAisleFilter : 'all';
}

export function culturalAisleRowsForFilter(filter: CulturalAisleFilter) {
  if (filter === 'all') return verifiedCulturalAisles;
  return verifiedCulturalAisles.filter((row) => row.tags.includes(filter));
}

export function culturalAisleFilterCount(filter: CulturalAisleFilter) {
  return culturalAisleRowsForFilter(filter).length;
}

export function culturalAisleCoverageSummary(rows = verifiedCulturalAisles) {
  return {
    rowCount: rows.length,
    operatorCount: new Set(rows.map((row) => row.operatorName)).size,
    cityCount: new Set(rows.flatMap((row) => row.cities)).size,
    sourceCount: new Set(rows.map((row) => row.sourceUrl)).size
  };
}
