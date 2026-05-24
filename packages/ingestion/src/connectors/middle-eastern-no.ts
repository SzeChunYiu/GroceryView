export const MIDDLE_EASTERN_NO_PARSER_VERSION = 'middle-eastern-no-v1';

export type MiddleEasternNoChainId = 'ims_internasjonalt_matsenter_no';
export type MiddleEasternNoCategoryId = 'ethnic_middle_eastern';

export type MiddleEasternNoSource = {
  sourceUrl: string;
  sourceName: string;
  evidence: string;
};

export type MiddleEasternNoChain = {
  chainId: MiddleEasternNoChainId;
  chainName: string;
  countryCode: 'NO';
  categoryId: MiddleEasternNoCategoryId;
  clearsBar: true;
  sourceUrls: string[];
  productSignals: string[];
  locationCount: number;
  provenance: {
    parserVersion: string;
    sources: MiddleEasternNoSource[];
  };
};

export type MiddleEasternNoMarketLocation = {
  chainId: MiddleEasternNoChainId;
  chainName: string;
  countryCode: 'NO';
  categoryId: MiddleEasternNoCategoryId;
  storeId: string;
  name: string;
  city: string;
  address: string;
  sourceUrl: string;
  retrievedAt: string;
  confidence: number;
  provenance: {
    parserVersion: string;
    sourceName: string;
    evidence: string;
  };
};

type VerifiedMiddleEasternNoChain = MiddleEasternNoChain & {
  locations: Omit<MiddleEasternNoMarketLocation, 'retrievedAt'>[];
};

export const IMS_HILLEVAAG_SOURCE_URL = 'https://www.kilden.no/store/ims-internasjonalt-matsenter-as/';
export const IMS_DRAMMEN_SOURCE_URL = 'https://www.torgetvest.no/store/ims-internasjonalt-matsenter';

const VERIFIED_MIDDLE_EASTERN_NO_CHAINS: VerifiedMiddleEasternNoChain[] = [{
  chainId: 'ims_internasjonalt_matsenter_no',
  chainName: 'IMS Internasjonalt Matsenter',
  countryCode: 'NO',
  categoryId: 'ethnic_middle_eastern',
  clearsBar: true,
  sourceUrls: [IMS_HILLEVAAG_SOURCE_URL, IMS_DRAMMEN_SOURCE_URL],
  productSignals: [
    'matvarer fra hele verden',
    'ferske og eksotiske grønnsaker',
    'halal kjøtt',
    'ferske naanbrød',
    'internasjonalt matsenter'
  ],
  locationCount: 2,
  provenance: {
    parserVersion: MIDDLE_EASTERN_NO_PARSER_VERSION,
    sources: [{
      sourceUrl: IMS_HILLEVAAG_SOURCE_URL,
      sourceName: 'Kilden IMS tenant page',
      evidence: 'IMS Hillevåg tenant page describes groceries from around the world, fresh exotic vegetables, halal meat, and fresh naan bread from its bakery at Gartnerveien 25.'
    }, {
      sourceUrl: IMS_DRAMMEN_SOURCE_URL,
      sourceName: 'Torget Vest IMS tenant page',
      evidence: 'Torget Vest lists IMS Internasjonalt Matsenter as a grocery tenant at the Drammen centre.'
    }]
  },
  locations: [{
    chainId: 'ims_internasjonalt_matsenter_no',
    chainName: 'IMS Internasjonalt Matsenter',
    countryCode: 'NO',
    categoryId: 'ethnic_middle_eastern',
    storeId: 'ims-hillevaag',
    name: 'IMS Hillevåg',
    city: 'Stavanger',
    address: 'Gartnerveien 25, 4016 Stavanger',
    sourceUrl: IMS_HILLEVAAG_SOURCE_URL,
    confidence: 0.85,
    provenance: {
      parserVersion: MIDDLE_EASTERN_NO_PARSER_VERSION,
      sourceName: 'Kilden IMS tenant page',
      evidence: 'IMS Hillevåg lies by Kilden kjøpesenter at Gartnerveien 25 and offers groceries from around the world, fresh exotic vegetables, halal meat, and fresh naan bread.'
    }
  }, {
    chainId: 'ims_internasjonalt_matsenter_no',
    chainName: 'IMS Internasjonalt Matsenter',
    countryCode: 'NO',
    categoryId: 'ethnic_middle_eastern',
    storeId: 'ims-drammen-torget-vest',
    name: 'IMS Drammen - Torget Vest',
    city: 'Drammen',
    address: 'Hauges gate 10, 3019 Drammen',
    sourceUrl: IMS_DRAMMEN_SOURCE_URL,
    confidence: 0.8,
    provenance: {
      parserVersion: MIDDLE_EASTERN_NO_PARSER_VERSION,
      sourceName: 'Torget Vest IMS tenant page',
      evidence: 'Torget Vest lists IMS Internasjonalt Matsenter as a grocery tenant at the Drammen centre.'
    }
  }]
}];

export function listMiddleEasternNoChains(): MiddleEasternNoChain[] {
  return VERIFIED_MIDDLE_EASTERN_NO_CHAINS.map(({ locations: _locations, ...chain }) => ({
    ...chain,
    sourceUrls: [...chain.sourceUrls],
    productSignals: [...chain.productSignals],
    provenance: {
      ...chain.provenance,
      sources: chain.provenance.sources.map((source) => ({ ...source }))
    }
  }));
}

export function listMiddleEasternNoMarketLocations(retrievedAt: string): MiddleEasternNoMarketLocation[] {
  return VERIFIED_MIDDLE_EASTERN_NO_CHAINS.flatMap((chain) => chain.locations.map((location) => ({
    ...location,
    retrievedAt,
    provenance: { ...location.provenance }
  })));
}

export async function fetchMiddleEasternNoMarketLocations(options: {
  retrievedAt?: string;
} = {}): Promise<MiddleEasternNoMarketLocation[]> {
  return listMiddleEasternNoMarketLocations(options.retrievedAt ?? new Date().toISOString());
}
