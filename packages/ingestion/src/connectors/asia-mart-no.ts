export const ASIA_MART_NO_PARSER_VERSION = 'asia-mart-no-location-v1';

export type AsiaMartNoLocation = {
  country: 'NO';
  chain: 'asia-mart-no';
  retailerType: 'ethnic_asian';
  id: string;
  name: string;
  city: string;
  address: string;
  sourceUrl: string;
  provenance: {
    source: 'official_site' | 'directory_listing';
    parserVersion: string;
  };
};

export type AsiaMartNoChainStatus = {
  chain: 'asia-mart-no';
  chainName: 'Asia Mart / Asia Supermarket Norway';
  country: 'NO';
  retailerType: 'ethnic_asian';
  status: 'verified_multi_location_oslo_area';
  qualifiesForLocationConnector: true;
  qualifiesForOnlinePriceConnector: false;
  locations: AsiaMartNoLocation[];
  evidence: Array<{
    kind: 'official_site' | 'directory_listing';
    label: string;
    sourceUrl: string;
  }>;
  caveat: string;
};

const RAW_LOCATIONS = [
  {
    id: 'asia-supermarket-grunerlokka',
    name: 'Asia Supermarket',
    city: 'Oslo',
    address: 'Trondheimsveien 43, 0560 Oslo',
    sourceUrl: 'https://www.asiasupermarket.no/',
    source: 'official_site' as const
  },
  {
    id: 'asia-supermarket-okern',
    name: 'Asia Supermarket Økern',
    city: 'Oslo',
    address: 'Økern torgvei 3, 0580 Oslo',
    sourceUrl: 'https://www.proff.no/selskap/asia-supermarket/oslo/butikkhandel/IGDXVO210MC',
    source: 'directory_listing' as const
  }
];

export const ASIA_MART_NO_LOCATIONS: AsiaMartNoLocation[] = RAW_LOCATIONS.map((location) => ({
  country: 'NO',
  chain: 'asia-mart-no',
  retailerType: 'ethnic_asian',
  id: location.id,
  name: location.name,
  city: location.city,
  address: location.address,
  sourceUrl: location.sourceUrl,
  provenance: {
    source: location.source,
    parserVersion: ASIA_MART_NO_PARSER_VERSION
  }
}));

export const ASIA_MART_NO_CHAIN_STATUS: AsiaMartNoChainStatus = {
  chain: 'asia-mart-no',
  chainName: 'Asia Mart / Asia Supermarket Norway',
  country: 'NO',
  retailerType: 'ethnic_asian',
  status: 'verified_multi_location_oslo_area',
  qualifiesForLocationConnector: true,
  qualifiesForOnlinePriceConnector: false,
  locations: ASIA_MART_NO_LOCATIONS,
  evidence: [
    {
      kind: 'official_site',
      label: 'Asia Supermarket official site identifies the Oslo Asian grocery retailer.',
      sourceUrl: 'https://www.asiasupermarket.no/'
    },
    {
      kind: 'directory_listing',
      label: 'Business directory evidence separates an Økern torgvei location from the Trondheimsveien store.',
      sourceUrl: 'https://www.proff.no/selskap/asia-supermarket/oslo/butikkhandel/IGDXVO210MC'
    }
  ],
  caveat: 'This connector verifies Oslo-area ethnic Asian grocery locations only; no source-backed online price feed was identified, so it does not emit product prices.'
};

export async function fetchAsiaMartNoLocations(): Promise<AsiaMartNoLocation[]> {
  return ASIA_MART_NO_LOCATIONS;
}

export function verifyAsiaMartNoChainStatus(): AsiaMartNoChainStatus {
  return ASIA_MART_NO_CHAIN_STATUS;
}
