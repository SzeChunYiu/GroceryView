export type PriceDomainSlug = 'grocery' | 'fuel' | 'pharmacy';

export type PriceDomainItem = {
  id: string;
  label: string;
  comparableUnit: 'kg' | 'l' | 'st';
  matchKey: 'ean' | 'commodity' | 'fuel_grade';
};

export type PriceDomain = {
  slug: PriceDomainSlug;
  label: string;
  route: string;
  defaultCurrency: 'SEK' | 'NOK' | 'DKK' | 'EUR' | 'ISK';
  status: 'active' | 'foundation';
  itemMatchStrategy: string;
  locationStrategy: string;
  observationsTable: 'observations';
  priceClaim: string;
  priceClaimBoundary: string;
  seedItems: PriceDomainItem[];
};

export const SUPPORTED_PRICE_DOMAINS: PriceDomain[] = [
  {
    slug: 'grocery',
    label: 'Groceries',
    route: '/',
    defaultCurrency: 'SEK',
    status: 'active',
    itemMatchStrategy: 'EAN for branded goods, commodity_id plus comparable unit for loose food',
    locationStrategy: 'Retail chains and branch stores from verified grocery source connectors plus OSM coverage',
    observationsTable: 'observations',
    priceClaim: 'Active GroceryView terminal rows can render verified grocery prices with source confidence.',
    priceClaimBoundary: 'Grocery is the only domain allowed to show price observations in the current public terminal.',
    seedItems: [
      { id: 'grocery-ean', label: 'EAN packaged grocery item', comparableUnit: 'st', matchKey: 'ean' },
      { id: 'grocery-commodity', label: 'Canonical loose commodity', comparableUnit: 'kg', matchKey: 'commodity' }
    ]
  },
  {
    slug: 'fuel',
    label: 'Fuel',
    route: '/fuel',
    defaultCurrency: 'SEK',
    status: 'active',
    itemMatchStrategy: 'Fuel grade instead of EAN: 95 E10/E5, 98, Diesel, HVO100, and E85',
    locationStrategy: 'Fuel stations from OSM amenity=fuel plus operator price pages and trusted crowd price reports',
    observationsTable: 'observations',
    priceClaim: 'Fuel routes can render domain=fuel observations with price per litre and grade-level source provenance.',
    priceClaimBoundary: 'Fuel prices render only from operator public price pages or trusted crowd reports; no unsupported grade or station price is inferred.',
    seedItems: [
      { id: 'fuel-95-e10', label: '95 E10 / E5 petrol', comparableUnit: 'l', matchKey: 'fuel_grade' },
      { id: 'fuel-98', label: '98 petrol', comparableUnit: 'l', matchKey: 'fuel_grade' },
      { id: 'fuel-diesel', label: 'Diesel', comparableUnit: 'l', matchKey: 'fuel_grade' },
      { id: 'fuel-hvo100', label: 'HVO100', comparableUnit: 'l', matchKey: 'fuel_grade' },
      { id: 'fuel-e85', label: 'E85', comparableUnit: 'l', matchKey: 'fuel_grade' }
    ]
  },
  {
    slug: 'pharmacy',
    label: 'Pharmacy OTC',
    route: '/pharmacy',
    defaultCurrency: 'SEK',
    status: 'foundation',
    itemMatchStrategy: 'EAN matching for OTC products, supplements, and health/beauty items only',
    locationStrategy: 'Online and physical pharmacy operators; prescription medicine remains excluded from price comparison',
    observationsTable: 'observations',
    priceClaim: 'Pharmacy routes can explain OTC scope and future EAN-matched price comparisons.',
    priceClaimBoundary: 'No pharmacy price is rendered until domain=pharmacy observations exist; no medical advice or prescription comparison.',
    seedItems: [
      { id: 'otc-pharmacy', label: 'OTC product with EAN', comparableUnit: 'st', matchKey: 'ean' },
      { id: 'pharmacy-supplement', label: 'Supplement with EAN', comparableUnit: 'st', matchKey: 'ean' },
      { id: 'pharmacy-health-beauty', label: 'Health and beauty product with EAN', comparableUnit: 'st', matchKey: 'ean' }
    ]
  }
];

export function findPriceDomain(slug: string): PriceDomain | undefined {
  return SUPPORTED_PRICE_DOMAINS.find((domain) => domain.slug === slug);
}
